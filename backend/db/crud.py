from datetime import datetime

from src.definitions import App, AppField, Job, Review

from .models import ApplicationORM, JobORM


def job_to_orm(job: Job) -> JobORM:
    """Convert Job dataclass to ORM model"""
    date_posted = None
    if job.date_posted is not None:
        raw = str(job.date_posted).strip()
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
        approved=job.approved,
        discarded=job.discarded,
        manual=job.manual,
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
        approved=db_job.approved,
        discarded=db_job.discarded,
        manual=db_job.manual,
    )


def app_to_orm(app: App) -> ApplicationORM:
    """Convert App dataclass to ORM model"""
    return ApplicationORM(
        id=app.id,
        job_id=app.job_id,
        url=app.url,
        fields=[field.__dict__ for field in app.fields],
        scraped=app.scraped,
        prepared=app.prepared,
        approved=app.approved,
        discarded=app.discarded,
        referred=app.referred,
        submitted=app.submitted,
        acknowledged=app.acknowledged,
        assessment=app.assessment,
        interview=app.interview,
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
        scraped=db_app.scraped,
        prepared=db_app.prepared,
        approved=db_app.approved,
        discarded=db_app.discarded,
        referred=db_app.referred,
        submitted=db_app.submitted,
        acknowledged=db_app.acknowledged,
        assessment=db_app.assessment,
        interview=db_app.interview,
        rejected=db_app.rejected,
    )
