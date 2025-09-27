import logging
from uuid import UUID

from app.database.models import ApplicationFormORM, ApplicationORM, JobORM
from app.database.utils.crud import app_to_orm
from app.schemas.definitions import (
    Application,
    ApplicationFormState,
    ApplicationStatus,
    JobReview,
    JobState,
)
from sqlalchemy.orm import Session


def claim_job_for_review(db_session: Session, job_id: UUID) -> bool:
    """Atomically claim a job for review.

    Returns True if the claim succeeded (job transitioned to review_claim=True),
    False if the job is already reviewed or currently being reviewed.
    """
    updated = (
        db_session.query(JobORM)
        .filter(
            JobORM.id == job_id,
            JobORM.state == JobState.PENDING.value,
            JobORM.review_claim == False,
        )
        .update({JobORM.review_claim: True}, synchronize_session=False)
    )
    if updated:
        db_session.commit()
        return True
    return False


def set_job_reviewed(db_session: Session, job_id: UUID, review: JobReview):
    """Mark a job reviewed and clear review_claim flag."""
    (
        db_session.query(JobORM)
        .filter(JobORM.id == job_id)
        .update(
            {
                JobORM.state: JobState.REVIEWED.value,
                JobORM.review_claim: False,
                JobORM.classification: review.classification.value,
                JobORM.action: review.action,
            },
            synchronize_session=False,
        )
    )
    db_session.commit()
    logging.debug(f"Job {job_id} marked reviewed and claim cleared")


def clear_job_review_claim(db_session: Session, job_id: UUID):
    """Clear review_claim flag without marking reviewed."""
    (
        db_session.query(JobORM)
        .filter(JobORM.id == job_id)
        .update({JobORM.review_claim: False}, synchronize_session=False)
    )
    db_session.commit()
    logging.debug(f"Job {job_id} review claim cleared")


def claim_job_for_app_creation(db_session: Session, job_id: UUID) -> bool:
    """Atomically claim a job for application creation.

    Returns True if the claim succeeded (job transitioned to create_app_claim=True),
    False if an app for the job is already created or currently being created.
    """
    updated = (
        db_session.query(JobORM)
        .filter(
            JobORM.id == job_id,
            JobORM.state == JobState.APPROVED.value,
            JobORM.create_app_claim == False,
        )
        .update({JobORM.create_app_claim: True}, synchronize_session=False)
    )
    if updated:
        db_session.commit()
        return True
    return False


def set_job_app_created(db_session: Session, app: Application):
    """Atomically upsert the application and clear the job's create_app_claim.

    If an application already exists for the job, update it; otherwise insert a new one.
    Both the application write and clearing the job claim are committed together.
    """
    if not app.job.id:
        raise ValueError("Application is missing job")

    try:
        existing = (
            db_session.query(ApplicationORM).filter(ApplicationORM.job_id == app.job.id).first()
        )
        if existing is None:
            db_session.add(app_to_orm(app))
        else:
            for key, value in app.__dict__.items():
                if key == "id" or key == "prepare_claim" or key == "submission_claim":
                    continue
                elif key == "fields":
                    fields = [field.__dict__ for field in value]
                    setattr(existing, key, fields)
                else:
                    setattr(existing, key, value)

        (
            db_session.query(JobORM)
            .filter(JobORM.id == app.job.id)
            .update({JobORM.create_app_claim: False}, synchronize_session=False)
        )

        db_session.commit()
        logging.debug(f"Application upserted for job {app.job.id}; create_app_claim cleared")
    except Exception:
        db_session.rollback()
        raise


def clear_job_app_creation_claim(db_session: Session, job_id: UUID):
    """Clear create_app_claim flag without creating an application."""
    (
        db_session.query(JobORM)
        .filter(JobORM.id == job_id)
        .update({JobORM.create_app_claim: False}, synchronize_session=False)
    )
    db_session.commit()
    logging.debug(f"Job {job_id} app creation claim cleared")


