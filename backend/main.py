import logging
import time
from typing import List
from uuid import UUID

import uvicorn
from db.database import get_db
from db.utils import (
    add_new_application,
    add_new_scraped_jobs,
    discard_application_by_id,
    get_all_applications,
    get_all_jobs,
    get_application_by_id,
    get_application_by_job_id,
    get_job_by_id,
    get_reviewed_jobs,
    get_unapproved_applications,
    get_unprepared_applications,
    get_unreviewed_jobs,
    update_application_by_id,
    update_application_by_id_with_fragment,
    update_job_by_id,
)
from fastapi import (
    BackgroundTasks,
    Body,
    Depends,
    FastAPI,
    Query,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from src.apply import (
    DOMAIN_HANDLERS,
    evaluate_candidate_aptitude,
    prepare_job_app,
    scrape_job_app,
    submit_app,
)
from src.definitions import App, AppFragment, Job, User
from src.jobs import save_jobs
from src.utils import get_base_url

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(), logging.FileHandler("debug.log")],
)

app = FastAPI(title="Job Application API")

# Allow requests from your frontend (e.g., http://localhost:3000)
origins = [
    "http://localhost:3000",
    # Add more origins if needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # List of allowed origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)


# ConnectionManager for handling WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except WebSocketDisconnect:
                logging.warning(
                    f"WebSocket disconnected during broadcast: {connection.client}"
                )
                self.disconnect(connection)
            except Exception as e:
                logging.error(
                    f"Error broadcasting to {connection.client}: {str(e)}",
                    exc_info=True,
                )


manager = ConnectionManager()

DEFAULT_JOBS_TO_FIND = 500

# Keep the user configuration
user = User(
    first_name="AJ",
    last_name="Wong",
    email="anthonyjaredwong@gmail.com",
    resume_pdf_path="AJ Wong's Resume.pdf",
    linkedin_url="https://www.linkedin.com/in/anthonyjaredwong/",
    github_url="https://github.com/anthonyjwong",
    current_location="Danville, California, United States",
    desired_location="New York, NY",
    work_mode_ranking=["hybrid", "onsite", "remote"],
)


@app.post("/jobs/find")
async def find_jobs(
    background_tasks: BackgroundTasks,
    num_jobs: int = Query(
        DEFAULT_JOBS_TO_FIND, ge=1, le=500, description="Number of jobs to find (1-500)"
    ),
    db: Session = Depends(get_db),
):
    """Find and save current job listings"""
    try:

        async def save_jobs_with_db():
            try:
                jobs = save_jobs(num_jobs=num_jobs)  # Pass num_jobs to save_jobs

                jobs = add_new_scraped_jobs(db, jobs)

                await manager.broadcast(
                    {
                        "type": "complete",
                        "data": {
                            "message": f"/jobs/find: Found and saved {len(jobs)} jobs"
                        },
                    }
                )
                time.sleep(5)  # Wait 5 sec before sending review requests

                for job in jobs:
                    if not job.reviewed:
                        background_tasks.add_task(
                            review_job, job.id, background_tasks, db
                        )
            except Exception as e:
                logging.error(f"/jobs/find: Error saving jobs: {str(e)}", exc_info=True)
                await manager.broadcast({"type": "error", "data": {"message": str(e)}})

        background_tasks.add_task(save_jobs_with_db)
        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "message": "/jobs/find: Job search started in background",
            },
        )
    except Exception as e:
        logging.error(
            f"/jobs/find: Error initiating job search: {str(e)}", exc_info=True
        )
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": f"/jobs/find:\n{str(e)}"},
        )


@app.post("/job/{job_id}/review")
async def review_job(
    job_id: UUID, background_tasks: BackgroundTasks, db: Session = Depends(get_db)
):
    """Review a specific job by ID"""
    try:
        job = get_job_by_id(db, job_id)
        if job is None:
            logging.warning(f"Job with ID {job_id} not found")
            return JSONResponse(
                status_code=404,
                content={
                    "status": "error",
                    "message": f"Job with ID {job_id} not found",
                },
            )

        logging.info(f"Reviewing job {job_id}...")
        reviewed_job = evaluate_candidate_aptitude(job, user)
        update_job_by_id(db, job_id, reviewed_job)

        time.sleep(5)  # Wait 5 sec before sending prepare requests
        if (
            reviewed_job.review.classification in ["safety", "target"]
            and reviewed_job.job_type == "fulltime"
        ):
            logging.info(
                f"Ranked job as {reviewed_job.review.classification}. Sending for prep..."
            )
            background_tasks.add_task(
                create_application, reviewed_job.id, background_tasks, db
            )
        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "message": f"Job {job_id} reviewed successfully",
                "data": reviewed_job.review.__dict__,
            },
        )
    except Exception as e:
        logging.error(
            f"/job/{job_id}/review: Error reviewing job: {str(e)}", exc_info=True
        )
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": f"/job/{job_id}/review:\n{str(e)}"},
        )


