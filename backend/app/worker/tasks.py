import logging
import os
import random
from json import JSONDecodeError
from uuid import UUID

import redis
from app.core.jobs import (
    check_job_expiration,
    fill_out_application_form,
    save_jobs,
    scrape_application_form,
    submit_app,
)
from app.core.llm import evaluate_candidate_aptitude
from app.core.utils import get_base_url
from app.database.session import SessionLocal
from app.database.utils.claims import (
    clear_app_preparation_claim,
    clear_app_submission_claim,
    clear_job_app_creation_claim,
    clear_job_expiration_claim,
    clear_job_review_claim,
    set_app_prepared,
    set_app_submitted,
    set_job_app_created,
    set_job_expired,
    set_job_reviewed,
)
from app.database.utils.mutations import add_new_scraped_jobs
from app.database.utils.queries import get_application_by_id, get_job_by_id
from app.schemas.definitions import (
    Application,
    ApplicationFormState,
    ApplicationStatus,
    Job,
    JobState,
    User,
)
from app.schemas.errors import MissingAppUrlError, QuestionNotFoundError
from celery import Celery
from requests import JSONDecodeError

CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_BACKEND_URL = os.getenv("CELERY_BACKEND_URL", "redis://localhost:6379/1")

celery_app = Celery("worker", broker=CELERY_BROKER_URL, backend=CELERY_BACKEND_URL)
celery_app.conf.update(
    task_time_limit=60 * 10,
    task_soft_time_limit=60 * 8,
    worker_concurrency=int(os.getenv("CELERY_CONCURRENCY", "4")),
)


def _get_redis_client():
    url = os.getenv("CELERY_BACKEND_URL") or os.getenv("CELERY_BROKER_URL")
    return redis.from_url(url) if url else redis.Redis(host="localhost", port=6379, db=0)


def _acquire_jobspy_lock(ttl_seconds: int = 60):
    client = _get_redis_client()
    return client.lock("jobspy:lock", timeout=ttl_seconds, blocking_timeout=0)


def validate_job_id(job_id: UUID) -> Job:
    job = None
    with SessionLocal() as db:
        job = get_job_by_id(db, job_id)
    if job is None:
        raise ValueError(f"Job with id {job_id} not found.")

    return job


def validate_app_id(app_id: UUID) -> Application:
    app = None
    with SessionLocal() as db:
        app = get_application_by_id(db, app_id)
    if app is None:
        raise ValueError(f"App with id {app_id} not found.")

    return app


def get_task_status(task_id: str):
    task_result = celery_app.AsyncResult(task_id)
    status = task_result.status
    if status == "SUCCESS":
        return {
            "task_id": task_id,
            "status": status,
            "result": task_result.result,
        }
    elif status == "FAILURE":
        return {
            "task_id": task_id,
            "status": status,
            "error": str(task_result.result),
        }
    else:
        return {
            "task_id": task_id,
            "status": status,
        }


@celery_app.task(
    rate_limit="1/m",
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=60,
    retry_jitter=True,
    retry_kwargs={"max_retries": 5},
)
def get_new_jobs_task(num_jobs: int):
    # logic
    try:
        lock = _acquire_jobspy_lock(ttl_seconds=45)
        if not lock.acquire(blocking=False):
            raise get_new_jobs_task.retry(
                exc=RuntimeError("JobSpy is busy; retrying later"),
                countdown=random.randint(5, 20),
            )
        try:
            logging.info("Finding jobs...")
            jobs = save_jobs(num_jobs)
        finally:
            try:
                lock.release()
            except Exception:
                pass
    except Exception as e:
        raise Exception(f"Error saving jobs", e)

    # database operation
    try:
        with SessionLocal() as db:
            jobs = add_new_scraped_jobs(db, jobs)
    except Exception as e:
        raise Exception(f"Error adding new jobs to database", e)

    return len(jobs)


@celery_app.task
def evaluate_job_task(job_id: UUID, user: dict) -> bool:
    user = User(**user)
    job = validate_job_id(job_id)

    if job.state >= JobState.REVIEWED:
        with SessionLocal() as db:
            clear_job_review_claim(db, job.id)
        return True

    # logic
    try:
        logging.info(f"Reviewing job {job.id}...")
        review = evaluate_candidate_aptitude(job, user)
    except (JSONDecodeError, Exception) as e:
        error_message = None
        if type(e) is JSONDecodeError:
            error_message = f"evaluate_candidate_aptitude failed to return a valid JSON response for job {job.id}"
        else:
            error_message = f"Error reviewing job {job.id}"

        with SessionLocal() as db:
            clear_job_review_claim(db, job.id)

        raise Exception(error_message, e)

    # database operation
    try:
        with SessionLocal() as db:
            set_job_reviewed(db, job.id, review)
        return True
    except Exception as e:
        with SessionLocal() as db:
            clear_job_review_claim(db, job.id)
        raise Exception(f"Error updating job {job.id} in database", e)