def claim_job_for_expiration_check(db_session: Session, job_id: UUID) -> bool:
    """Atomically claim a job for expiration check.

    Returns True if the claim succeeded (job transitioned to expiration_check_claim=True),
    False if the job is already expired or currently being checked for expiration.
    """
    updated = (
        db_session.query(JobORM)
        .filter(
            JobORM.id == job_id,
            JobORM.state.in_(
                [
                    JobState.PENDING.value,
                    JobState.REVIEWED.value,
                    JobState.APPROVED.value,
                ]
            ),
            JobORM.expiration_check_claim == False,
        )
        .update({JobORM.expiration_check_claim: True}, synchronize_session=False)
    )
    if updated:
        db_session.commit()
        return True
    return False


def set_job_expired(db_session: Session, job_id: UUID):
    """Mark a job expired and clear expiration_check_claim flag."""
    (
        db_session.query(JobORM)
        .filter(JobORM.id == job_id)
        .update(
            {
                JobORM.state: JobState.EXPIRED.value,
                JobORM.expiration_check_claim: False,
            },
            synchronize_session=False,
        )
    )
    db_session.commit()
    logging.debug(f"Job {job_id} marked expired and claim cleared")


def clear_job_expiration_claim(db_session: Session, job_id: UUID):
    """Clear expiration_check_claim flag without marking expired."""
    (
        db_session.query(JobORM)
        .filter(JobORM.id == job_id)
        .update({JobORM.expiration_check_claim: False}, synchronize_session=False)
    )
    db_session.commit()
    logging.debug(f"Job {job_id} expiration check claim cleared")


def claim_app_for_prep(db_session: Session, app_id: UUID) -> bool:
    """Atomically claim an app for preparation.

    Returns True if the claim succeeded (app transitioned to prepare_claim=True),
    False if the app is already prepared or currently being prepared.
    """
    updated = (
        db_session.query(ApplicationORM)
        .filter(
            ApplicationFormORM.application_id == app_id,
            ApplicationFormState(ApplicationFormORM.state) == [ApplicationFormState.SCRAPED.value],
            ApplicationFormORM.prepare_claim == False,
        )
        .update({ApplicationFormORM.prepare_claim: True}, synchronize_session=False)
    )
    if updated:
        db_session.commit()
        return True
    return False


def set_app_prepared(db_session: Session, app_id: UUID):
    """Mark application READY and set form to PREPARED; clear prepare_claim atomically."""
    (
        db_session.query(ApplicationFormORM)
        .filter(ApplicationFormORM.application_id == app_id)
        .update(
            {
                ApplicationFormORM.state: ApplicationFormState.PREPARED.value,
                ApplicationFormORM.prepare_claim: False,
            },
            synchronize_session=False,
        )
    )
    db_session.commit()
    logging.debug(f"Application {app_id} form PREPARED and claim cleared")


def clear_app_preparation_claim(db_session: Session, app_id: UUID):
    """Clear form.prepare_claim flag without marking prepared."""
    (
        db_session.query(ApplicationFormORM)
        .filter(ApplicationFormORM.application_id == app_id)
        .update({ApplicationFormORM.prepare_claim: False}, synchronize_session=False)
    )
    db_session.commit()
    logging.debug(f"Application {app_id} preparation claim cleared")


def claim_app_for_submission(db_session: Session, app_id: UUID) -> bool:
    """Atomically claim a app for submission.

    Returns True if the claim succeeded (record transitioned to submission_claim=True),
    False if the app is already submitted or currently being submitted.
    """
    updated = (
        db_session.query(ApplicationORM)
        .filter(
            ApplicationORM.id == app_id,
            ApplicationORM.status == ApplicationStatus.READY.value,
            ApplicationORM.submission_claim == False,
        )
        .update({ApplicationORM.submission_claim: True}, synchronize_session=False)
    )
    if updated:
        db_session.commit()
        return True
    return False


def set_app_submitted(db_session: Session, app_id: UUID):
    """Mark a app submitted and clear submission_claim flag."""
    (
        db_session.query(ApplicationORM)
        .filter(ApplicationORM.id == app_id)
        .update(
            {
                ApplicationORM.status: ApplicationStatus.SUBMITTED.value,
                ApplicationORM.submission_claim: False,
            },
            synchronize_session=False,
        )
    )
    db_session.commit()


def clear_app_submission_claim(db_session: Session, app_id: UUID):
    """Clear submission_claim flag without marking submitted."""
    (
        db_session.query(ApplicationORM)
        .filter(ApplicationORM.id == app_id)
        .update({ApplicationORM.submission_claim: False}, synchronize_session=False)
    )
    db_session.commit()
