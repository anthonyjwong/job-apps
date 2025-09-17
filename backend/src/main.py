import asyncio
import logging
import os
import random
from datetime import date
from uuid import UUID

import debugpy
import uvicorn
from core.jobs import get_domain_handler
from core.utils import clean_url, get_base_url
from db.database import SessionLocal, get_db
from db.models import ApplicationORM, JobORM
from db.utils import (
    add_new_application,
    add_new_job,
    approve_application_by_id,
    approve_job_by_id,
    discard_application_by_id,
    discard_job_by_id,
    get_all_applications,
    get_all_jobs,
    get_application_by_id,
    get_application_by_job_id,
    get_approved_applications,
    get_job_by_id,
    get_reviewed_jobs,
    get_submitted_applications,
    get_unapproved_applications,
    get_unapproved_jobs,
    get_unexpired_jobs_older_than_one_week,
    get_unprepared_applications,
    get_unreviewed_jobs,
    update_application_by_id_with_fragment,
    update_application_state_by_id,
    update_job_by_id,
)
from fastapi import Body, Depends, FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, HttpUrl, model_validator
from schemas.definitions import App, AppFragment, Job, Review, User
from sqlalchemy import or_
from sqlalchemy.orm import Session
from worker.tasks import (
    check_if_job_still_exists_task,
    create_app_task,
    evaluate_job_task,
    get_new_jobs_task,
    get_task_status,
    prepare_application_task,
    submit_application_task,
)

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

# Enable in-process debugpy when requested (works with Uvicorn --reload)
if os.environ.get("DEBUGPY", "0") == "1":
    try:
        _port = int(os.environ.get("DEBUGPY_PORT", "5678"))
        debugpy.listen(("0.0.0.0", _port))
        logging.info(f"debugpy listening on 0.0.0.0:{_port}")
        if os.environ.get("DEBUGPY_WAIT_FOR_CLIENT", "0") == "1":
            logging.info("Waiting for debugger to attach...")
            debugpy.wait_for_client()
    except Exception:
        logging.error("Failed to initialize debugpy", exc_info=True)

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

DEFAULT_JOBS_TO_FIND = 50

# Limit concurrent background operations that might use DB connections
MAX_CONCURRENT_TASKS = int(os.environ.get("MAX_CONCURRENT_TASKS", "8"))
task_semaphore = asyncio.Semaphore(MAX_CONCURRENT_TASKS)

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


@app.get("/task/{task_id}")
def check_task(task_id: str):
    return get_task_status(task_id)


@app.get("/job/{job_id}")
def get_job(job_id: UUID):
    """Get a specific job by ID."""
    with SessionLocal() as db:
        job = get_job_by_id(db, job_id)
        if job is None:
            logging.error(f"/job/{job_id}: Job not found", exc_info=True)
            return JSONResponse(
                status_code=404,
                content={
                    "status": "error",
                    "message": f"Job {job_id} not found",
                },
            )

    return JSONResponse(
        status_code=200,
        content=job.to_json(),
    )


@app.post("/jobs/find")
def find_jobs(
    num_jobs: int = Query(
        DEFAULT_JOBS_TO_FIND, ge=1, le=500, description="Number of jobs to find (1-500)"
    ),
):
    """Find and save current job listings"""
    # task
    task = get_new_jobs_task.delay(num_jobs)

    # response
    return JSONResponse(
        status_code=202,
        content={
            "task_id": task.id,
            "status": "success",
            "message": "Job search started in background",
        },
    )


@app.put("/job/{job_id}/review")
def review_job(job_id: UUID):
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

        if job.manual:
            return JSONResponse(
                status_code=200,
                content={
                    "status": "success",
                    "message": f"Job {job_id} is marked manual, skipping review",
                },
            )

    # task
    task = evaluate_job_task.delay(job.to_json(), user.to_json())

    # response
    return JSONResponse(
        status_code=202,
        content={
            "task_id": task.id,
            "status": "success",
            "message": f"Job {job_id} sent for review",
        },
    )


