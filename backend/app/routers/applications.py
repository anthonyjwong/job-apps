from datetime import datetime
from typing import List, Optional
from uuid import UUID

from app.database.models import ApplicationFormORM, ApplicationORM, JobORM
from app.database.session import SessionLocal, get_db
from app.database.utils.frontend import (
    fetch_assessment_applications,
    fetch_interview_applications,
    fetch_submitted_applications,
)
from app.schemas.api import (
    ApplicationResponse,
    AssessmentResponse,
    GetAssessmentsResponse,
    GetInterviewsResponse,
    GetSubmittedApplicationsResponse,
    InterviewResponse,
)
from app.schemas.definitions import (
    ApplicationFormState,
    ApplicationStatus,
    JobClassification,
)
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy import asc, desc, func
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/applications")
def get_applications(
    db: Session = Depends(get_db),
    status: Optional[List[ApplicationStatus]] = Query(
        default=None,
        description="Filter by one or more application statuses",
    ),
    form_state: Optional[List[ApplicationFormState]] = Query(
        default=None,
        description="Filter by one or more application form states",
    ),
    classification: Optional[List[JobClassification]] = Query(
        default=None,
        description="Filter by one or more job classifications",
    ),
    company: Optional[str] = Query(default=None, description="Case-insensitive substring match"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(25, ge=1, le=100, description="Items per page"),
    sort: Optional[str] = Query(
        default="submitted_at:desc",
        description="Sort spec field:direction. Allowed fields: submitted_at, company, status",
    ),
) -> GetSubmittedApplicationsResponse:
    """Get applications with filtering, sorting, and pagination.

    Notes:
    - Multi-value filters (status, form_state, classification) are OR within the same param, AND across different params.
    - company does ILIKE '%%value%%'.
    - Dates filter on ApplicationORM.submitted_at.
    - Always excludes applications without submitted_at unless filtering for statuses where submitted_at may be null (handled naturally).
    """

    # base query joining required tables
    query = db.query(ApplicationORM).join(JobORM, ApplicationORM.job)

    if form_state:
        # join form table only if needed
        query = query.join(
            ApplicationFormORM, ApplicationORM.id == ApplicationFormORM.application_id
        )

    # filters
    if status:
        status_values = [s.value for s in status]
        query = query.filter(ApplicationORM.status.in_(status_values))

    if form_state:
        state_values = [fs.value for fs in form_state]
        query = query.filter(ApplicationFormORM.state.in_(state_values))

    if classification:
        class_values = [c.value for c in classification]
        query = query.filter(JobORM.classification.in_(class_values))

    if company:
        like_expr = f"%{company}%"
        query = query.filter(func.lower(JobORM.company).like(func.lower(like_expr)))

    # sorting
    direction = desc
    field = "submitted_at"
    if sort:
        try:
            raw_field, raw_dir = sort.split(":")
            raw_dir = raw_dir.lower()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid sort spec. Use field:direction")
        if raw_field not in {"submitted_at", "company", "status"}:
            raise HTTPException(status_code=400, detail="Unsupported sort field")
        if raw_dir not in {"asc", "desc"}:
            raise HTTPException(status_code=400, detail="Sort direction must be asc or desc")
        direction = asc if raw_dir == "asc" else desc
        field = raw_field

    sort_col_map = {
        "submitted_at": ApplicationORM.submitted_at,
        "company": JobORM.company,
        "status": ApplicationORM.status,
    }
    query = query.order_by(direction(sort_col_map[field]))

    # total BEFORE pagination
    total = query.count()

    # pagination
    offset = (page - 1) * page_size
    results = query.offset(offset).limit(page_size).all()

    app_responses = []
    for app in results:
        job = app.job
        classification_val = getattr(job, "classification", None) or ""
        action_val = getattr(job, "action", None) or ""
        submitted_at = app.submitted_at.strftime("%Y-%m-%d") if app.submitted_at else ""
        app_responses.append(
            ApplicationResponse(
                id=str(app.id),
                company=job.company,
                position=job.title,
                status=app.status,
                applicationDate=submitted_at,
                location=job.location or "NOT PROVIDED",
                jobType=job.type or "",
                classification=classification_val,
                action=action_val,
                notes="NOT IMPLEMENTED",
            )
        )

    # pagination metadata
    total_pages = (total + page_size - 1) // page_size if page_size else 1
    if page > total_pages and total_pages != 0:
        raise HTTPException(status_code=400, detail="Page out of range")

    return GetSubmittedApplicationsResponse(
        applications=app_responses,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/applications/{app_id}")
def get_application_details(app_id: UUID):
    """Get application details by ID."""
    pass


@router.patch("/applications/{app_id}")
def update_application(app_id: UUID, db: Session = Depends(get_db)):
    """Update application details by ID."""
    pass


@router.get("/applications/{app_id}/form")
def get_application_form(app_id: UUID):
    """Get application form details by app ID."""
    pass


@router.patch("/applications/{app_id}/form")
def update_application_form(app_id: UUID, db: Session = Depends(get_db)):
    """Update application form details by app ID."""
    pass


@router.put("/applications/{app_id}/prepare")
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

        if not claim_app_for_prep(db, app_id):
            return JSONResponse(
                status_code=202,
                content={"message": f"App {app_id} already queued for preparation"},
            )

    # task
    task = prepare_application_task.delay(job.id, app.id, user.to_json())

    # response
    return JSONResponse(
        status_code=202,
        content={
            "task_id": task.id,
            "status": "success",
            "message": f"Application {app_id} queued for preparation",
        },
    )


@router.put("/applications/{app_id}/submit")
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
            logging.debug(f"/app/{app_id}/submit: Job site not supported for submission: {app.url}")
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "message": f"Job site not supported for submission: {app.url}",
                },
            )

        if not claim_app_for_submission(db, app_id):
            return JSONResponse(
                status_code=202,
                content={"message": f"App {app_id} already queued for preparation"},
            )

    # task
    task = submit_application_task.delay(job.id, app_id)

    # response
    return JSONResponse(
        status_code=202,
        content={
            "task_id": task.id,
            "status": "success",
            "message": f"Application {app_id} was queued for submission",
        },
    )
