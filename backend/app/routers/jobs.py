from uuid import UUID

from fastapi import APIRouter

router = APIRouter()

DEFAULT_JOBS_TO_FIND = 50


@router.get("/jobs")
def list_jobs(db: Session = Depends(get_db)):
    """List all jobs (for frontend page)."""
    jobs = get_all_jobs(db)
    return JSONResponse(
        status_code=200,
        content={"jobs": [job.to_json() for job in jobs]},
    )


@router.get("/jobs/{job_id}")
def get_job_details(job_id: UUID):
    """Get a specific job by ID."""
    pass


@router.patch("/jobs/{job_id}")
def update_job(job_id: UUID):
    """Update a specific job by ID."""
    pass


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
                status_code=202,
                content={"message": f"Job {job_id} already queued for review"},
            )

    # task
    task = evaluate_job_task.delay(job.id, user.to_json())

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
def check_job_expiration(job_id: UUID):
    """Check if a specific job is expired by ID"""
    with SessionLocal() as db:
        # arg validation
        job = get_job_by_id(db, job_id)
        if job is None:
            logging.error(f"/job/{job_id}/expire-check: Job not found", exc_info=True)
            return JSONResponse(
                status_code=404,
                content={
                    "status": "error",
                    "message": f"Job {job_id} not found",
                },
            )

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
        if existing_app:
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

        if not claim_job_for_app_creation(db, job_id):
            return JSONResponse(
                status_code=202,
                content={"message": f"Job {job_id} already queued for app creation"},
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
