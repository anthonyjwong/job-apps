import uuid
from datetime import datetime, timezone
from typing import List

from sqlalchemy import JSON, UUID, Boolean, DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.schemas.definitions import (
    ApplicationFormState,
    ApplicationStatus,
    JobClassification,
    JobState,
)


class JobORM(Base):
    __tablename__ = "jobs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    company: Mapped[str] = mapped_column(String, nullable=False)
    location: Mapped[str] = mapped_column(String, nullable=True)
    min_salary: Mapped[float] = mapped_column(Float, nullable=True)
    max_salary: Mapped[float] = mapped_column(Float, nullable=True)
    type: Mapped[str] = mapped_column(String, nullable=True)
    date_posted: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    description: Mapped[str] = mapped_column(String, nullable=True)
    linkedin_job_url: Mapped[str] = mapped_column(String, nullable=True)
    direct_job_url: Mapped[str] = mapped_column(String, nullable=True)
    state: Mapped[JobState] = mapped_column(String, default=JobState.PENDING.value)
    classification: Mapped[JobClassification] = mapped_column(String, nullable=True)
    action: Mapped[str] = mapped_column(String, nullable=True)
    jobspy_id: Mapped[str] = mapped_column(String, nullable=False)
    manually_created: Mapped[bool] = mapped_column(Boolean, default=False)

    # claims
    review_claim: Mapped[bool] = mapped_column(Boolean, default=False)
    create_app_claim: Mapped[bool] = mapped_column(Boolean, default=False)
    expiration_check_claim: Mapped[bool] = mapped_column(Boolean, default=False)

    # db timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now(timezone.utc),
        onupdate=datetime.now(timezone.utc),
    )

    # relationship
    applications: Mapped[List["ApplicationORM"]] = relationship(
        "ApplicationORM", back_populates="job"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "company": self.company,
            "location": self.location,
            "min_salary": self.min_salary,
            "max_salary": self.max_salary,
            "type": self.type,
            "date_posted": self.date_posted,
            "description": self.description,
            "linkedin_job_url": self.linkedin_job_url,
            "direct_job_url": self.direct_job_url,
            "state": self.state,
            "classification": self.classification,
            "action": self.action,
            "jobspy_id": self.jobspy_id,
            "manually_created": self.manually_created,
            "review_claim": self.review_claim,
            "create_app_claim": self.create_app_claim,
            "expiration_check_claim": self.expiration_check_claim,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


class ApplicationORM(Base):
    __tablename__ = "applications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=False
    )
    form_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("application_forms.id"), nullable=True
    )
    url: Mapped[str] = mapped_column(String, nullable=False)
    referred: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[ApplicationStatus] = mapped_column(
        String, default=ApplicationStatus.STARTED.value
    )
    submitted_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    # claims
    submission_claim: Mapped[bool] = mapped_column(Boolean, default=False)

    # db timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now(timezone.utc),
        onupdate=datetime.now(timezone.utc),
    )

    # relationship
    job: Mapped["JobORM"] = relationship("JobORM", back_populates="applications")
    form: Mapped["ApplicationFormORM"] = relationship(
        "ApplicationFormORM", back_populates="application"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "job_id": self.job_id,
            "url": self.url,
        }


class ApplicationFormORM(Base):
    __tablename__ = "application_forms"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    application_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("applications.id"), nullable=False
    )
    fields: Mapped[dict] = mapped_column(JSON, nullable=True)
    state: Mapped[ApplicationFormState] = mapped_column(
        String, default=ApplicationFormState.CREATED.value, nullable=False
    )

    # claims
    prepare_claim: Mapped[bool] = mapped_column(Boolean, default=False)

    # db timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now(timezone.utc),
        onupdate=datetime.now(timezone.utc),
    )

    # relationship
    application: Mapped["ApplicationORM"] = relationship(
        "ApplicationORM", back_populates="form"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "application_id": self.application_id,
            "fields": self.fields,
            "state": self.state,
            "prepare_claim": self.prepare_claim,
            "submission_claim": self.submission_claim,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


class ErrorORM(Base):
    __tablename__ = "errors"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    error: Mapped[str] = mapped_column(String, nullable=False)
    operation: Mapped[str] = mapped_column(String, nullable=False)
    error_time: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now(timezone.utc)
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now(timezone.utc)
    )
