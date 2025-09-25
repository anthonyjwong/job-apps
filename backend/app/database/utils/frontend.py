from app.database.crud import orm_to_app
from app.database.models import ApplicationORM, ApplicationStatus
from app.schemas.definitions import Application
from sqlalchemy.orm import Session


def fetch_submitted_applications(db_session: Session) -> list[Application]:
    """Fetch all submitted applications."""
    apps = (
        db_session.query(ApplicationORM)
        .filter(ApplicationORM.status == ApplicationStatus.SUBMITTED.value)
        .all()
    )
    return [orm_to_app(app) for app in apps]


def fetch_assessment_applications(db_session: Session) -> list[Application]:
    """Fetch all applications where app.status = assessment"""
    apps = (
        db_session.query(ApplicationORM)
        .filter(ApplicationORM.status == ApplicationStatus.ASSESSMENT.value)
        .all()
    )
    return [orm_to_app(app) for app in apps]


def fetch_interview_applications(db_session: Session) -> list[Application]:
    """Fetch all applications where app.status = interview"""
    apps = (
        db_session.query(ApplicationORM)
        .filter(ApplicationORM.status == ApplicationStatus.INTERVIEW.value)
        .all()
    )
    return [orm_to_app(app) for app in apps]
