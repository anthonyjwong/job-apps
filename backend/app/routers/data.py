from app.database.models import ApplicationORM
from app.dependencies import get_db
from app.schemas.definitions import ApplicationStatus
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/applications/summary")
def get_data_summary(db: Session = Depends(get_db)):
    """Get a quick summary of the application data."""
    query = db.query(ApplicationORM).filter(
        ApplicationORM.status.not_in(
            [ApplicationStatus.STARTED.value, ApplicationStatus.READY.value]
        )
    )
    total = query.count()
    statuses = [s.value for s in ApplicationStatus if s >= ApplicationStatus.SUBMITTED]
    summary = {status: query.filter(ApplicationORM.status == status).count() for status in statuses}
    summary["total"] = total
    return summary


@router.get("/data/analytics")
def get_data_analytics():
    """Get analytics data."""
    return {"status": "success", "message": "Data analytics"}


@router.get("/data/exports/{kind}")
def get_data_exports(kind: str):
    """Get data exports."""
    return {"status": "success", "message": f"Data exports for {kind}"}
