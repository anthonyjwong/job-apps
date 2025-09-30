from typing import Optional

from fastapi import Query
from pydantic import BaseModel


class ApplicationFormResponse(BaseModel):
    question: str
    answer: str


class GetApplicationFormResponse(BaseModel):
    form: list[ApplicationFormResponse]


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


class GetApplicationsResponse(BaseModel):
    applications: list[ApplicationResponse]
    total: int  # total items matching filters (unpaged)
    page: int
    page_size: int
    total_pages: int


class JobResponse(BaseModel):
    id: str
    title: str
    company: str
    location: Optional[str]
    classification: Optional[str]
    action: Optional[str]
    state: str
    jobType: Optional[str]
    datePosted: Optional[str]
    description: Optional[str]


class GetJobsResponse(BaseModel):
    jobs: list[JobResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class JobPatchRequest(BaseModel):
    state: Optional[str] = None
    classification: Optional[str] = None
    action: Optional[str] = None

    class Config:
        extra = "forbid"

    def is_empty(self) -> bool:
        return self.state is None and self.classification is None and self.action is None


class ApplicationPatchRequest(BaseModel):
    status: Optional[str] = None
    form_state: Optional[str] = None
    referred: Optional[bool] = None

    class Config:
        extra = "forbid"

    def is_empty(self) -> bool:
        return self.status is None and self.form_state is None and self.referred is None


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
