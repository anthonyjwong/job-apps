from datetime import datetime
from typing import List, Optional
from uuid import UUID

from app.core.utils import get_domain_handler
from app.database.models import JobORM
from app.database.utils.claims import (
    claim_job_for_app_creation,
    claim_job_for_expiration_check,
    claim_job_for_review,
)
from app.database.utils.queries import fetch_application_by_job_id, fetch_job_by_id
from app.dependencies import get_current_user, get_db
from app.schemas.api import GetJobsResponse, JobPatchRequest, JobResponse
from app.schemas.definitions import JobClassification, JobState, User
from app.worker.tasks import (
    check_if_job_still_exists_task,
    create_app_task,
    evaluate_job_task,
    get_new_jobs_task,
)
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy import asc, desc, func
from sqlalchemy.orm import Session

router = APIRouter()

DEFAULT_JOBS_TO_FIND = 50


@router.get("/jobs")
def get_jobs(
    db: Session = Depends(get_db),
    state: Optional[List[JobState]] = Query(
        default=None, description="Filter by one or more job states"
    ),
    classification: Optional[List[JobClassification]] = Query(
        default=None, description="Filter by one or more job classifications"
    ),
    company: Optional[str] = Query(
        default=None, description="Case-insensitive substring match on company"
    ),
    title: Optional[str] = Query(default=None, description="Case-insensitive substring on title"),
    job_type: Optional[str] = Query(default=None, description="Exact match on job type"),
    location: Optional[str] = Query(
        default=None, description="Case-insensitive substring match on location"
    ),
    min_posted: Optional[str] = Query(default=None, description="Minimum posted date (YYYY-MM-DD)"),
    max_posted: Optional[str] = Query(default=None, description="Maximum posted date (YYYY-MM-DD)"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(25, ge=1, le=100, description="Items per page"),
    sort: Optional[str] = Query(
        default="date_posted:desc",
        description="Sort spec field:direction. Allowed: classification, company, date_posted, state, title",
    ),
) -> GetJobsResponse:
    """List jobs with filtering, sorting, and pagination.

    Notes:
    - Multi-value filters (state, classification) are OR within the same param, AND across different params.
    - company does ILIKE '%%value%%'.
    - Dates filter on JobORM.date_posted.
    - Always excludes jobs without date_posted unless filtering for states where date_posted may be null.
    """
    query = db.query(JobORM)

    # filters
    if state:
        query = query.filter(JobORM.state.in_([s.value for s in state]))
    if classification:
        query = query.filter(JobORM.classification.in_([c.value for c in classification]))
    if company:
        like_expr = f"%{company}%"
        query = query.filter(func.lower(JobORM.company).like(func.lower(like_expr)))
    if title:
        like_expr = f"%{title}%"
        query = query.filter(func.lower(JobORM.title).like(func.lower(like_expr)))
    if job_type:
        query = query.filter(JobORM.type == job_type)
    if location:
        like_expr = f"%{location}%"
        query = query.filter(func.lower(JobORM.location).like(func.lower(like_expr)))

    date_format = "%Y-%m-%d"
    if min_posted:
        try:
            min_dt = datetime.strptime(min_posted, date_format)
        except ValueError:
            raise HTTPException(
                status_code=400, detail="Invalid min_posted format, expected YYYY-MM-DD"
            )
        query = query.filter(JobORM.date_posted >= min_dt)
    if max_posted:
        try:
            max_dt = datetime.strptime(max_posted, date_format)
        except ValueError:
            raise HTTPException(
                status_code=400, detail="Invalid max_posted format, expected YYYY-MM-DD"
            )
        query = query.filter(JobORM.date_posted <= max_dt)

    # sorting
    direction = desc
    field = "date_posted"
    if sort:
        try:
            raw_field, raw_dir = sort.split(":")
            raw_dir = raw_dir.lower()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid sort spec. Use field:direction")
        if raw_field not in {"classification", "company", "date_posted", "state", "title"}:
            raise HTTPException(status_code=400, detail="Unsupported sort field")
        if raw_dir not in {"asc", "desc"}:
            raise HTTPException(status_code=400, detail="Sort direction must be asc or desc")
        direction = asc if raw_dir == "asc" else desc
        field = raw_field

    sort_col_map = {
        "date_posted": JobORM.date_posted,
        "company": JobORM.company,
        "title": JobORM.title,
        "state": JobORM.state,
    }
    query = query.order_by(direction(sort_col_map[field]))

    total = query.count()
    offset = (page - 1) * page_size
    results = query.offset(offset).limit(page_size).all()

    total_pages = (total + page_size - 1) // page_size if page_size else 1
    if page > total_pages and total_pages != 0:
        raise HTTPException(status_code=400, detail="Page out of range")

    job_responses = []
    for j in results:
        job_responses.append(
            JobResponse(
                id=str(j.id),
                title=j.title,
                company=j.company,
                location=j.location,
                classification=j.classification if j.classification else None,
                action=j.action if j.action else None,
                state=j.state,
                jobType=j.type,
                datePosted=j.date_posted.strftime("%Y-%m-%d") if j.date_posted else None,
            )
        )

    return GetJobsResponse(
        jobs=job_responses,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/jobs/{job_id}")
def get_job_details(job_id: UUID, db: Session = Depends(get_db)):
    """Get a specific job by ID."""
    job = db.query(JobORM).filter(JobORM.id == job_id).first()
    if job is None:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    return JobResponse(
        id=str(job.id),
        title=job.title,
        company=job.company,
        location=job.location,
        classification=job.classification if job.classification else None,
        action=job.action if job.action else None,
        state=job.state,
        jobType=job.type,
        datePosted=job.date_posted.strftime("%Y-%m-%d") if job.date_posted else None,
    )


@router.patch("/jobs/{job_id}")
def update_job(
    job_id: UUID,
    payload: JobPatchRequest,
    db: Session = Depends(get_db),
) -> JobResponse:
    """Update a specific job by ID.

    Allowed fields: state, classification, action.
    - state & classification validated against enums
    """
    if payload.is_empty():
        raise HTTPException(status_code=400, detail="Empty body: provide at least one field")

    job: JobORM | None = db.query(JobORM).filter(JobORM.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    updated = False

    # state update
    allowed_values = [s.value for s in JobState if s >= JobState.APPROVED]
    if payload.state is not None:
        try:
            new_state = JobState(payload.state)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid state value")
        if new_state < JobState.APPROVED:
            raise HTTPException(
                status_code=400, detail=f'Illegal state value, must be: {", ".join(allowed_values)}'
            )
        if new_state != job.state:
            job.state = new_state.value
            updated = True

    # classification update
    if payload.classification is not None:
        try:
            new_class = JobClassification(payload.classification)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid classification value")
        if job.classification != new_class.value:
            job.classification = new_class.value
            updated = True

    # action update
    if payload.action is not None:
        new_action = payload.action.strip()
        if job.action != new_action:
            job.action = new_action
            updated = True

    if not updated:
        raise HTTPException(status_code=400, detail="No meaningful changes detected")

    db.add(job)
    db.commit()

    return JobResponse(
        id=str(job.id),
        title=job.title,
        company=job.company,
        location=job.location,
        classification=job.classification if job.classification else None,
        action=job.action if job.action else None,
        state=job.state,
        jobType=job.type,
        datePosted=job.date_posted.strftime("%Y-%m-%d") if job.date_posted else None,
    )


@router.post("/jobs/refresh")
def discover_new_jobs(
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


@router.post("/jobs/{job_id}/review")
def review_job(job_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Review a specific job by ID"""
    # arg validation
    job = fetch_job_by_id(db, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    if job.manually_created:
        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "message": f"Job {job_id} is marked manual, skipping review",
            },
        )

    if not claim_job_for_review(db, job_id):
        return JSONResponse(
            status_code=202, content={"message": f"Job {job_id} already queued for review"}
        )

    # task
    task = evaluate_job_task.delay(job.id, user.to_dict())

    # response
    return JSONResponse(
        status_code=202,
        content={
            "task_id": task.id,
            "status": "success",
            "message": f"Job {job_id} sent for review",
        },
    )


@router.post("/jobs/{job_id}/expire-check")
def check_job_expiration(job_id: UUID, db: Session = Depends(get_db)):
    """Check if a specific job is expired by ID"""
    # arg validation
    job = fetch_job_by_id(db, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    if not job.linkedin_job_url:
        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "message": f"Job {job_id} has no LinkedIn URL, skipping expiration check",
            },
        )

    if not claim_job_for_expiration_check(db, job_id):
        return JSONResponse(
            status_code=202,
            content={"message": f"Job {job_id} already queued for expiration check"},
        )

    # task
    task = check_if_job_still_exists_task.delay(job.id)

    # response
    return JSONResponse(
        status_code=202,
        content={
            "task_id": task.id,
            "status": "success",
            "message": f"Job {job_id} sent for expiration check",
        },
    )


@router.post("/jobs/{job_id}/application")
def create_job_application(job_id: UUID, db: Session = Depends(get_db)):
    """Create an app for a job by its ID."""
    # arg validation
    job = fetch_job_by_id(db, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    existing_app = fetch_application_by_job_id(db, job_id)
    if existing_app:
        raise HTTPException(status_code=500, detail=f"Application for job {job_id} already scraped")

    job_url = job.direct_job_url or job.linkedin_job_url
    if not job_url:
        raise HTTPException(status_code=500, detail=f"Job {job_id} is missing URLs.")

    job_site = get_domain_handler(job_url)
    if job_site is None:
        raise HTTPException(
            status_code=500, detail=f"Job site not supported for app creation: {job_url}"
        )

    if not claim_job_for_app_creation(db, job_id):
        return JSONResponse(
            status_code=202, content={"message": f"Job {job_id} already queued for app creation"}
        )

    # task
    task = create_app_task.delay(job_id)

    # response
    return JSONResponse(
        status_code=202,
        content={
            "task_id": task.id,
            "status": "success",
            "message": f"Application for job {job_id} queued for creation",
        },
    )
