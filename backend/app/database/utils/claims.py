import logging
from uuid import UUID

from app.database.crud import app_to_orm
from app.database.models import ApplicationORM, JobORM
from app.database.utils.queries import get_application_by_job_id
from app.schemas.definitions import Application, Job, JobReview, JobState


def claim_job_for_review(db_session, job_id: UUID) -> bool:
    """Atomically claim a job for review.

    Returns True if the claim succeeded (job transitioned to review_claim=True),
    False if the job is already reviewed or currently being reviewed.
    """
    updated = (
        db_session.query(JobORM)
        .filter(
            JobORM.id == job_id,
            JobState(JobORM.state) < JobState.REVIEWED,
            JobORM.review_claim == False,
        )
        .update({JobORM.review_claim: True}, synchronize_session=False)
    )
    if updated:
        db_session.commit()
        return True
    return False


def set_job_reviewed(db_session, job_id: UUID, review: JobReview):
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


def clear_job_review_claim(db_session, job_id: UUID):
    """Clear review_claim flag without marking reviewed."""
    (
        db_session.query(JobORM)
        .filter(JobORM.id == job_id)
        .update({JobORM.review_claim: False}, synchronize_session=False)
    )
    db_session.commit()
    logging.debug(f"Job {job_id} review claim cleared")


def claim_job_for_app_creation(db_session, job_id: UUID) -> bool:
    """Atomically claim a job for application creation.

    Returns True if the claim succeeded (job transitioned to create_app_claim=True),
    False if an app for the job is already created or currently being created.
    """
    updated = (
        db_session.query(JobORM)
        .filter(
            JobORM.id == job_id,
            JobORM.create_app_claim == False,
        )
        .update({JobORM.create_app_claim: True}, synchronize_session=False)
    )
    if updated:
        db_session.commit()
        return True
    return False


def set_job_app_created(db_session, app: Application):
    """Atomically upsert the application and clear the job's create_app_claim.

    If an application already exists for the job, update it; otherwise insert a new one.
    Both the application write and clearing the job claim are committed together.
    """
    if not app.job.id:
        raise ValueError("Application is missing job")

    try:
        existing = get_application_by_job_id(db_session, app.job.id)
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
        logging.debug(
            f"Application upserted for job {app.job.id}; create_app_claim cleared"
        )
    except Exception:
        db_session.rollback()
        raise


def clear_job_app_creation_claim(db_session, job_id: UUID):
    """Clear create_app_claim flag without creating an application."""
    (
        db_session.query(JobORM)
        .filter(JobORM.id == job_id)
        .update({JobORM.create_app_claim: False}, synchronize_session=False)
    )
    db_session.commit()
    logging.debug(f"Job {job_id} app creation claim cleared")


def claim_job_for_expiration_check(db_session, job_id: UUID) -> bool:
    """Atomically claim a job for expiration check.

    Returns True if the claim succeeded (job transitioned to expiration_check_claim=True),
    False if the job is already expired or currently being checked for expiration.
    """
    updated = (
        db_session.query(JobORM)
        .filter(
            JobORM.id == job_id,
            JobORM.expiration_check_claim == False,
        )
        .update({JobORM.expiration_check_claim: True}, synchronize_session=False)
    )
    if updated:
        db_session.commit()
        return True
    return False


def set_job_expired(db_session, job_id: UUID):
    """Mark a job expired and clear expiration_check_claim flag."""
    (
        db_session.query(JobORM)
        .filter(JobORM.id == job_id)
        .update(
            {JobORM.expired: True, JobORM.expiration_check_claim: False},
            synchronize_session=False,
        )
    )
    db_session.commit()
    logging.debug(f"Job {job_id} marked expired and claim cleared")


def clear_job_expiration_claim(db_session, job_id: UUID):
    """Clear expiration_check_claim flag without marking expired."""
    (
        db_session.query(JobORM)
        .filter(JobORM.id == job_id)
        .update({JobORM.expiration_check_claim: False}, synchronize_session=False)
    )
    db_session.commit()
    logging.debug(f"Job {job_id} expiration check claim cleared")


def claim_app_for_prep(db_session, app_id: UUID) -> bool:
    """Atomically claim an app for preparation.

    Returns True if the claim succeeded (app transitioned to prepare_claim=True),
    False if the app is already prepared or currently being prepared.
    """
    updated = (
        db_session.query(ApplicationORM)
        .filter(
            ApplicationORM.id == app_id,
            ApplicationORM.prepared == False,
            ApplicationORM.prepare_claim == False,
        )
        .update({ApplicationORM.prepare_claim: True}, synchronize_session=False)
    )
    if updated:
        db_session.commit()
        return True
    return False


def set_app_prepared(db_session, app_id: UUID, updated_app: Application):
    """Mark an application prepared and clear prepare_claim flag."""
    (
        db_session.query(ApplicationORM)
        .filter(ApplicationORM.id == app_id)
        .update(
            {
                ApplicationORM.prepared: True,
                ApplicationORM.prepare_claim: False,
                ApplicationORM.fields: updated_app.fields,
            },
            synchronize_session=False,
        )
    )
    db_session.commit()
    logging.debug(f"Application {app_id} marked prepared and claim cleared")


def clear_app_preparation_claim(db_session, app_id: UUID):
    """Clear prepare_claim flag without marking prepared."""
    (
        db_session.query(ApplicationORM)
        .filter(ApplicationORM.id == app_id)
        .update({ApplicationORM.prepare_claim: False}, synchronize_session=False)
    )
    db_session.commit()
    logging.debug(f"Application {app_id} preparation claim cleared")


def claim_app_for_submission(db_session, app_id: UUID) -> bool:
    """Atomically claim a app for submission.

    Returns True if the claim succeeded (record transitioned to submission_claim=True),
    False if the app is already submitted or currently being submitted.
    """
    updated = (
        db_session.query(ApplicationORM)
        .filter(
            ApplicationORM.id == app_id,
            ApplicationORM.submitted == False,
            ApplicationORM.submission_claim == False,
        )
        .update({ApplicationORM.submission_claim: True}, synchronize_session=False)
    )
    if updated:
        db_session.commit()
        return True
    return False


def set_app_submitted(db_session, app_id: UUID):
    """Mark a app submitted and clear submission_claim flag."""
    (
        db_session.query(ApplicationORM)
        .filter(ApplicationORM.id == app_id)
        .update(
            {ApplicationORM.submitted: True, ApplicationORM.submission_claim: False},
            synchronize_session=False,
        )
    )
    db_session.commit()


def clear_app_submission_claim(db_session, app_id: UUID):
    """Clear submission_claim flag without marking submitted."""
    (
        db_session.query(ApplicationORM)
        .filter(ApplicationORM.id == app_id)
        .update({ApplicationORM.submission_claim: False}, synchronize_session=False)
    )
    db_session.commit()
