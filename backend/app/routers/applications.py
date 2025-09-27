from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from app.core.utils import get_domain_handler
from app.database.models import ApplicationFormORM, ApplicationORM, JobORM
from app.database.utils.claims import claim_app_for_prep, claim_app_for_submission
from app.database.utils.queries import fetch_application_by_id
from app.dependencies import get_current_user, get_db
from app.schemas.api import (
    ApplicationPatchRequest,
    ApplicationResponse,
    GetApplicationFormResponse,
    GetApplicationsResponse,
)
from app.schemas.definitions import (
    ApplicationFormState,
    ApplicationStatus,
    JobClassification,
    User,
)
from app.worker.tasks import prepare_application_task, submit_application_task
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
        description="Sort spec field:direction. Allowed fields: company, status, submitted_at",
    ),
) -> GetApplicationsResponse:
    """Get applications with filtering, sorting, and pagination.

    Notes:
    - Multi-value filters (status, form_state, classification) are OR within the same param, AND across different params.
    - company does ILIKE '%%value%%'.
    - Dates filter on ApplicationORM.submitted_at.
    - Always excludes applications without submitted_at unless filtering for statuses where submitted_at may be null.
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
                status=app.status.value,
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

    return GetApplicationsResponse(
        applications=app_responses,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/applications/{app_id}")
def get_application_details(app_id: UUID, db: Session = Depends(get_db)):
    """Get application details by ID."""
    app = fetch_application_by_id(db, app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    return ApplicationResponse(
        id=str(app.id),
        company=app.job.company,
        position=app.job.title,
        status=app.status.value,
        applicationDate=app.submitted_at.strftime("%Y-%m-%d") if app.submitted_at else "",
        location=app.job.location or "NOT PROVIDED",
        jobType=app.job.type or "",
        classification=app.job.classification.value or "",
        action=app.job.action or "",
        notes="NOT IMPLEMENTED",
    )


@router.patch("/applications/{app_id}")
def update_application(
    app_id: UUID,
    payload: ApplicationPatchRequest,
    db: Session = Depends(get_db),
) -> ApplicationResponse:
    """Update an application.

    Allowed fields: status, form_state, referred
    Rules:
    - status may not be earlier than SUBMITTED
    - form_state may only progress forward (no regression)
    - empty body -> 400; no effective change -> 400
    """
    if payload.is_empty():
        raise HTTPException(status_code=400, detail="Empty body: provide at least one field")

    app: ApplicationORM | None = (
        db.query(ApplicationORM).join(JobORM).filter(ApplicationORM.id == app_id).first()
    )
    if not app:
        raise HTTPException(status_code=404, detail=f"Application {app_id} not found")

    updated = False

    # status update
    allowed_values = [s.value for s in ApplicationStatus if s >= ApplicationStatus.SUBMITTED]
    if payload.status is not None:
        try:
            new_status = ApplicationStatus(payload.status)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status value. Allowed: {', '.join(allowed_values)}",
            )
        if new_status < ApplicationStatus.SUBMITTED:
            raise HTTPException(
                status_code=400,
                detail=f"Illegal status value. Allowed via PATCH: {', '.join(allowed_values)}",
            )
        if new_status != app.status:
            app.status = new_status.value
            if new_status == ApplicationStatus.SUBMITTED and app.submitted_at is None:
                app.submitted_at = datetime.now(timezone.utc)
            updated = True

    # form_state update
    allowed_values = [s.value for s in ApplicationFormState if s >= ApplicationFormState.APPROVED]
    if payload.form_state is not None:
        if not app.form:
            raise HTTPException(
                status_code=400, detail=f"Application {app_id} has no form to update state"
            )
        try:
            new_state = ApplicationFormState(payload.form_state)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid form_state value. Allowed: {', '.join(allowed_values)}",
            )
        if new_state < ApplicationFormState.APPROVED:
            raise HTTPException(
                status_code=400,
                detail=f"Illegal status value. Allowed via PATCH: {', '.join(allowed_values)}",
            )
        if new_state != app.form.state:
            app.form.state = new_state.value
            updated = True

    # referred update
    if payload.referred is not None and app.referred != payload.referred:
        app.referred = payload.referred
        updated = True

    if not updated:
        raise HTTPException(status_code=400, detail="No meaningful changes detected")

    db.add(app)
    db.commit()

    job = app.job
    classification_val = getattr(job, "classification", None) or ""
    action_val = getattr(job, "action", None) or ""
    submitted_at_str = app.submitted_at.strftime("%Y-%m-%d") if app.submitted_at else ""

    return ApplicationResponse(
        id=str(app.id),
        company=job.company,
        position=job.title,
        status=app.status,
        applicationDate=submitted_at_str,
        location=job.location or "NOT PROVIDED",
        jobType=job.type or "",
        classification=classification_val,
        action=action_val,
        notes="NOT IMPLEMENTED",
    )


@router.get("/applications/{app_id}/form")
def get_application_form(app_id: UUID, db: Session = Depends(get_db)):
    """Get application form details by app ID."""
    app = fetch_application_by_id(db, app_id)
    if not app.form:
        raise HTTPException(status_code=404, detail=f"Application {app_id} has no form")

    return GetApplicationFormResponse(form=app.form)


@router.patch("/applications/{app_id}/form")
def update_application_form(app_id: UUID, db: Session = Depends(get_db)):
    """Update application form details by app ID."""
    pass


@router.put("/applications/{app_id}/prepare")
def prepare_application(
    app_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    """Create an app for a job by its ID."""
    # arg validation
    app = fetch_application_by_id(db, app_id)
    if app is None:
        raise HTTPException(status_code=404, detail=f"Application {app_id} not found")

    if app.job is None:
        raise HTTPException(
            status_code=404, detail=f"Job {app.job_id} attached to application {app_id} not found"
        )

    if app.form.state == ApplicationFormState.PREPARED:
        raise HTTPException(status_code=500, detail=f"Application {app.id} is already prepared")

    # claim and queue
    if not claim_app_for_prep(db, app_id):
        return JSONResponse(
            status_code=202,
            content={"message": f"App {app_id} already queued for preparation"},
        )
    task = prepare_application_task.delay(app.id, user.to_json())

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
def submit_application(app_id: UUID, db: Session = Depends(get_db)):
    """Submit an application"""
    # arg validation
    app = fetch_application_by_id(db, app_id)
    if not app:
        raise HTTPException(status_code=404, detail=f"Application {app_id} not found")

    if app.job is None:
        raise HTTPException(
            status_code=404, detail=f"Job {app.job_id} attached to application {app_id} not found"
        )

    if app.form.state != ApplicationFormState.APPROVED:
        raise HTTPException(
            status_code=500,
            detail=f"Application {app_id} must be approved by user before submission",
        )

    job_site = get_domain_handler(app.url)
    if job_site is None:
        raise HTTPException(
            status_code=500, detail=f"Job site not supported for submission: {app.url}"
        )

    if not claim_app_for_submission(db, app_id):
        return JSONResponse(
            status_code=202, content={"message": f"App {app_id} already queued for preparation"}
        )

    # task
    task = submit_application_task.delay(app_id)

    # response
    return JSONResponse(
        status_code=202,
        content={
            "task_id": task.id,
            "status": "success",
            "message": f"Application {app_id} was queued for submission",
        },
    )
