import logging
import os
from json import JSONDecodeError

from celery import Celery
from db.database import SessionLocal
from db.utils import (
    add_new_application,
    add_new_scraped_jobs,
    get_application_by_job_id,
    update_application_by_id,
    update_job_by_id,
)
from requests import JSONDecodeError
from src.definitions import App, Job, User
from src.errors import MissingAppUrlError, QuestionNotFoundError
from src.jobs import (
    check_job_expiration,
    prepare_job_app,
    save_jobs,
    scrape_job_app,
    submit_app,
)
from src.llm import evaluate_candidate_aptitude
from src.utils import get_base_url

CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_BACKEND_URL = os.getenv("CELERY_BACKEND_URL", "redis://localhost:6379/1")

celery_app = Celery("worker", broker=CELERY_BROKER_URL, backend=CELERY_BACKEND_URL)
celery_app.conf.update(
    task_time_limit=60 * 10,
    task_soft_time_limit=60 * 8,
    worker_concurrency=int(os.getenv("CELERY_CONCURRENCY", "4")),
)


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


@celery_app.task
def get_new_jobs_task(num_jobs: int):
    # logic
    try:
        logging.info("Finding jobs...")
        jobs = save_jobs(num_jobs)
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
def evaluate_job_task(job: dict, user: dict):
    job = Job(**job)
    user = User(**user)

    # logic
    try:
        logging.info(f"Reviewing job {job.id}...")
        reviewed_job = evaluate_candidate_aptitude(job, user)
    except JSONDecodeError:
        raise JSONDecodeError(
            f"evaluate_candidate_aptitude failed to return a valid JSON response for job {job.id}"
        )
    except Exception as e:
        raise Exception(f"Error reviewing job {job.id}", e)

    # database operation
    try:
        with SessionLocal() as db:
            update_job_by_id(db, job.id, reviewed_job)
    except Exception as e:
        raise Exception(f"Error updating job {job.id} in database", e)

    return reviewed_job.reviewed


@celery_app.task
def create_app_task(job: dict):
    job = Job(**job)

    # logic
    try:
        logging.info(f"Scraping job {job.id} questions...")
        app = scrape_job_app(job)
    except ValueError as e:
        raise ValueError(f"Job {job.id} is missing URLs")
    except NotImplementedError as e:
        raise NotImplementedError(
            f"{get_base_url(job.direct_job_url or job.linkedin_job_url)} scraping is not supported at this time"
        )
    except Exception as e:
        raise Exception(f"Error scraping job {job.id}", e)

    # database operation
    try:
        with SessionLocal() as db:
            existing_app = get_application_by_job_id(db, job.id)
            if existing_app is None:
                add_new_application(db, app)
            else:
                update_application_by_id(db, existing_app.id, app)
    except Exception as e:
        raise Exception(f"Error updating app {app.id} in database", e)

    return app.scraped


@celery_app.task
def check_if_job_still_exists_task(job: dict):
    job = Job(**job)

    # logic
    try:
        expired = check_job_expiration(job)
    except Exception as e:
        raise Exception(f"Error checking job expiration for {job.id}", e)

    # database operation
    try:
        if expired:
            job.expired = True
            with SessionLocal() as db:
                update_job_by_id(db, job.id, job)
    except Exception as e:
        raise Exception(f"Error updating job {job.id} in database", e)

    return expired


@celery_app.task
def prepare_application_task(job: dict, app: dict, user: dict):
    job = Job(**job)
    app = App(**app)
    user = User(**user)
    # logic
    try:
        logging.info(f"Preparing app {app.id}...")
        prepared_app = prepare_job_app(job, app, user)
    except Exception as e:
        raise Exception(f"Failed to prepare app {app.id}", e)

    # database operation
    try:
        with SessionLocal() as db:
            update_application_by_id(db, app.id, prepared_app)
    except Exception as e:
        raise Exception(f"Error updating app {app.id} in database", e)

    return prepared_app.prepared


@celery_app.task
def submit_application_task(job: dict, app: dict):
    job = Job(**job)
    app = App(**app)

    # logic
    try:
        logging.info(f"Submitting app {app.id}...")
        applied_app = submit_app(app, job)
    except MissingAppUrlError:
        raise MissingAppUrlError(f"Job {job.id} is missing URLs")
    except QuestionNotFoundError:
        raise QuestionNotFoundError(f"Required question not found for app {app.id}")
    except NotImplementedError:
        raise NotImplementedError(
            f"{get_base_url(app.url)} app submission is not supported at this time"
        )
    except Exception as e:
        raise Exception(f"Error submitting application for app {app.id}", e)

    # database operation
    try:
        with SessionLocal() as db:
            update_application_by_id(db, app.id, applied_app)
    except Exception as e:
        raise Exception(f"Error updating app {app.id} in database", e)

    return applied_app.submitted
