import asyncio
import logging
import time
from json import JSONDecodeError
from typing import List
from uuid import UUID

import uvicorn
from db.database import SessionLocal, get_db
from db.utils import (
    add_new_application,
    add_new_scraped_jobs,
    approve_application_by_id,
    discard_application_by_id,
    get_all_applications,
    get_all_jobs,
    get_application_by_id,
    get_application_by_job_id,
    get_job_by_id,
    get_unapproved_applications,
    get_unprepared_applications,
    get_unreviewed_jobs,
    get_unscraped_applications,
    get_user_approved_applications,
    update_application_by_id,
    update_application_by_id_with_fragment,
    update_job_by_id,
)
from fastapi import Body, Depends, FastAPI, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
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

# Ensure handlers use a formatter that includes timestamps
_fmt = "%(asctime)s - %(levelname)s - %(message)s"
_datefmt = "%Y-%m-%d %H:%M:%S"
_formatter = logging.Formatter(fmt=_fmt, datefmt=_datefmt)
for _h in logging.getLogger().handlers:
    _h.setFormatter(_formatter)

app = FastAPI(title="Job Application API")

# Allow requests from your frontend (e.g., http://localhost:3000)
origins = [
    "http://localhost:3000",
    "http://frontend:3000",
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
            except:
                logging.error(
                    f"Error broadcasting to {connection.client}",
                    exc_info=True,
                )


manager = ConnectionManager()

DEFAULT_JOBS_TO_FIND = 50

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
    num_jobs: int = Query(
        DEFAULT_JOBS_TO_FIND, ge=1, le=500, description="Number of jobs to find (1-500)"
    ),
):
    """Find and save current job listings"""

    # logic
    async def save_jobs_with_db():
        try:
            logging.info("Finding jobs...")
            # Offload potentially blocking scraping to a thread to avoid blocking the event loop
            jobs = await asyncio.to_thread(save_jobs, num_jobs=num_jobs)
        except Exception:
            logging.error("/jobs/find: Error saving jobs", exc_info=True)
            await manager.broadcast(
                {"type": "error", "data": {"message": "Failed to save jobs"}}
            )
            return

        # database operation
        try:
            with SessionLocal() as db:
                jobs = add_new_scraped_jobs(db, jobs)
        except Exception:
            logging.error(
                "/jobs/find: Error adding new jobs to database",
                exc_info=True,
            )
            await manager.broadcast(
                {
                    "type": "error",
                    "data": {"message": "Failed to add new jobs to database"},
                }
            )
            return
        finally:
            db.close()

        # websocket notification
        await manager.broadcast(
            {
                "type": "complete",
                "data": {"message": f"Found and saved {len(jobs)} jobs"},
            }
        )

        # send-off
        for job in jobs:
            if not job.reviewed:
                asyncio.create_task(review_job(job.id))

    asyncio.create_task(save_jobs_with_db())

    # response
    return JSONResponse(
        status_code=202,
        content={
            "status": "success",
            "message": "Job search started in background",
        },
    )


@app.post("/job/{job_id}/review")
async def review_job(job_id: UUID):
    """Review a specific job by ID"""
    with SessionLocal() as db:
        # arg validation
        job = get_job_by_id(db, job_id)
        if job is None:
            logging.error(f"/job/{job_id}/review: Job not found", exc_info=True)
            return JSONResponse(
                status_code=404,
                content={
                    "status": "error",
                    "message": f"Job {job_id} not found",
                },
            )

        # logic
        try:
            logging.info(f"Reviewing job {job_id}...")
            # Offload OpenAI network calls and JSON processing to a worker thread
            reviewed_job = await asyncio.to_thread(
                evaluate_candidate_aptitude, job, user
            )
        except JSONDecodeError:
            logging.error(
                f"/job/{job_id}/review: evaluate_candidate_aptitude failed to return a valid JSON response"
            )
            return JSONResponse(
                status_code=500,
                content={"status": "error", "message": "Failed to review job"},
            )
        except:
            logging.error(f"/job/{job_id}/review: Error reviewing job", exc_info=True)
            return JSONResponse(
                status_code=500,
                content={"status": "error", "message": "Failed to review job"},
            )

        # database operation
        try:
            update_job_by_id(db, job_id, reviewed_job)
        except:
            logging.error(
                f"/job/{job_id}/review: Error updating job in database",
                exc_info=True,
            )
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "message": "Failed to update job in database",
                },
            )

    # send-off
    if (
        reviewed_job.review.classification in ["safety", "target"]
        and reviewed_job.job_type == "fulltime"
    ):
        asyncio.create_task(create_job_application(job_id))
    else:
        logging.info(
            f'Job {job_id} classified "{reviewed_job.review.classification}" does not require application'
        )

    # response
    return JSONResponse(
        status_code=200,
        content={
            "status": "success",
            "message": f"Job {job_id} reviewed successfully",
            "data": reviewed_job.review.to_json(),
        },
    )


