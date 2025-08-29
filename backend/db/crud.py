import logging
from datetime import datetime

import pandas as pd
from sqlalchemy.orm import Session
from src.definitions import App, AppField, Job, Review

from .models import ApplicationORM, ErrorORM, JobORM


def job_to_orm(job: Job) -> JobORM:
    """Convert Job dataclass to ORM model"""
    date_posted = None
    if job.date_posted is not None:
        raw = str(job.date_posted).strip()
        logging.info(f"Date posted: {raw}, {job.date_posted}")
        if raw:
            date_posted = datetime.strptime(raw, "%Y-%m-%d").date()

    return JobORM(
        id=job.id,
        jobspy_id=job.jobspy_id,
        title=job.title,
        company=job.company,
        location=job.location,
        min_salary=job.min_salary,
        max_salary=job.max_salary,
        date_posted=date_posted,
        job_type=job.job_type,
        linkedin_job_url=job.linkedin_job_url,
        direct_job_url=job.direct_job_url,
        description=job.description,
        review=job.review.to_json() if job.review else None,
        reviewed=job.reviewed,
    )


def orm_to_job(db_job: JobORM) -> Job:
    """Convert ORM model to Job dataclass"""
    review = None
    if db_job.reviewed:
        if isinstance(db_job.review, dict):
            review = Review(**db_job.review)
        elif isinstance(db_job.review, Review):
            review = db_job.review
        else:
            # fallback: try to convert to dict if possible
            try:
                review = Review(**dict(db_job.review))
            except Exception:
                raise ValueError("Review missing while reviewed = true")

    return Job(
        id=db_job.id,
        jobspy_id=db_job.jobspy_id,
        title=db_job.title,
        company=db_job.company,
        location=db_job.location,
        min_salary=db_job.min_salary,
        max_salary=db_job.max_salary,
        date_posted=(
            db_job.date_posted.strftime("%Y-%m-%d") if db_job.date_posted else None
        ),
        job_type=db_job.job_type,
        linkedin_job_url=db_job.linkedin_job_url,
        direct_job_url=db_job.direct_job_url,
        description=db_job.description,
        review=review,
        reviewed=db_job.reviewed,
    )


def app_to_orm(app: App) -> ApplicationORM:
    """Convert App dataclass to ORM model"""
    return ApplicationORM(
        id=app.id,
        job_id=app.job_id,
        url=app.url,
        fields=[field.__dict__ for field in app.fields],
        prepared=app.prepared,
        user_approved=app.user_approved,
        discarded=app.discarded,
        submitted=app.submitted,
        acknowledged=app.acknowledged,
        rejected=app.rejected,
    )


def orm_to_app(db_app: ApplicationORM) -> App:
    """Convert ORM model to App dataclass"""
    parsed_fields = []
    if db_app.fields:
        for field in db_app.fields:
            parsed_fields.append(AppField(**dict(field)))

    return App(
        id=db_app.id,
        job_id=db_app.job_id,
        url=db_app.url,
        fields=parsed_fields,
        prepared=db_app.prepared,
        user_approved=db_app.user_approved,
        discarded=db_app.discarded,
        submitted=db_app.submitted,
        acknowledged=db_app.acknowledged,
        rejected=db_app.rejected,
    )


def read_database(db: Session, model_type: type) -> pd.DataFrame:
    """Read from database and convert to DataFrame"""
    if model_type == Job:
        results = db.query(JobORM).all()
        return pd.DataFrame([job.to_dict() for job in results])
    elif model_type == App:
        results = db.query(ApplicationORM).all()
        return pd.DataFrame([app.to_dict() for app in results])
    else:
        raise ValueError(f"Unsupported model type: {model_type}")


def write_database(db: Session, model_type: type, data: list, overwrite=False):
    """Write to database"""
    if model_type == Job:
        if overwrite:
            db.query(JobORM).delete()

        for item in data:
            if isinstance(item, Job):
                db_item = job_to_orm(item)
            else:
                db_item = JobORM(**item)
            db.add(db_item)

    elif model_type == App:
        if overwrite:
            db.query(ApplicationORM).delete()

        for item in data:
            if isinstance(item, App):
                db_item = app_to_orm(item)
            else:
                db_item = ApplicationORM(**item)
            db.add(db_item)

    else:
        raise ValueError(f"Unsupported model type: {model_type}")

    db.commit()


def write_error(db: Session, data: list):
    """Write errors to database"""
    for error in data:
        db_error = ErrorORM(
            error=error.get("error"),
            operation=error.get("operation"),
        )
        db.add(db_error)
    db.commit()


def get_ashby_jobs(db: Session) -> pd.DataFrame:
    """Get Ashby jobs from database"""
    results = (
        db.query(JobORM).filter(JobORM.direct_job_url.like("%jobs.ashbyhq.com%")).all()
    )
    return pd.DataFrame([job.to_dict() for job in results])
