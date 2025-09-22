from app.db.crud import orm_to_app
from app.db.models import ApplicationORM, ApplicationStatusEnum
from app.schemas.definitions import Application


def fetch_submitted_applications(db_session) -> list[Application]:
    """Fetch all submitted applications."""
    apps = (
        db_session.query(ApplicationORM)
        .filter(ApplicationORM.status == ApplicationStatusEnum.SUBMITTED)
        .all()
    )
    return [orm_to_app(app) for app in apps]


def fetch_assessment_applications(db_session) -> list[Application]:
    """Fetch all applications where app.status = assessment"""
    apps = (
        db_session.query(ApplicationORM)
        .filter(ApplicationORM.status == ApplicationStatusEnum.ASSESSMENT)
        .all()
    )
    return [orm_to_app(app) for app in apps]


def fetch_interview_applications(db_session) -> list[Application]:
    """Fetch all applications where app.status = interview"""
    apps = (
        db_session.query(ApplicationORM)
        .filter(ApplicationORM.status == ApplicationStatusEnum.INTERVIEW)
        .all()
    )
    return [orm_to_app(app) for app in apps]
