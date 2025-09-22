import uuid
from dataclasses import field
from datetime import datetime
from enum import Enum
from typing import Literal, Optional
from uuid import UUID

from app.schemas.errors import QuestionNotFoundError
from pydantic import BaseModel
from pydantic import Field as PydanticField


# jobs
class JobClassification(Enum):
    SAFETY = "safety"
    TARGET = "target"
    REACH = "reach"
    DREAM = "dream"


class JobReview(BaseModel):
    action: str
    classification: JobClassification

    def to_json(self):
        return {
            "action": self.action,
            "classification": self.classification,
        }


class JobState(Enum):
    PENDING = "pending"
    APPROVED = "approved"
    DISCARDED = "discarded"
    REVIEWED = "reviewed"
    EXPIRED = "expired"


class Job(BaseModel):
    id: UUID = PydanticField(default_factory=uuid.uuid4)
    title: str
    company: str
    location: str
    min_salary: Optional[float]
    max_salary: Optional[float]
    job_type: Optional[str]
    date_posted: Optional[str]
    description: Optional[str]
    linkedin_job_url: Optional[str]
    direct_job_url: Optional[str]
    state: JobState = JobState.PENDING
    review: Optional[JobReview]
    jobspy_id: Optional[str]
    manually_added: bool = False

    def to_json(self):
        """Converts Job object to JSON serializable format."""
        return {
            "id": str(self.id),
            "title": self.title,
            "company": self.company,
            "location": self.location,
            "date_posted": self.date_posted,
            "description": self.description,
            "min_salary": self.min_salary,
            "max_salary": self.max_salary,
            "job_type": self.job_type,
            "linkedin_job_url": self.linkedin_job_url,
            "direct_job_url": self.direct_job_url,
            "state": self.state,
            "review": self.review,
            "jobspy_id": self.jobspy_id,
            "manually_added": self.manually_added,
        }

    def to_prompt(self):
        return f"{self.company}, {self.title}\n{self.description}"


# applications
class ApplicationStatus(Enum):
    STARTED = "started"
    SUBMITTED = "submitted"
    ACKNOWLEDGED = "acknowledged"
    ASSESSMENT = "assessment"
    INTERVIEW = "interview"
    REJECTED = "rejected"
    OFFER = "offer"
    ACCEPTED = "accepted"
    WITHDRAWN = "withdrawn"


class Application(BaseModel):
    id: UUID = PydanticField(default_factory=uuid.uuid4)
    job: Job
    url: str
    referred: bool = False
    status: ApplicationStatus = ApplicationStatus.STARTED
    submitted_at: Optional[datetime]

    def to_json(self):
        """Converts App object to JSON serializable format."""
        return {
            "id": str(self.id),
            "job_id": str(self.job.id),
            "url": self.url,
            "referred": self.referred,
            "status": self.status,
            "submitted_at": self.submitted_at,
        }


class ApplicationFormField(BaseModel):
    question: str
    multiple_choice: bool
    choices: Optional[list[str]]
    answer: Optional[str]

    def to_json(self):
        return {
            "question": self.question,
            "multiple_choice": self.multiple_choice,
            "choices": self.choices,
            "answer": self.answer,
        }

    def to_prompt(self):
        if self.multiple_choice:
            answer_string = ""
            for i, choice in enumerate(self.choices):
                answer_string += f"{i}. {choice}"
                if i < len(self.choices) - 1:
                    answer_string += "\n"
            return f"{self.question}\n{answer_string}"
        else:
            return self.question


class ApplicationFormState(Enum):
    CREATED = "created"
    SCRAPED = "scraped"
    PREPARED = "prepared"
    APPROVED = "approved"
    DISCARDED = "discarded"


class ApplicationForm(BaseModel):
    id: UUID
    application: Application
    fields: list[ApplicationFormField]
    state: ApplicationFormState = ApplicationFormState.CREATED

    def find_answer(self, question: str):
        for field in self.fields:
            if field.question == question:
                return field.answer

        raise QuestionNotFoundError(f"Question not found: {question}")

    def get_questions(self):
        """Returns the current list of questions."""
        return [f.question for f in self.fields]

    def log(self):
        """Log job applicatio form."""
        for f in self.fields:
            if f.multiple_choice:
                print(f.question)
                for c in f.choices:
                    print(f"- {c}")
                print()
            else:
                print(f"{f.question}\n{f.answer}\n")


# TODO: add EEOC questions
class User(BaseModel):
    id: UUID = PydanticField(default_factory=uuid.uuid4)
    first_name: str
    last_name: str
    email: str
    phone_number: Optional[str]
    resume_pdf_path: Optional[str]
    linkedin_url: Optional[str]
    github_url: Optional[str]
    current_location: Optional[str]
    desired_location: Optional[str]
    work_mode_ranking: list[str] = field(
        default_factory=lambda: ["hybrid", "onsite", "remote"]
    )

    def get_common_questions(self):
        return {
            "email": self.email,
            "first name": self.first_name,
            "github": self.github_url,
            "last_name": self.last_name,
            "linkedin": self.linkedin_url,
            "location": self.current_location,
            "located": self.current_location,
            "name": f"{self.first_name} {self.last_name}",
            "resume": self.resume_pdf_path,
            "twitter": None,
            "portfolio": self.github_url,
        }

    def log(self):
        """Log user."""
        print(f"{self.first_name} {self.last_name} | {self.email}")

    def to_json(self):
        """Converts User object to JSON serializable format."""
        return {
            "id": str(self.id),
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.email,
            "phone_number": self.phone_number,
            "resume_pdf_path": self.resume_pdf_path,
            "linkedin_url": self.linkedin_url,
            "github_url": self.github_url,
            "current_location": self.current_location,
            "desired_location": self.desired_location,
            "work_mode_ranking": self.work_mode_ranking,
        }

    def to_prompt(self):
        """Creates a clear prompt for an LLM with field descriptions."""
        prompt = """Personal Information:
- Full Name: {first_name} {last_name}
- Email: {email}
- Phone: {phone}
- Current Location: {current_location}
- Desired Location: {desired_location}

Professional Profiles:
- LinkedIn: {linkedin}
- GitHub: {github}

Work Preferences:
- Work Mode Priority (from most to least preferred): {work_modes}

Please use this information to help formulate appropriate responses about this job seeker's preferences and background."""

        return prompt.format(
            first_name=self.first_name,
            last_name=self.last_name,
            email=self.email or "",
            phone=self.phone_number or "",
            current_location=self.current_location or "",
            desired_location=self.desired_location or "",
            linkedin=self.linkedin_url or "",
            github=self.github_url or "",
            resume=self.resume_pdf_path or "",
            work_modes=", ".join(self.work_mode_ranking),
        )