@app.post("/job/{job_id}/create_app")
def create_job_application(job_id: UUID):
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

        job_url = job.direct_job_url or job.linkedin_job_url
        if not job_url:
            logging.error(f"/job/{job_id}/create_app: Job {job_id} is missing URLs.")
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "message": f"Job {job_id} is missing URLs.",
                },
            )

        job_site = get_domain_handler(job_url)
        if job_site is None:
            logging.debug(
                f"/job/{job_id}/create_app: Job site not supported for app creation: {job_url}"
            )
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "message": f"Job site not supported for app creation: {job_url}",
                },
            )

    # task
    task = create_app_task.delay(job.to_json())

    # response
    return JSONResponse(
        status_code=202,
        content={
            "task_id": task.id,
            "status": "success",
            "message": f"Application for job {job_id} queued for creation",
        },
    )


@app.put("/job/{job_id}/expire")
def expire_job(job_id: UUID):
    """Submit an application"""
    with SessionLocal() as db:
        # arg validation
        job = get_job_by_id(db, job_id)
        if not job:
            logging.error(
                f"/job/{job_id}/expire: Job not found",
            )
            return JSONResponse(
                status_code=404,
                content={
                    "status": "error",
                    "message": f"Job {job_id} not found",
                },
            )

    # logic
    task = check_if_job_still_exists_task.delay(job.to_json())

    # response
    return JSONResponse(
        status_code=202,
        content={
            "task_id": task.id,
            "status": "success",
            "message": f"Checking job {job_id} expiration",
        },
    )


@app.put("/app/{app_id}/prepare")
def prepare_application(app_id: UUID):
    """Create an app for a job by its ID."""
    with SessionLocal() as db:
        # arg validation
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

    # task
    task = prepare_application_task.delay(job.to_json(), app.to_json(), user.to_json())

    # response
    return JSONResponse(
        status_code=202,
        content={
            "task_id": task.id,
            "status": "success",
            "message": f"Application {app_id} queued for preparation",
        },
    )


@app.put("/app/{app_id}/submit")
def submit_application(app_id: UUID):
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

        if not app.approved:
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

        job_site = get_domain_handler(app.url)
        if job_site is None:
            logging.debug(
                f"/app/{app_id}/submit: Job site not supported for submission: {app.url}"
            )
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "message": f"Job site not supported for submission: {app.url}",
                },
            )

    # task
    task = submit_application_task.delay(job.to_json(), app.to_json())

    # response
    return JSONResponse(
        status_code=202,
        content={
            "task_id": task.id,
            "status": "success",
            "message": f"Application {app_id} was queued for submission",
        },
    )


# bulk endpoints
@app.put("/jobs/review")
def review_jobs(db: Session = Depends(get_db)):
    """Review unreviewed jobs for candidate aptitude"""
    # arg validation
    jobs = get_unreviewed_jobs(db)
    if len(jobs) == 0:
        return Response(status_code=204)

    # send-off
    for job in jobs:
        review_job(job.id)

    # response
    return JSONResponse(
        status_code=202,
        content={"status": "success", "message": "Job reviews started"},
    )


@app.put("/jobs/expire")
def expire_jobs(db: Session = Depends(get_db)):
    """Expire jobs that are past their expiration date"""
    # arg validation
    jobs = get_unexpired_jobs_older_than_one_week(db)
    if len(jobs) == 0:
        return Response(status_code=204)

    # send-off
    for job in jobs:
        if job.linkedin_job_url:
            expire_job(job.id)

    # response
    return JSONResponse(
        status_code=202,
        content={"status": "success", "message": "Job expiration checks started"},
    )


@app.post("/apps/create")
def create_job_applications(db: Session = Depends(get_db)):
    """Creates new application for unscraped apps."""
    # arg validation
    jobs = get_reviewed_jobs(db)
    if len(jobs) == 0:
        return Response(status_code=204)

    # send-off
    for job in jobs:
        if job.approved:
            app = get_application_by_job_id(db, job.id)
            if app is None or app.scraped == False:
                create_job_application(job.id)

    # response
    return JSONResponse(
        status_code=202,
        content={"status": "success", "message": "Creating job applications"},
    )