@app.post("/job/{job_id}/create_app")
async def create_job_application(job_id: UUID):
    """Create an app for a job by its ID."""
    with SessionLocal() as db:
        # arg validation
        job = get_job_by_id(db, job_id)
        if job is None:
            logging.error(f"/job/{job_id}/create_app: Job not found", exc_info=True)
            return JSONResponse(
                status_code=404,
                content={
                    "status": "error",
                    "message": f"Job {job_id} not found",
                },
            )

        existing_app = get_application_by_job_id(db, job_id)
        if existing_app and existing_app.scraped == True:
            logging.error(
                f"/job/{job_id}/create_app: Application for job {job_id} already scraped",
                exc_info=True,
            )
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "message": f"Application for job {job_id} already scraped",
                },
            )

        # logic
        try:
            # Playwright sync API is blocking; run in a thread
            app = await asyncio.to_thread(scrape_job_app, job)
        except ValueError:
            logging.error(f"/job/{job_id}/create_app: Job {job.id} is missing URLs")
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "message": f"Job {job.id} is missing URLs",
                },
            )
        except NotImplementedError:
            logging.warning(
                f"/job/{job_id}/create_app: {get_base_url(job.direct_job_url)} app prep is not supported at this time"
            )
            return JSONResponse(
                status_code=400,
                content={
                    "status": "warning",
                    "message": f"{get_base_url(job.direct_job_url)} app prep is not supported at this time",
                },
            )
        except:
            logging.error(
                f"/job/{job_id}/create_app: Error scraping job", exc_info=True
            )
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "message": f"Failed to scrape job {job_id}",
                },
            )

        # database operation
        try:
            if existing_app is None:
                add_new_application(db, app)
            else:
                app.id = existing_app.id  # must be first for correct error messaging
                update_application_by_id(db, existing_app.id, app)
        except:
            logging.error(
                f"/job/{job_id}/create_app: Error updating app {app.id} in database",
                exc_info=True,
            )
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "message": f"Failed to add/update app {app.id} in database",
                },
            )

    # send-off
    if app.scraped == True:
        asyncio.create_task(prepare_application(app.id))

    # response
    return JSONResponse(
        status_code=200,
        content={
            "status": "success",
            "message": f"Application {app.id} created successfully",
        },
    )


@app.post("/app/{app_id}/prepare")
async def prepare_application(app_id: UUID):
    """Create an app for a job by its ID."""
    # arg validation
    with SessionLocal() as db:
        app = get_application_by_id(db, app_id)
        if app is None:
            logging.error(
                f"/app/{app_id}/prepare: App not found",
            )
            return JSONResponse(
                status_code=404,
                content={
                    "status": "error",
                    "message": f"App {app_id} not found",
                },
            )

        job = get_job_by_id(db, app.job_id)
        if job is None:
            logging.error(
                f"/app/{app_id}/prepare: Job {app.job_id} not found",
            )
            return JSONResponse(
                status_code=404,
                content={
                    "status": "error",
                    "message": f"Job {app.job_id} attached to app {app_id} not found",
                },
            )

        if app.scraped == False:
            logging.error(
                f"/app/{app_id}/prepare: App questions not scraped",
            )
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "message": f"App {app.id} is not scraped",
                },
            )

        if app.prepared == True:
            logging.error(
                f"/app/{app_id}/prepare: App is already prepared",
            )
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "message": f"App {app.id} is already prepared",
                },
            )

        # logic
        try:
            logging.info(f"Preparing app {app.id}...")
            # This performs OpenAI calls and processing; run in a thread
            prepared_app = await asyncio.to_thread(prepare_job_app, job, app, user)
        except:
            logging.error(
                f"/app/{app_id}/prepare: Failed to prepare app", exc_info=True
            )
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "message": f"Failed to prepare app {app.id}",
                },
            )

        # database operation
        try:
            update_application_by_id(db, app_id, prepared_app)
        except:
            logging.error(
                f"/app/{app_id}/prepare: Failed to update app in database",
                exc_info=True,
            )
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "message": f"Failed to update app {app.id} in database",
                },
            )

    # response
    return JSONResponse(
        status_code=200,
        content={
            "status": "success",
            "message": f"Application {app_id} prepared successfully",
        },
    )


