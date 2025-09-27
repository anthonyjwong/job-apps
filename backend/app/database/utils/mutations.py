import logging

from app.database.models import JobORM
from app.database.utils.crud import job_to_orm
from app.schemas.definitions import Job


def add_new_jobs_from_jobspy(db_session, new_jobs: list[Job]) -> list[Job]:
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
            # if job exists, do nothing
            continue
        else:
            num_new_jobs += 1
            added_jobs.append(job)
            db_session.add(job_orm)
    db_session.commit()

    logging.info(f"{num_new_jobs} new jobs added to the database!")
    return added_jobs