@app.put("/apps/prepare")
def prepare_applications(db: Session = Depends(get_db)):
    """Prepares unprepared applications."""
    # arg validation
    apps = get_unprepared_applications(db)
    if len(apps) == 0:
        return Response(status_code=204)

    # send-off
    for app in apps:
        prepare_application(app.id)

    # response
    return JSONResponse(
        status_code=202,
        content={"status": "success", "message": "Job reviews started"},
    )


@app.put("/apps/submit")
def submit_applications(db: Session = Depends(get_db)):
    """Submits approved applications."""
    # arg validation
    apps = get_approved_applications(db)
    if len(apps) == 0:
        return Response(status_code=204)

    # send off
    for app in apps:
        submit_application(app.id)

    # response
    return JSONResponse(
        status_code=202,
        content={"status": "success", "message": "Application submissions started"},
    )


@app.get("/jobs")
def list_all_jobs(db: Session = Depends(get_db)):
    """List all saved job applications."""
    jobs = get_all_jobs(db)
    return JSONResponse(
        status_code=200,
        content={"jobs": [job.to_json() for job in jobs]},
    )


# frontend endpoints
@app.get("/jobs/unapproved")
def list_all_jobs(db: Session = Depends(get_db)):
    """List all unapproved job applications (for frontend page)."""
    jobs = get_unapproved_jobs(db)
    return JSONResponse(
        status_code=200,
        content={"jobs": [job.to_json() for job in jobs]},
    )


@app.get("/apps/unapproved")
def get_unapproved_apps(db: Session = Depends(get_db)):
    """Gets all applications that still need to be approved by the user."""
    apps = get_unapproved_applications(db)
    return JSONResponse(
        status_code=200,
        content={"apps": [app.to_json() for app in apps]},
    )


@app.get("/apps/applied")
def get_applied_apps(db: Session = Depends(get_db)):
    """List submitted (applied) applications with their job company/title and current status."""
    try:
        apps = get_submitted_applications(db)
        result = []
        for app in apps:
            job = get_job_by_id(db, app.job_id)
            result.append(
                {
                    "app_id": str(app.id),
                    "job_id": str(app.job_id),
                    "company": job.company,
                    "title": job.title,
                    "referred": bool(app.referred),
                    "submitted": bool(app.submitted),
                    "acknowledged": bool(app.acknowledged),
                    "assessment": bool(app.assessment),
                    "interview": bool(app.interview),
                    "rejected": bool(app.rejected),
                }
            )

        return JSONResponse(status_code=200, content={"apps": result})
    except Exception as e:
        logging.error("/apps/applied: error listing applied apps", exc_info=True)
        return JSONResponse(
            status_code=500, content={"status": "error", "message": str(e)}
        )


class JobClassificationUpdate(BaseModel):
    classification: str


@app.put("/job/{job_id}/classification")
def update_job_classification(
    job_id: UUID, payload: JobClassificationUpdate, db: Session = Depends(get_db)
):
    """Update the classification for a job's review (safety|target|reach|dream)."""
    try:
        job = get_job_by_id(db, job_id)
        if not job:
            return JSONResponse(
                status_code=404,
                content={
                    "status": "error",
                    "message": f"Job with ID {job_id} not found",
                },
            )

        classes = {"safety", "target", "reach", "dream"}
        cls = payload.classification.strip().lower()
        if cls not in classes:
            return JSONResponse(
                status_code=400,
                content={
                    "status": "error",
                    "message": "Invalid classification. Must be one of safety|target|reach|dream",
                },
            )

        # Ensure review exists, then set classification and reviewed flag
        if job.review is None:
            job.review = Review(action="", classification=cls)
        else:
            job.review.classification = cls
        job.reviewed = True

        update_job_by_id(db, job_id, job)

        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "message": f"Job {job_id} classification updated to {cls}",
                "data": job.to_json(),
            },
        )
    except Exception as e:
        return JSONResponse(
            status_code=500, content={"status": "error", "message": str(e)}
        )