@app.post("/app/{app_id}/submit")
async def submit_application(app_id: UUID):
    """Submit an application"""
    with SessionLocal() as db:
        # arg validation
        app = get_application_by_id(db, app_id)
        if not app:
            logging.error(
                f"/app/{app_id}/submit: App not found",
            )
            return JSONResponse(
                status_code=404,
                content={
                    "status": "error",
                    "message": f"Application {app_id} not found",
                },
            )

        if not app.prepared:
            logging.error(
                f"/app/{app_id}/submit: App not prepared",
            )
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "message": f"App {app_id} must be prepared before approval",
                },
            )

        if not app.user_approved:
            logging.error(
                f"/app/{app_id}/submit: App not approved by user",
            )
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "message": f"App {app_id} must be approved by user before submission",
                },
            )

        job = get_job_by_id(db, app.job_id)
        if not job:
            logging.error(
                f"/app/{app_id}/submit: Job {app.job_id} not found",
            )
            return JSONResponse(
                status_code=404,
                content={
                    "status": "error",
                    "message": f"Job ID {app.job_id} attached to app {app_id} not found",
                },
            )

        # logic
        try:
            # Playwright sync automation is blocking; run in a thread
            applied_app = await asyncio.to_thread(submit_app, app, job)
        except ValueError:
            logging.error(f"/app/{app_id}/submit: Job {job.id} is missing URLs")
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "message": f"Job {job.id} is missing URLs",
                },
            )
        except NotImplementedError:
            logging.warning(
                f"/app/{app_id}/submit: {get_base_url(job.direct_job_url)} app submission is not supported at this time"
            )
            return JSONResponse(
                status_code=400,
                content={
                    "status": "warning",
                    "message": f"{get_base_url(job.direct_job_url)} app prep is not supported at this time",
                },
            )
        except:
            logging.error(
                f"/app/{app_id}/submit: Error submitting application", exc_info=True
            )
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "message": f"Failed to submit application {app_id}",
                },
            )

        # database operation
        try:
            update_application_by_id(db, app.id, applied_app)
        except:
            logging.error(
                f"/app/{app_id}/submit: Error updating app in database",
                exc_info=True,
            )
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "message": f"Failed to update app {app.id} in database",
                },
            )

    # response
    logging.info(f"Application {app_id} submitted successfully!")
    return JSONResponse(
        status_code=200,
        content={
            "message": f"Application {app_id} was submitted!",
        },
    )


# bulk endpoints
@app.post("/jobs/review")
async def review_jobs(db: Session = Depends(get_db)):
    """Review unreviewed jobs for candidate aptitude"""
    # arg validation
    jobs = get_unreviewed_jobs(db)
    if len(jobs) == 0:
        return Response(status_code=204)

    # send-off
    for job in jobs:
        asyncio.create_task(review_job(job.id))

    # response
    return JSONResponse(
        status_code=202,
        content={"status": "success", "message": "Job reviews started"},
    )


@app.post("/apps/create")
async def create_job_applications(db: Session = Depends(get_db)):
    """Creates new application for unscraped apps."""
    # arg validation
    apps = get_unscraped_applications(db)
    if len(apps) == 0:
        return Response(status_code=204)

    # send-off
    for app in apps:
        job = get_job_by_id(db, app.job_id)
        if (
            job
            and job.review.classification in ["safety", "target"]
            and job.job_type == "fulltime"
        ):
            asyncio.create_task(create_job_application(job.id))

    # response
    return JSONResponse(
        status_code=202,
        content={"status": "success", "message": "Creating job applications"},
    )


@app.post("/apps/prepare")
async def prepare_applications(db: Session = Depends(get_db)):
    """Prepares unprepared applications."""
    # arg validation
    apps = get_unprepared_applications(db)
    if len(apps) == 0:
        return Response(status_code=204)

    # send-off
    for app in apps:
        asyncio.create_task(prepare_application(app.id))

    # response
    return JSONResponse(
        status_code=202,
        content={"status": "success", "message": "Job reviews started"},
    )


@app.post("/apps/submit")
def submit_applications(db: Session = Depends(get_db)):
    """Submits approved applications."""
    # arg validation
    apps = get_user_approved_applications(db)
    if len(apps) == 0:
        return Response(status_code=204)

    # send off
    for app in apps:
        asyncio.create_task(submit_application(app.id))

    # response
    return JSONResponse(
        status_code=202,
        content={"status": "success", "message": "Application submissions started"},
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
def approve_application(app_id: UUID, db: Session = Depends(get_db)):
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

        approve_application_by_id(db, app.id)

        return JSONResponse(
            status_code=200,
            content={
                "message": f"Application with ID {app_id} approved!",
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


# data endpoints
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
        discarded = 0
        submitted = 0
        acknowledged = 0
        rejected = 0

        for app in apps:
            if app.discarded:
                discarded += 1
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
                    "discarded": discarded,
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
