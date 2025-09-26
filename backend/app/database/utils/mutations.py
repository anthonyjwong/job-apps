import logging

from app.database.crud import app_to_orm, job_to_orm, orm_to_job
from app.database.models import ApplicationORM, JobORM
from app.schemas.definitions import (
    Application,
    ApplicationFormState,
    ApplicationStatus,
    Job,
)


def update_job_by_id(db_session, job_id, updated_job: Job):
    """Update a job by its ID."""
    job_orm = db_session.query(JobORM).filter(JobORM.id == job_id).first()
    if job_orm:
        for key, value in updated_job.__dict__.items():
            if (
                key == "id"
                or key == "review_claim"
                or key == "create_app_claim"
                or key == "expiration_check_claim"
            ):
                continue
            elif key == "review" and value is not None:
                # convert Review object to dict for JSON storage
                try:
                    value = value.to_json()  # type: ignore[attr-defined]
                except Exception:
                    value = getattr(value, "__dict__", value)
            setattr(job_orm, key, value)
        db_session.commit()


def approve_job_by_id(db_session, job_id):
    """Approve a job by its ID."""
    job = db_session.query(JobORM).filter(JobORM.id == job_id).first()
    if not job:
        raise ValueError(f"Job with id {job_id} not found.")
    job.approved = True
    db_session.commit()
    logging.debug(f"Job {job_id} approved")


def discard_job_by_id(db_session, job_id):
    """Set the discarded field to True."""
    job = db_session.query(JobORM).filter(JobORM.id == job_id).first()
    if not job:
        raise ValueError(f"Job with id {job_id} not found.")
    job.discarded = True
    db_session.commit()
    logging.debug(f"Job {job_id} discarded")


def update_application_by_id(db_session, app_id, updated_app: Application):
    """Update an application by its ID."""
    app = db_session.query(ApplicationORM).filter(ApplicationORM.id == app_id).first()
    if app:
        for key, value in updated_app.__dict__.items():
            if key == "id" or key == "prepare_claim" or key == "submission_claim":
                continue
            elif key == "fields":
                fields = [field.__dict__ for field in value]
                setattr(app, key, fields)
            else:
                setattr(app, key, value)
        db_session.commit()


def update_application_state_by_id(db_session, app_id, new_state: str):
    """Update the state of an application by its ID."""
    app = db_session.query(ApplicationORM).filter(ApplicationORM.id == app_id).first()
    if not app:
        raise ValueError(f"Application with id {app_id} not found.")

    if new_state == "submitted":
        app.submitted = True
        app.acknowledged = False
        app.assessment = False
        app.interview = False
        app.rejected = False
    elif new_state == "acknowledged":
        app.acknowledged = True
        app.rejected = False
    elif new_state == "assessment":
        app.assessment = True
        app.rejected = False
    elif new_state == "interview":
        app.interview = True
        app.rejected = False
    elif new_state == "rejected":
        app.rejected = True

    db_session.commit()
    logging.debug(f"App {app_id} state updated to {new_state}")


def update_application_by_id_with_fragment(db_session, app_id, fragment):
    """Update an application by its ID."""
    pass
    app = db_session.query(ApplicationORM).filter(ApplicationORM.id == app_id).first()
    if app:
        for key, value in fragment.__dict__.items():
            if key == "id":
                continue
            elif key == "fields":
                fields = [field.__dict__ for field in value]
                setattr(app, key, fields)
            else:
                setattr(app, key, value)
        db_session.commit()
        logging.debug(f"App {app_id} manually updated by user")


def approve_application_by_id(db_session, app_id):
    """Approve an application by its ID atomically."""
    app = db_session.query(ApplicationORM).filter(ApplicationORM.id == app_id).first()
    if not app:
        raise ValueError(f"Application with id {app_id} not found.")
    try:
        with db_session.begin_nested():
            app.form.update({ApplicationFormState.APPROVED: True})
            app.status = ApplicationStatus.READY
        db_session.commit()
        logging.debug(f"App {app_id} approved")
    except Exception as e:
        db_session.rollback()
        logging.error(f"Failed to approve app {app_id}: {e}")
        raise


def discard_application_by_id(db_session, app_id):
    """Set the discarded field to True."""
    app = db_session.query(ApplicationORM).filter(ApplicationORM.id == app_id).first()
    if not app:
        raise ValueError(f"Application with id {app_id} not found.")
    app.discarded = True
    db_session.commit()
    logging.debug(f"App {app_id} discarded")


def add_new_scraped_jobs(db_session, new_jobs: list[Job]) -> list[Job]:
    """Add newly scraped jobs to the database."""
    added_jobs = []
    num_new_jobs = 0
    for job in new_jobs:
        job_orm = job_to_orm(job)

        # check if job already exists
        existing_job = (
            db_session.query(JobORM).filter(JobORM.jobspy_id == job_orm.jobspy_id).first()
        )
        if existing_job:
            # If job exists, do nothing
            added_jobs.append(orm_to_job(existing_job))
            continue
        else:
            num_new_jobs += 1
            added_jobs.append(job)
            db_session.add(job_orm)
    db_session.commit()

    logging.critical(f"{num_new_jobs} new jobs added to the database!")
    return added_jobs


def add_new_application(db_session, new_app: Application):
    """Add a new application to the database."""
    db_session.add(app_to_orm(new_app))
    db_session.commit()
    logging.debug(f"New app {new_app.id} added to the database")


def add_new_job(db_session, new_job: Job):
    """Add a new job to the database."""
    db_session.add(job_to_orm(new_job))
    db_session.commit()
    logging.debug(f"New job {new_job.id} added to the database")