@app.put("/app/{app_id}/update")
def update_application_from_fragment(
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


class ManualJobPayload(BaseModel):
    title: str
    company: str
    location: str
    job_url: HttpUrl
    min_salary: float | None = None
    max_salary: float | None = None
    date_posted: date | None = None
    job_type: str | None = None
    jobspy_id: str | None = None


class ManualAppCreate(BaseModel):
    job_id: UUID | None = None
    job: ManualJobPayload | None = None  # minimal job payload if creating new
    url: HttpUrl | None = None  # application URL; required when using job_id
    submitted: bool | None = False

    @model_validator(mode="after")
    def _check_job_or_job_id(self):
        if self.job_id is None and self.job is None:
            raise ValueError("Either job_id or job payload is required")
        return self


@app.post("/apps/manual")
def create_manual_application(req: ManualAppCreate, db: Session = Depends(get_db)):
    """Create a new application manually, or update existing one for a job.

    Body options:
    - { job_id: UUID, url: string, submitted?: boolean }
    - { job: { title: string, company: string, location: string, description: string,
               job_url: string, min_salary?: number, max_salary?: number,
               date_posted?: YYYY-MM-DD, job_type?: string }, submitted?: boolean }
    """
    job_id = req.job_id
    if not job_id and not req.job:
        return JSONResponse(
            status_code=400,
            content={
                "status": "error",
                "message": "Either job_id or job payload is required",
            },
        )

    if job_id:
        job = get_job_by_id(db, job_id)
        if not job:
            return JSONResponse(
                status_code=404,
                content={
                    "status": "error",
                    "message": f"Job with ID {job_id} not found",
                },
            )

        app = get_application_by_job_id(db, job_id)
        if app:
            return JSONResponse(
                status_code=400,
                content={
                    "status": "error",
                    "message": f"Application for job ID {job_id} already exists as app ID {app.id}",
                },
            )

    # create job if needed
    if req.job:
        # process URL
        linkedin_job_url = None
        direct_job_url = None
        try:
            job_url = clean_url(str(req.job.job_url))
        except Exception as ex:
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": f"Invalid job URL: {ex}"},
            )
        if "linkedin.com" in job_url.lower():
            linkedin_job_url = job_url
        else:
            direct_job_url = job_url
        new_job = Job(
            jobspy_id=f"manual-{random.randint(1000000000, 9999999999)}",  # pseudo-random unique ID
            title=req.job.title.strip(),
            company=req.job.company.strip(),
            location=req.job.location.strip(),
            min_salary=req.job.min_salary,
            max_salary=req.job.max_salary,
            date_posted=(
                req.job.date_posted.isoformat() if req.job.date_posted else None
            ),
            job_type=(req.job.job_type.strip() if req.job.job_type else None),
            linkedin_job_url=linkedin_job_url,
            direct_job_url=direct_job_url,
            description=None,
            review=None,
            reviewed=False,
            approved=True,
            discarded=False,
            manual=True,
        )

        try:
            add_new_job(db, new_job)
        except:
            logging.error(
                f"/apps/manual: Error creating job in database",
                exc_info=True,
            )
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "message": f"Failed to create job in database",
                },
            )
        job_id = new_job.id  # use the new job's ID

    submitted = bool(req.submitted)
    new_app = App(
        job_id=job_id,
        url=clean_url(str(req.url)) if req.url else job_url,
        scraped=False,
        prepared=False,
        approved=True if submitted else False,
        discarded=False,
        submitted=submitted,
        acknowledged=False,
        rejected=False,
    )

    try:
        add_new_application(db, new_app)
    except:
        logging.error(
            f"/apps/manual: Error creating app in database",
            exc_info=True,
        )
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Failed to create app in database",
            },
        )

    return JSONResponse(
        status_code=200,
        content={
            "status": "success",
            "message": "Application created",
        },
    )


@app.put("/job/{job_id}/approve")
def approve_job(job_id: UUID, db: Session = Depends(get_db)):
    """Approve a job"""
    try:
        job = get_job_by_id(db, job_id)
        if not job:
            return JSONResponse(
                status_code=404,
                content={
                    "status": "error",
                    "message": f"Job with ID {job_id} not found",
                },
            )

        approve_job_by_id(db, job.id)

        return JSONResponse(
            status_code=200,
            content={
                "message": f"Job with ID {job_id} approved!",
            },
        )
    except Exception as e:
        return JSONResponse(
            status_code=500, content={"status": "error", "message": str(e)}
        )


