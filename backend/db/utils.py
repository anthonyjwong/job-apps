import logging

from db.crud import app_to_orm, job_to_orm, orm_to_app, orm_to_job
from db.models import ApplicationORM, JobORM
from src.definitions import App, AppFragment, Job


# get methods
def get_job_by_id(db_session, job_id) -> Job:
    """Fetch a job by its ID."""
    orm = db_session.query(JobORM).filter(JobORM.id == job_id).first()
    if orm is None:
        return None
    return orm_to_job(orm)


def get_unreviewed_jobs(db_session) -> list[Job]:
    """Fetch all unreviewed jobs."""
    jobs = db_session.query(JobORM).filter(JobORM.reviewed == False).all()
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
        .filter((ApplicationORM.scraped == True) & (ApplicationORM.prepared == False))
        .all()
    )
    return [orm_to_app(app) for app in apps]


def get_unapproved_applications(db_session) -> list[App]:
    """Fetch all unapproved applications."""
    apps = (
        db_session.query(ApplicationORM)
        .filter(
            (ApplicationORM.prepared == True)
            & (ApplicationORM.user_approved == False)
            & (ApplicationORM.discarded == False)
            & (ApplicationORM.submitted == False)
        )
        .all()
    )
    return [orm_to_app(app) for app in apps]


def get_user_approved_applications(db_session) -> list[App]:
    """Fetch all user-approved applications."""
    apps = (
        db_session.query(ApplicationORM)
        .filter(
            (ApplicationORM.user_approved == True) & (ApplicationORM.submitted == False)
        )
        .all()
    )
    return [orm_to_app(app) for app in apps]


def get_all_applications(db_session) -> list[App]:
    """Fetch all applications."""
    apps = db_session.query(ApplicationORM).all()
    return [orm_to_app(app) for app in apps]


# update methods
def update_job_by_id(db_session, job_id, updated_job: Job):
    """Update a job by its ID."""
    job_orm = db_session.query(JobORM).filter(JobORM.id == job_id).first()
    if job_orm:
        for key, value in updated_job.__dict__.items():
            if key == "id":
                continue
            elif key == "review" and value is not None:
                # Convert Review object to dict for JSON storage
                value = value.__dict__
            setattr(job_orm, key, value)
        db_session.commit()


def update_application_by_id(db_session, app_id, updated_app: App):
    """Update an application by its ID."""
    app = db_session.query(ApplicationORM).filter(ApplicationORM.id == app_id).first()
    if app:
        for key, value in updated_app.__dict__.items():
            if key == "id":
                continue
            elif key == "fields":
                fields = [field.__dict__ for field in value]
                setattr(app, key, fields)
            else:
                setattr(app, key, value)
        db_session.commit()


def update_application_by_id_with_fragment(db_session, app_id, fragment: AppFragment):
    """Update an application by its ID."""
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
    """Approve an application by its ID."""
    app = db_session.query(ApplicationORM).filter(ApplicationORM.id == app_id).first()
    if not app:
        raise ValueError(f"Application with id {app_id} not found.")
    app.user_approved = True
    db_session.commit()
    logging.debug(f"App {app_id} approved")


def discard_application_by_id(db_session, app_id):
    """Set the discarded field to True."""
    app = db_session.query(ApplicationORM).filter(ApplicationORM.id == app_id).first()
    if not app:
        raise ValueError(f"Application with id {app_id} not found.")
    app.discarded = True
    db_session.commit()
    logging.debug(f"App {app_id} discarded")


# add methods
def add_new_scraped_jobs(db_session, new_jobs: list[Job]) -> list[Job]:
    """Add newly scraped jobs to the database."""
    added_jobs = []
    num_new_jobs = 0
    for new_job in new_jobs:
        job = job_to_orm(new_job)

        # check if job already exists
        existing_job = (
            db_session.query(JobORM).filter(JobORM.jobspy_id == job.jobspy_id).first()
        )
        if existing_job:
            # If job exists, do nothing
            added_jobs.append(orm_to_job(existing_job))
            continue
        else:
            num_new_jobs += 1
            added_jobs.append(job)
            db_session.add(job)
    db_session.commit()

    logging.debug(f"{num_new_jobs} new jobs added to the database")
    return added_jobs


def add_new_application(db_session, new_app: App):
    """Add a new application to the database."""
    db_session.add(app_to_orm(new_app))
    db_session.commit()
    logging.debug(f"New app {new_app.id} added to the database")
