from app.core.utils import get_domain_handler
from app.database.session import get_db
from app.database.utils.claims import (
    claim_app_for_prep,
    claim_app_for_submission,
    claim_job_for_app_creation,
    claim_job_for_expiration_check,
    claim_job_for_review,
)
from app.database.utils.queries import (
    get_approved_applications,
    get_reviewed_jobs,
    get_unexpired_jobs_older_than_one_week,
    get_unprepared_applications,
    get_unreviewed_jobs,
)
from app.routers.users import user
from app.worker.tasks import (
    check_if_job_still_exists_task,
    create_app_task,
    evaluate_job_task,
    get_new_jobs_task,
    prepare_application_task,
    submit_application_task,
)
from fastapi import APIRouter, Query
from fastapi.params import Depends
from fastapi.responses import JSONResponse
from httpcore import Response
from sqlalchemy.orm import Session

router = APIRouter()


@router.put("/jobs/review")
def review_jobs(db: Session = Depends(get_db)):
    """Review unreviewed jobs for candidate aptitude"""
    # arg validation
    jobs = get_unreviewed_jobs(db)
    if len(jobs) == 0:
        return Response(status_code=204)

    # send-off
    for job in jobs:
        if claim_job_for_review(db, job.id):
            evaluate_job_task.delay(job.id, user.to_json())

    # response
    return JSONResponse(
        status_code=202,
        content={"status": "success", "message": "Job reviews started"},
    )


@router.put("/jobs/expire")
def expire_jobs(db: Session = Depends(get_db)):
    """Expire jobs that are past their expiration date"""
    # arg validation
    jobs = get_unexpired_jobs_older_than_one_week(db)
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
    jobs = get_reviewed_jobs(db)
    if len(jobs) == 0:
        return Response(status_code=204)

    # send-off
    for job in jobs:
        if job.approved:
            job_url = job.direct_job_url or job.linkedin_job_url
            if get_domain_handler(job_url) and claim_job_for_app_creation(db, job.id):
                create_app_task.delay(job.id)

    # response
    return JSONResponse(
        status_code=202,
        content={"status": "success", "message": "Creating job applications"},
    )


@router.put("/applications/prepare")
def prepare_applications(db: Session = Depends(get_db)):
    """Prepares unprepared applications."""
    # arg validation
    apps = get_unprepared_applications(db)
    if len(apps) == 0:
        return Response(status_code=204)

    # send-off
    for app in apps:
        if claim_app_for_prep(db, app.id):
            prepare_application_task.delay(app.job_id, app.id, user.to_json())

    # response
    return JSONResponse(
        status_code=202,
        content={"status": "success", "message": "Job reviews started"},
    )


@router.put("/applications/submit")
def submit_applications(db: Session = Depends(get_db)):
    """Submits approved applications."""
    # arg validation
    apps = get_approved_applications(db)
    if len(apps) == 0:
        return Response(status_code=204)

    # send off
    for app in apps:
        if claim_app_for_submission(db, app.id):
            submit_application_task.delay(app.job_id, app.id)

    # response
    return JSONResponse(
        status_code=202,
        content={"status": "success", "message": "Application submissions started"},
    )
