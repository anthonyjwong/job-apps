from datetime import datetime, timedelta, timezone

from app.core.utils import get_domain_handler
from app.database.models import ApplicationFormORM, ApplicationORM, JobORM
from app.database.utils.claims import (
    claim_app_for_prep,
    claim_app_for_submission,
    claim_job_for_app_creation,
    claim_job_for_expiration_check,
    claim_job_for_review,
)
from app.dependencies import get_current_user, get_db
from app.schemas.definitions import (
    ApplicationFormState,
    ApplicationStatus,
    JobState,
    User,
)
from app.worker.tasks import (
    check_if_job_still_exists_task,
    create_app_task,
    evaluate_job_task,
    prepare_application_task,
    submit_application_task,
)
from fastapi import APIRouter
from fastapi.params import Depends
from fastapi.responses import JSONResponse
from httpcore import Response
from sqlalchemy.orm import Session

router = APIRouter()


@router.post("/jobs/review")
def review_jobs(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Review unreviewed jobs for candidate aptitude"""
    # arg validation
    jobs = db.query(JobORM).filter(JobORM.state == JobState.PENDING.value).all()
    if len(jobs) == 0:
        return Response(status_code=204)

    # send-off
    for job in jobs:
        if claim_job_for_review(db, job.id):
            evaluate_job_task.delay(job.id, user.to_dict())

    # response
    return JSONResponse(
        status_code=202,
        content={"status": "success", "message": "Job reviews started"},
    )


@router.post("/jobs/expire")
def expire_jobs(db: Session = Depends(get_db)):
    """Expire jobs that are past their expiration date"""
    # arg validation
    jobs = (
        db.query(JobORM)
        .filter(
            JobORM.state.in_([JobState.PENDING.value, JobState.REVIEWED.value]),
            JobORM.created_at < datetime.now(timezone.utc) - timedelta(weeks=1),
        )
        .all()
    )
    if len(jobs) == 0:
        return Response(status_code=204)

    # send-off
    for job in jobs:
        if job.linkedin_job_url and claim_job_for_expiration_check(db, job.id):
            check_if_job_still_exists_task.delay(job.id)

    # response
    return JSONResponse(
        status_code=202,
        content={"status": "success", "message": "Job expiration checks started"},
    )


@router.post("/jobs/application")
def create_job_applications(db: Session = Depends(get_db)):
    """Creates new application for unscraped apps."""
    # arg validation
    jobs = db.query(JobORM).filter(JobORM.state == JobState.APPROVED.value).all()
    if len(jobs) == 0:
        return Response(status_code=204)

    # send-off
    for job in jobs:
        job_url = job.direct_job_url or job.linkedin_job_url
        if get_domain_handler(job_url) and claim_job_for_app_creation(db, job.id):
            create_app_task.delay(job.id)

    # response
    return JSONResponse(
        status_code=202,
        content={"status": "success", "message": "Creating job applications"},
    )


@router.post("/applications/prepare")
def prepare_applications(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Prepares unprepared applications."""
    # arg validation
    apps = (
        db.query(ApplicationORM)
        .filter(ApplicationORM.status == ApplicationStatus.STARTED.value)
        .all()
    )
    if len(apps) == 0:
        return Response(status_code=204)

    # send-off
    for app in apps:
        if claim_app_for_prep(db, app.id):
            prepare_application_task.delay(app.id, user.to_dict())

    # response
    return JSONResponse(
        status_code=202,
        content={"status": "success", "message": "Job reviews started"},
    )


@router.post("/applications/submit")
def submit_applications(db: Session = Depends(get_db)):
    """Submits approved applications."""
    # arg validation
    apps = (
        db.query(ApplicationORM)
        .join(ApplicationFormORM, ApplicationORM.form)
        .filter(
            ApplicationFormORM.state == ApplicationFormState.APPROVED.value,
            ApplicationORM.status == ApplicationStatus.READY.value,
        )
        .all()
    )

    if len(apps) == 0:
        return Response(status_code=204)

    # send off
    for app in apps:
        if claim_app_for_submission(db, app.id):
            submit_application_task.delay(app.id)

    # response
    return JSONResponse(
        status_code=202,
        content={"status": "success", "message": "Application submissions started"},
    )
