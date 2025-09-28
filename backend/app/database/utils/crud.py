from datetime import datetime

from app.database.models import ApplicationFormORM, ApplicationORM, JobORM
from app.schemas.definitions import (
    Application,
    ApplicationForm,
    ApplicationFormField,
    ApplicationFormState,
    ApplicationStatus,
    Job,
    JobReview,
    JobState,
)


def job_to_orm(job: Job) -> JobORM:
    """Convert Job dataclass to ORM model"""
    date_posted = None
    if job.date_posted is not None:
        raw = str(job.date_posted).strip()
        if raw:
            date_posted = datetime.strptime(raw, "%Y-%m-%d").date()

    return JobORM(
        id=job.id,
        title=job.title,
        company=job.company,
        location=job.location,
        min_salary=job.min_salary,
        max_salary=job.max_salary,
        type=job.type,
        date_posted=date_posted,
        description=job.description,
        linkedin_job_url=job.linkedin_job_url,
        direct_job_url=job.direct_job_url,
        state=job.state.value,
        classification=job.review.classification if job.review else None,
        action=job.review.action if job.review else None,
        jobspy_id=job.jobspy_id,
        manually_created=job.manually_created,
    )


def orm_to_job(db_job: JobORM) -> Job:
    """Convert ORM model to Job dataclass"""
    return Job(
        id=db_job.id,
        title=db_job.title,
        company=db_job.company,
        location=db_job.location,
        min_salary=db_job.min_salary,
        max_salary=db_job.max_salary,
        type=db_job.type,
        date_posted=(db_job.date_posted.strftime("%Y-%m-%d") if db_job.date_posted else None),
        description=db_job.description,
        linkedin_job_url=db_job.linkedin_job_url,
        direct_job_url=db_job.direct_job_url,
        state=JobState(db_job.state),
        review=(
            JobReview(classification=db_job.classification, action=db_job.action)
            if db_job.classification or db_job.action
            else None
        ),
        jobspy_id=db_job.jobspy_id,
        manually_created=db_job.manually_created,
    )


def app_to_orm(app: Application) -> ApplicationORM:
    """Convert App dataclass to ORM model"""
    return ApplicationORM(
        id=app.id,
        job_id=app.job.id,
        form_id=app.form.id if app.form else None,
        url=app.url,
        referred=app.referred,
        status=app.status.value,
    )


def orm_to_app(db_app: ApplicationORM) -> Application:
    """Convert ORM model to App dataclass"""
    return Application(
        id=db_app.id,
        job=orm_to_job(db_app.job) if db_app.job else None,
        form=orm_to_form(db_app.form) if db_app.form else None,
        url=db_app.url,
        referred=db_app.referred,
        status=ApplicationStatus(db_app.status),
        submitted_at=db_app.submitted_at,
    )


def form_to_orm(form: ApplicationForm) -> ApplicationFormORM:
    """Convert AppField dataclass to ORM model"""
    return ApplicationFormORM(
        id=form.id,
        application_id=form.application.id,
        fields=[field.__dict__ for field in form.fields],
        state=form.state.value,
    )


def orm_to_form(db_form: ApplicationFormORM) -> ApplicationForm:
    """Convert ORM model to AppField dataclass"""
    parsed_fields = []
    if db_form.fields:
        for field in db_form.fields:
            parsed_fields.append(ApplicationFormField(**dict(field)))

    return ApplicationForm(
        id=db_form.id,
        fields=parsed_fields,
        state=ApplicationFormState(db_form.state),
    )