@app.post("/job/{job_id}/prepare")
def create_application(
    job_id: UUID, background_tasks: BackgroundTasks, db: Session = Depends(get_db)
):
    """Create an app for a job by its ID."""
    try:
        job = get_job_by_id(db, job_id)
        if job is None:

            return JSONResponse(
                status_code=404,
                content={
                    "status": "error",
                    "message": f"Job with ID {job_id} not found",
                },
            )

        # check if app with this job_id already exists
        existing_app = get_application_by_job_id(db, job_id)
        if existing_app and existing_app.prepared == True:
            logging.warning(
                f"/jobs/{job_id}/prepare: Application for job {job_id} already exists"
            )
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "message": f"/jobs/{job_id}/prepare: Application for job {job_id} already exists",
                },
            )

        # check if the app is supported
        if (
            not job.direct_job_url
            or get_base_url(job.direct_job_url) not in DOMAIN_HANDLERS.keys()
        ):
            logging.warning(
                f"/jobs/{job_id}/prepare: Skipping unsupported job URL {get_base_url(job.direct_job_url) if job.direct_job_url else 'unknown'}"
            )
            return JSONResponse(
                status_code=400,
                content={
                    "status": "error",
                    "message": f"/jobs/{job_id}/prepare: Unsupported job URL",
                },
            )

        try:
            app = scrape_job_app(job)
        except (ValueError, NotImplementedError) as e:
            if type(e) is ValueError:
                return JSONResponse(
                    status_code=500,
                    content={
                        "status": "error",
                        "message": f"/jobs/{id}/prepare: Job {job.id} is missing URLs\n{str(e)}",
                    },
                )
            else:
                return JSONResponse(
                    status_code=500,
                    content={
                        "status": "error",
                        "message": f"/jobs/{id}/prepare: {get_base_url(job.direct_job_url)} app prep is not supported at this time",
                    },
                )

        if existing_app is None:
            add_new_application(db, app)
        else:
            app.id = existing_app.id  # keep the same ID for updates

        time.sleep(5)  # Wait 5 sec before preparing app

        logging.info(f"Preparing app {app.id}...")
        prepared_app = prepare_job_app(job, app, user)

        if prepared_app.prepared == False:
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "message": f"/jobs/{id}/prepare: Could not prepare app: \n{str(e)}",
                },
            )

        update_application_by_id(db, app.id, prepared_app)

        logging.info(f"Application {app.id} for job {job.id} prepared successfully.")
        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "message": f"Application {id} prepared successfully",
            },
        )
    except Exception as e:
        logging.error(
            f"/jobs/{id}/prepare: Error preparing job: {str(e)}", exc_info=True
        )
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": f"/jobs/{id}/prepare:\n{str(e)}"},
        )


