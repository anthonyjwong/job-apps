from uuid import UUID

from app.database.models import ApplicationFormORM, ApplicationORM, JobORM
from app.database.utils.crud import orm_to_app, orm_to_job
from app.schemas.api import GetApplicationsRequest
from app.schemas.definitions import Application, Job
from sqlalchemy import asc, desc, func
from sqlalchemy.orm import Session


def fetch_job_by_id(db: Session, job_id: UUID) -> Job | None:
    """Fetch a job by its ID."""
    job = db.query(JobORM).filter(Job.id == job_id).first()
    return orm_to_job(job) if job else None


def fetch_application_by_id(db: Session, app_id: UUID) -> Application | None:
    """Fetch an application by its ID."""
    app = db.query(ApplicationORM).filter(ApplicationORM.id == app_id).first()
    return orm_to_app(app) if app else None


def fetch_application_by_job_id(db: Session, job_id: UUID) -> Application | None:
    """Fetch an application by its associated job ID."""
    app = db.query(ApplicationORM).filter(ApplicationORM.job_id == job_id).first()
    return orm_to_app(app) if app else None
