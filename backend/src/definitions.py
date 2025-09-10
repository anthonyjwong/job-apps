import uuid
from dataclasses import field
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel
from pydantic import Field as PydanticField
from src.errors import QuestionNotFoundError


class Review(BaseModel):
    action: str = ""
    classification: Literal["safety", "target", "reach", "dream", None] = None

    def to_json(self):
        return {
            "action": self.action,
            "classification": self.classification,
        }


class Job(BaseModel):
    id: UUID = PydanticField(default_factory=uuid.uuid4)
    jobspy_id: str
    title: str
    company: str
    location: Optional[str] = None
    min_salary: Optional[float] = None
    max_salary: Optional[float] = None
    date_posted: Optional[str] = None
    job_type: Optional[str] = None
    linkedin_job_url: Optional[str] = None
    direct_job_url: Optional[str] = None
    description: Optional[str] = None
    review: Optional[Review] = None
    reviewed: bool = False
    approved: bool = False
    discarded: bool = False
    manual: bool = False

    def log(self):
        """Log job details."""
        print(f"{self.title} | {self.company} | {self.direct_job_url}")

    def to_json(self):
        """Converts Job object to JSON serializable format."""
        return {
            "id": str(self.id),
            "jobspy_id": self.jobspy_id,
            "title": self.title,
            "company": self.company,
            "location": self.location,
            "min_salary": self.min_salary,
            "max_salary": self.max_salary,
            "date_posted": self.date_posted,
            "job_type": self.job_type,
            "linkedin_job_url": self.linkedin_job_url,
            "direct_job_url": self.direct_job_url,
            "description": self.description,
            "review": self.review.to_json() if self.review else None,
            "reviewed": self.reviewed,
            "approved": self.approved,
            "discarded": self.discarded,
            "manual": self.manual,
        }

    def to_prompt(self):
        return f"{self.company}, {self.title}\n{self.description}"

    def to_csv(self):
        return f"{self.id},{self.jobspy_id},{self.title},{self.company},{self.location},{self.min_salary},{self.max_salary},{self.date_posted},{self.job_type},{self.linkedin_job_url},{self.direct_job_url}"


class AppField(BaseModel):
    question: str
    multiple_choice: bool
    choices: Optional[list[str]] = None
    answer: Optional[str] = None

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


# TODO: add EEOC questions
class User(BaseModel):
    id: UUID = PydanticField(default_factory=uuid.uuid4)
    first_name: str
    last_name: str
    email: str
    phone_number: Optional[str] = None
    resume_pdf_path: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    current_location: Optional[str] = None
    desired_location: Optional[str] = None
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


class App(BaseModel):
    id: UUID = PydanticField(default_factory=uuid.uuid4)
    job_id: UUID
    url: Optional[str] = None
    fields: list[AppField] = PydanticField(default_factory=list)
    scraped: bool = False
    prepared: bool = False
    approved: bool = False
    discarded: bool = False
    referred: bool = False
    submitted: bool = False
    acknowledged: bool = False
    assessment: bool = False
    interview: bool = False
    rejected: bool = False

    def find_answer(self, question: str):
        for field in self.fields:
            if field.question == question:
                return field.answer

        raise QuestionNotFoundError(f"Question not found: {question}")

    def get_questions(self):
        """Returns the current list of questions."""
        return [f.question for f in self.fields]

    def log(self):
        """Log job application."""
        for f in self.fields:
            if f.multiple_choice:
                print(f.question)
                for c in f.choices:
                    print(f"- {c}")
                print()
            else:
                print(f"{f.question}\n{f.answer}\n")

    def to_json(self):
        """Converts App object to JSON serializable format."""
        return {
            "id": str(self.id),
            "job_id": str(self.job_id),
            "url": self.url,
            "fields": [f.to_json() for f in self.fields],
            "scraped": self.scraped,
            "prepared": self.prepared,
            "approved": self.approved,
            "discarded": self.discarded,
            "referred": self.referred,
            "submitted": self.submitted,
            "acknowledged": self.acknowledged,
            "assessment": self.assessment,
            "interview": self.interview,
            "rejected": self.rejected,
        }


class AppFragment(BaseModel):
    id: UUID
    job_id: UUID
    url: Optional[str] = None
    fields: list[AppField] = PydanticField(default_factory=list)