@celery_app.task
def create_app_task(job_id: UUID) -> UUID:
    job: Job = validate_job_id(job_id)

    if job.applications[0].form.state < ApplicationFormState.SCRAPED:
        with SessionLocal() as db:
            clear_job_app_creation_claim(db, job.id)
        return True

    # logic
    try:
        logging.info(f"Scraping job {job.id} questions...")
        app = scrape_application_form(job)
    except (ValueError, NotImplementedError, Exception) as e:
        error_message = None
        if type(e) is ValueError:
            error_message = f"Job {job.id} is missing URLs"
        elif type(e) is NotImplementedError:
            error_message = f"{get_base_url(job.direct_job_url or job.linkedin_job_url)} scraping is not supported at this time"
        else:
            error_message = f"Error scraping job {job.id}"

        with SessionLocal() as db:
            clear_job_app_creation_claim(db, job.id)

        raise Exception(error_message, e)

    # database operation
    try:
        with SessionLocal() as db:
            set_job_app_created(db, app)
    except Exception as e:
        clear_job_app_creation_claim(db, job.id)
        raise Exception(f"Error updating app {app.id} in database", e)

    return app.scraped


@celery_app.task
def check_if_job_still_exists_task(job_id: UUID):
    job = validate_job_id(job_id)

    if job.state == JobState.EXPIRED:
        with SessionLocal() as db:
            clear_job_expiration_claim(db, job.id)
        return True

    # logic
    try:
        expired = check_job_expiration(job)
    except Exception as e:
        clear_job_expiration_claim(db, job.id)
        raise Exception(f"Error checking job expiration for {job.id}", e)

    # database operation
    try:
        with SessionLocal() as db:
            if expired:
                set_job_expired(db, job.id)
            else:
                clear_job_expiration_claim(db, job.id)
    except Exception as e:
        clear_job_expiration_claim(db, job.id)
        raise Exception(f"Error updating job {job.id} in database", e)

    return expired


@celery_app.task
def prepare_application_task(job_id: UUID, app_id: UUID, user: dict):
    job = validate_job_id(job_id)
    app = validate_app_id(app_id)
    user = User(**user)

    if app.form.state >= ApplicationFormState.PREPARED:
        with SessionLocal() as db:
            clear_app_preparation_claim(db, app.id)
        return True

    # logic
    try:
        logging.info(f"Preparing app {app.id}...")
        prepared_app = fill_out_application_form(app, user)
    except Exception as e:
        with SessionLocal() as db:
            clear_app_preparation_claim(db, app.id)
        raise Exception(f"Failed to prepare app {app.id}", e)

    # database operation
    try:
        with SessionLocal() as db:
            set_app_prepared(db, app.id)
    except Exception as e:
        with SessionLocal() as db:
            clear_app_preparation_claim(db, app.id)
        raise Exception(f"Error updating app {app.id} in database", e)

    return True


@celery_app.task
def submit_application_task(job_id: UUID, app_id: UUID):
    job = validate_job_id(job_id)
    app = validate_app_id(app_id)

    if app.status >= ApplicationStatus.SUBMITTED:
        with SessionLocal() as db:
            clear_app_submission_claim(db, app.id)
        return True

    # logic
    try:
        logging.info(f"Submitting app {app.id}...")
        submitted = submit_app(app, job)
    except (
        MissingAppUrlError,
        QuestionNotFoundError,
        NotImplementedError,
        Exception,
    ) as e:
        error_message = None
        if type(e) is MissingAppUrlError:
            error_message = f"Job {job.id} is missing URLs"
        elif type(e) is QuestionNotFoundError:
            error_message = f"Required question not found for app {app.id}"
        elif type(e) is NotImplementedError:
            error_message = f"{get_base_url(app.url)} app submission is not supported at this time"
        else:
            error_message = f"Error submitting application for app {app.id}"

        with SessionLocal() as db:
            clear_app_submission_claim(db, app.id)

        raise Exception(error_message, e)

    # database operation
    try:
        with SessionLocal() as db:
            if submitted:
                set_app_submitted(db, app.id)
            else:
                clear_app_submission_claim(db, app.id)
    except Exception as e:
        clear_app_submission_claim(db, app.id)
        raise Exception(f"Error updating app {app.id} in database", e)

    return True