@app.put("/job/{job_id}/discard")
def discard_job(job_id: UUID, db: Session = Depends(get_db)):
    """Discard a job"""
    try:
        job = get_job_by_id(db, job_id)
        if not job:
            return JSONResponse(
                status_code=404,
                content={
                    "status": "error",
                    "message": f"Job with ID {job_id} not found",
                },
            )

        discard_job_by_id(db, job_id)

        return JSONResponse(
            status_code=200,
            content={
                "message": f"Job with ID {job_id} discarded successfully!",
            },
        )
    except Exception as e:
        return JSONResponse(
            status_code=500, content={"status": "error", "message": str(e)}
        )


@app.put("/app/{app_id}/approve")
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


@app.put("/app/{app_id}/discard")
def discard_application(app_id: UUID, db: Session = Depends(get_db)):
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


@app.put("/app/{app_id}/state")
def update_application_state(
    app_id: UUID,
    new_state: str = Body(None),
    db: Session = Depends(get_db),
):
    """Update the state of an application (submitted, acknowledged, rejected)"""
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

        if new_state not in [
            "submitted",
            "acknowledged",
            "assessment",
            "interview",
            "rejected",
        ]:
            logging.error(
                f"/app/{app_id}/state: Invalid state field provided for app state update",
            )
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "message": "Invalid state field provided for update",
                },
            )

        update_application_state_by_id(db, app_id, new_state)

        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "message": f"Application {app_id} state updated successfully",
            },
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)},
        )


# data endpoints
@app.get("/jobs/summary")
def get_jobs_summary(db: Session = Depends(get_db)):
    """Get the status of job reviews"""
    try:
        jobs = get_all_jobs(db)
        total_jobs = len(jobs)
        classification_counts = {
            "safety": 0,
            "target": 0,
            "reach": 0,
            "dream": 0,
            "unreviewed": 0,
        }
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
def get_applications_summary(db: Session = Depends(get_db)):
    """Get the status of applications, plus metrics for approved jobs without a scraped application."""
    try:
        apps = get_all_applications(db)
        summary = {
            "total_apps": len(apps),
            "approved": sum(app.approved for app in apps),
            "discarded": sum(app.discarded for app in apps),
            "submitted": sum(app.submitted for app in apps),
            "acknowledged": sum(app.acknowledged for app in apps),
            "rejected": sum(app.rejected for app in apps),
        }

        # Jobs that are reviewed, approved, not discarded, and have no app or unscraped app
        approved_wo_app_query = (
            db.query(JobORM.id)
            .outerjoin(ApplicationORM, ApplicationORM.job_id == JobORM.id)
            .filter(JobORM.reviewed, JobORM.approved, ~JobORM.discarded)
            .filter(or_(ApplicationORM.id == None, ~ApplicationORM.scraped))
            .distinct()
        )
        approved_wo_app_job_ids = [row[0] for row in approved_wo_app_query.all()]
        summary["approved_without_app"] = {
            "count": len(approved_wo_app_job_ids),
            "base_urls": {},
        }

        if approved_wo_app_job_ids:
            url_rows = (
                db.query(JobORM.direct_job_url, JobORM.linkedin_job_url)
                .filter(JobORM.id.in_(approved_wo_app_job_ids))
                .all()
            )
            base_urls = {}
            for direct_url, linkedin_url in url_rows:
                url = direct_url or linkedin_url or "no URL"
                base = get_base_url(url)
                base_urls[base] = base_urls.get(base, 0) + 1
            summary["approved_without_app"]["base_urls"] = dict(
                sorted(base_urls.items(), key=lambda x: x[1], reverse=True)
            )

        return JSONResponse(status_code=200, content={"data": summary})
    except Exception as e:
        return JSONResponse(
            status_code=500, content={"status": "error", "message": str(e)}
        )


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
