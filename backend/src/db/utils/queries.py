import logging
from datetime import timezone
from uuid import UUID

from db.crud import app_to_orm, job_to_orm, orm_to_app, orm_to_job
from db.models import ApplicationORM, JobORM
from schemas.definitions import App, AppFragment, Job


def get_job_by_id(db_session, job_id) -> Job:
    """Fetch a job by its ID."""
    orm = db_session.query(JobORM).filter(JobORM.id == job_id).first()
    if orm is None:
        return None
    return orm_to_job(orm)


def get_unapproved_jobs(db_session) -> list[Job]:
    """Fetch all unapproved jobs."""
    jobs = (
        db_session.query(JobORM)
        .filter(
            (JobORM.approved == False)
            & (JobORM.discarded == False)
            & (JobORM.expired == False)
        )
        .order_by(JobORM.created_at.desc())
        .all()
    )
    return [orm_to_job(job) for job in jobs]


def get_unreviewed_jobs(db_session) -> list[Job]:
    """Fetch all unreviewed jobs."""
    jobs = (
        db_session.query(JobORM)
        .filter(
            (JobORM.reviewed == False)
            & (JobORM.manual == False)
            & (JobORM.review_claim == False)
        )
        .all()
    )
    return [orm_to_job(job) for job in jobs]


def get_reviewed_jobs(db_session) -> list[Job]:
    """Fetch all reviewed jobs that do not have an associated application."""
    # Get job_ids that have an associated application
    app_job_ids = db_session.query(ApplicationORM.job_id).distinct()
    jobs = (
        db_session.query(JobORM)
        .filter(
            (JobORM.reviewed == True)
            & (~JobORM.id.in_(app_job_ids))
            & (JobORM.create_app_claim == False)
        )
        .all()
    )
    return [orm_to_job(job) for job in jobs]


def get_unexpired_jobs_older_than_one_week(db_session) -> list[Job]:
    """Fetch all jobs older than one week that are unexpired."""
    from datetime import datetime, timedelta

    one_week_ago = datetime.now(timezone.utc) - timedelta(weeks=1)
    jobs = (
        db_session.query(JobORM)
        .filter(
            (JobORM.created_at < one_week_ago)
            & (JobORM.expired == False)
            & (JobORM.expiration_check_claim == False)
        )
        .all()
    )
    return [orm_to_job(job) for job in jobs]


def get_all_jobs(db_session) -> list[Job]:
    jobs = db_session.query(JobORM).all()
    return [orm_to_job(job) for job in jobs]


def get_application_by_id(db_session, application_id) -> App:
    """Fetch an application by its ID."""
    app = (
        db_session.query(ApplicationORM)
        .filter(ApplicationORM.id == application_id)
        .first()
    )
    if app is None:
        return None
    return orm_to_app(app)


def get_application_by_job_id(db_session, job_id) -> App:
    """Fetch an application by its job ID."""
    app = (
        db_session.query(ApplicationORM).filter(ApplicationORM.job_id == job_id).first()
    )
    if app is None:
        return None
    return orm_to_app(app)


def get_unscraped_applications(db_session) -> list[App]:
    """Fetch all unscraped applications."""
    apps = (
        db_session.query(ApplicationORM).filter(ApplicationORM.scraped == False).all()
    )
    return [orm_to_app(app) for app in apps]


def get_unprepared_applications(db_session) -> list[App]:
    """Fetch all unprepared apps."""
    apps = (
        db_session.query(ApplicationORM)
        .filter(
            (ApplicationORM.prepared == False) & (ApplicationORM.prepare_claim == False)
        )
        .all()
    )
    return [orm_to_app(app) for app in apps]


def get_unapproved_applications(db_session) -> list[App]:
    """Fetch all unapproved applications."""
    apps = (
        db_session.query(ApplicationORM)
        .filter(
            (ApplicationORM.prepared == True)
            & (ApplicationORM.approved == False)
            & (ApplicationORM.discarded == False)
            & (ApplicationORM.submitted == False)
        )
        .all()
    )
    return [orm_to_app(app) for app in apps]


def get_approved_applications(db_session) -> list[App]:
    """Fetch all user-approved applications."""
    apps = (
        db_session.query(ApplicationORM)
        .filter(
            (ApplicationORM.approved == True)
            & (ApplicationORM.submitted == False)
            & (ApplicationORM.submission_claim == False)
        )
        .all()
    )
    return [orm_to_app(app) for app in apps]


def get_submitted_applications(db_session) -> list[App]:
    """Fetch all submitted applications."""
    apps = (
        db_session.query(ApplicationORM).filter(ApplicationORM.submitted == True).all()
    )
    return [orm_to_app(app) for app in apps]


def get_all_applications(db_session) -> list[App]:
    """Fetch all applications."""
    apps = db_session.query(ApplicationORM).all()
    return [orm_to_app(app) for app in apps]