# bulk endpoints
@app.post("/jobs/review")
async def review_jobs(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Review unreviewed jobs for candidate aptitude"""
    jobs = get_unreviewed_jobs(db)
    if len(jobs) == 0:
        return JSONResponse(
            status_code=404,
            content={"status": "error", "message": "No unreviewed jobs found"},
        )

    for job in jobs:
        background_tasks.add_task(review_job, job.id, background_tasks, db)

    return JSONResponse(
        status_code=202,
        content={"status": "success", "message": "Job reviews started"},
    )


@app.post("/apps/create")
async def create_applications(
    background_tasks: BackgroundTasks, db: Session = Depends(get_db)
):
    """Creates new application for reviewed jobs."""
    jobs = get_reviewed_jobs(db)
    for job in jobs:
        app = get_application_by_job_id(db, job.id)
        if app is None or app.prepared == False:
            background_tasks.add_task(create_application, job.id, background_tasks, db)
        else:
            logging.info(
                f"Skipping review for job {job.id}. Application {app.id} already completed."
            )

    return JSONResponse(
        status_code=202,
        content={"status": "success", "message": "Job reviews started"},
    )


@app.post("/apps/prepare")
async def prepare_applications(
    background_tasks: BackgroundTasks, db: Session = Depends(get_db)
):
    """Prepares unprepared applications."""
    apps = get_unprepared_applications(db)
    for app in apps:
        background_tasks.add_task(create_application, app.job_id, background_tasks, db)

    return JSONResponse(
        status_code=202,
        content={"status": "success", "message": "Job reviews started"},
    )


# frontend endpoints
@app.get("/apps/unapproved")
async def get_unapproved_apps(db: Session = Depends(get_db)):
    """Gets all applications that still need to be approved by the user."""
    apps = get_unapproved_applications(db)
    logging.info(f"Found {len(apps)} unapproved applications.")
    return JSONResponse(
        status_code=200,
        content={"apps": [app.to_json() for app in apps]},
    )


@app.put("/app/{app_id}/update")
async def update_application_from_fragment(
    app_id: UUID, app_data: AppFragment = Body(...), db: Session = Depends(get_db)
):
    """Updates an existing application."""
    try:
        app = get_application_by_id(db, app_id)
        if not app:
            return JSONResponse(
                status_code=404,
                content={
                    "status": "error",
                    "message": f"Application with job ID {app_id} not found",
                },
            )

        update_application_by_id_with_fragment(db, app_id, app_data)

        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "message": f"Application {app_id} updated successfully",
            },
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)},
        )


@app.post("/app/{app_id}/approve")
def approve_application(
    app_id: UUID, background_tasks: BackgroundTasks, db: Session = Depends(get_db)
):
    """Approve and submit an application"""
    try:
        app = get_application_by_id(db, app_id)
        if not app:
            return JSONResponse(
                status_code=404,
                content={
                    "status": "error",
                    "message": f"Application with ID {app_id} not found",
                },
            )
        if not app.prepared:
            return JSONResponse(
                status_code=400,
                content={
                    "status": "error",
                    "message": "Application must be prepared before approval",
                },
            )

        job = get_job_by_id(db, app.job_id)
        if not job:
            return JSONResponse(
                status_code=404,
                content={
                    "status": "error",
                    "message": f"Job ID {app.job_id} attached to app {app_id} not found",
                },
            )

        applied_app = submit_app(app, job)
        # update_application_by_id(db, app_id, applied_app)

        return JSONResponse(
            status_code=200,
            content={
                "message": f"Application with ID {app_id} approved and submission completed!",
            },
        )
    except Exception as e:
        return JSONResponse(
            status_code=500, content={"status": "error", "message": str(e)}
        )


@app.post("/app/{app_id}/discard")
async def discard_application(app_id: UUID, db: Session = Depends(get_db)):
    """Discard an application"""
    try:
        app = get_application_by_id(db, app_id)
        if not app:
            return JSONResponse(
                status_code=404,
                content={
                    "status": "error",
                    "message": f"Application with ID {app_id} not found",
                },
            )

        discard_application_by_id(db, app_id)

        return JSONResponse(
            status_code=200,
            content={
                "message": f"Application with ID {app_id} discarded successfully!",
            },
        )
    except Exception as e:
        return JSONResponse(
            status_code=500, content={"status": "error", "message": str(e)}
        )


@app.get("/jobs/summary")
async def get_jobs_summary(db: Session = Depends(get_db)):
    """Get the status of job reviews"""
    try:
        jobs = get_all_jobs(db)
        total_jobs = len(jobs)
        classification_counts = {"safety": 0, "target": 0, "reach": 0, "dream": 0}
        base_url_counts = {}

        for job in jobs:
            classification = job.review.classification if job.reviewed else "unreviewed"
            if classification:
                classification_counts[classification] += 1

            if job.direct_job_url:
                base_url = get_base_url(job.direct_job_url)
                base_url_counts[base_url] = base_url_counts.get(base_url, 0) + 1
            elif job.linkedin_job_url:
                base_url = get_base_url(job.linkedin_job_url)
                base_url_counts[base_url] = base_url_counts.get(base_url, 0) + 1
            else:
                base_url_counts["no URL"] = base_url_counts.get("no URL", 0) + 1

        base_url_counts = dict(
            sorted(base_url_counts.items(), key=lambda x: x[1], reverse=True)
        )

        return JSONResponse(
            status_code=200,
            content={
                "data": {
                    "total_jobs": total_jobs,
                    "classifications": classification_counts,
                    "base_urls": base_url_counts,
                },
            },
        )
    except Exception as e:
        return JSONResponse(
            status_code=500, content={"status": "error", "message": str(e)}
        )


@app.get("/apps/summary")
async def get_applications_summary(db: Session = Depends(get_db)):
    """Get the status of applications"""
    try:
        apps = get_all_applications(db)
        total_apps = len(apps)
        submitted = 0
        acknowledged = 0
        rejected = 0

        for app in apps:
            if app.submitted:
                submitted += 1
            if app.acknowledged:
                acknowledged += 1
            if app.rejected:
                rejected += 1

        return JSONResponse(
            status_code=200,
            content={
                "data": {
                    "total_apps": total_apps,
                    "submitted": submitted,
                    "acknowledged": acknowledged,
                    "rejected": rejected,
                },
            },
        )
    except Exception as e:
        return JSONResponse(
            status_code=500, content={"status": "error", "message": str(e)}
        )


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
