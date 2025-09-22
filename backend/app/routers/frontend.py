from app.db.database import get_db
from app.db.utils.frontend import (
    fetch_assessment_applications,
    fetch_interview_applications,
    fetch_submitted_applications,
)
from app.schemas.api import (
    ApplicationResponse,
    AssessmentResponse,
    GetAssessmentsResponse,
    GetInterviewsResponse,
    GetSubmittedApplicationsResponse,
    InterviewResponse,
)
from app.schemas.definitions import App
from fastapi import Depends, FastAPI
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

app = FastAPI(title="Job Apps Frontend API")


def get_application_state(app: App):
    pass


@app.get("/api/applications")
def get_submitted_applications(
    db: Session = Depends(get_db),
) -> GetSubmittedApplicationsResponse:
    """Get submitted applications."""
    apps = fetch_submitted_applications(db)

    app_responses = []
    for app in apps:
        app_responses.append(
            ApplicationResponse(
                id=str(app.id),
                company=app.job.company,
                position=app.job.title,
                status=app.status,
                applicationDate=app.submitted_at,  # TODO: convert to MM/DD/YYYY
                location=app.job.location,
                jobType=app.job.job_type,
                category=app.job.review.classification,
                action=app.job.review.action,
                notes="NOT IMPLEMENTED",
            )
        )

    return JSONResponse(
        status_code=200,
        content=GetSubmittedApplicationsResponse(
            applications=app_responses, total=len(app_responses)
        ),
    )


@app.get("/api/assessments")
def get_assessments(db: Session = Depends(get_db)) -> GetAssessmentsResponse:
    """Get applications where status = assessment."""
    apps = fetch_assessment_applications(db)

    assessment_responses = []
    for app in apps:
        assessment_responses.append(
            AssessmentResponse(
                id=str(app.id),
                company=app.job.company,
                position=app.job.title,
                type=app.job.job_type,
                description=app.job.description,
                dueDate="NOT IMPLEMENTED",
                timeLimit="NOT IMPLEMENTED",
                status=app.status,
                instructions="NOT IMPLEMENTED",
                submissionUrl=app.url,
                notes="",
                skills=["NOT IMPLEMENTED"],
            )
        )

    return JSONResponse(
        status_code=200,
        content=GetAssessmentsResponse(
            assessments=assessment_responses,
            total=len(assessment_responses),
            pending=0,
            completed=0,
            scheduled=0,
        ),
    )


@app.get("/api/interviews")
def get_interviews(db: Session = Depends(get_db)) -> GetInterviewsResponse:
    """Get applications where status = interview."""
    apps = fetch_interview_applications(db)

    interview_responses = []
    for app in apps:
        interview_responses.append(
            InterviewResponse(
                id=str(app.id),
                company=app.job.company,
                position=app.job.title,
                type=app.job.job_type,
                date="NOT IMPLEMENTED",
                time="NOT IMPLEMENTED",
                duration=60,
                status="NOT IMPLEMENTED",
                interviewer="NOT IMPLEMENTED",
                notes="NOT IMPLEMENTED",
                location="NOT IMPLEMENTED",
                preparationItems=["NOT IMPLEMENTED"],
            )
        )

    return JSONResponse(
        status_code=200,
        content=GetInterviewsResponse(
            interviews=interview_responses,
            total=len(interview_responses),
            upcoming=0,
            completed=0,
        ),
    )
