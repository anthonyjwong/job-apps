from typing import Optional

from pydantic import BaseModel


class ApplicationResponse(BaseModel):
    id: str
    company: str
    position: str
    status: str
    applicationDate: str
    location: str
    jobType: str
    classification: str
    action: str
    notes: str


class GetSubmittedApplicationsResponse(BaseModel):
    applications: list[ApplicationResponse]
    total: int  # total items matching filters (unpaged)
    page: int
    page_size: int
    total_pages: int


class AssessmentResponse(BaseModel):
    id: str
    company: str
    position: str
    type: str
    description: str
    dueDate: str
    timeLimit: str
    status: str
    instructions: Optional[str]
    submissionUrl: Optional[str]
    notes: Optional[str]
    skills: Optional[list[str]]


class GetAssessmentsResponse(BaseModel):
    assessments: list[AssessmentResponse]
    total: int
    pending: int
    completed: int
    scheduled: int


class InterviewResponse(BaseModel):
    id: str
    company: str
    position: str
    type: str
    date: str
    time: str
    duration: int
    status: str
    interviewer: Optional[str]
    notes: Optional[str]
    location: Optional[str]
    preparationItems: Optional[list[str]]


class GetInterviewsResponse(BaseModel):
    interviews: list[InterviewResponse]
    total: int
    upcoming: int
    completed: int
