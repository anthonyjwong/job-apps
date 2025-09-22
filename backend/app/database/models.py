import uuid
from datetime import datetime, timezone
from typing import List

from app.database.session import Base
from sqlalchemy import JSON, UUID, Boolean, DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship


class JobORM(Base):
    __tablename__ = "jobs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    jobspy_id: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    company: Mapped[str] = mapped_column(String, nullable=False)
    location: Mapped[str] = mapped_column(String, nullable=True)
    min_salary: Mapped[float] = mapped_column(Float, nullable=True)
    max_salary: Mapped[float] = mapped_column(Float, nullable=True)
    date_posted: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    job_type: Mapped[str] = mapped_column(String, nullable=True)
    linkedin_job_url: Mapped[str] = mapped_column(String, nullable=True)
    direct_job_url: Mapped[str] = mapped_column(String, nullable=True)
    description: Mapped[str] = mapped_column(String, nullable=True)
    review: Mapped[dict] = mapped_column(JSON, nullable=True)  # Store Review as JSON
    review_claim: Mapped[bool] = mapped_column(Boolean, default=False)
    reviewed: Mapped[bool] = mapped_column(Boolean, default=False)
    approved: Mapped[bool] = mapped_column(Boolean, default=False)
    discarded: Mapped[bool] = mapped_column(Boolean, default=False)
    create_app_claim: Mapped[bool] = mapped_column(Boolean, default=False)
    manual: Mapped[bool] = mapped_column(Boolean, default=False)
    expiration_check_claim: Mapped[bool] = mapped_column(Boolean, default=False)
    expired: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now(timezone.utc),
        onupdate=datetime.now(timezone.utc),
    )

    # Relationship
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
            "date_posted": self.date_posted,
            "job_type": self.job_type,
            "linkedin_job_url": self.linkedin_job_url,
            "direct_job_url": self.direct_job_url,
            "description": self.description,
            "review": self.review,
            "review_claim": self.review_claim,
            "reviewed": self.reviewed,
            "approved": self.approved,
            "discarded": self.discarded,
            "create_app_claim": self.create_app_claim,
            "manual": self.manual,
            "expiration_check_claim": self.expiration_check_claim,
            "expired": self.expired,
        }


class ApplicationORM(Base):
    __tablename__ = "applications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=False
    )
    url: Mapped[str] = mapped_column(String, nullable=False)
    fields: Mapped[dict] = mapped_column(JSON, nullable=True)  # Store AppFields as JSON
    prepare_claim: Mapped[bool] = mapped_column(Boolean, default=False)
    prepared: Mapped[bool] = mapped_column(Boolean, default=False)
    approved: Mapped[bool] = mapped_column(Boolean, default=False)
    discarded: Mapped[bool] = mapped_column(Boolean, default=False)
    referred: Mapped[bool] = mapped_column(Boolean, default=False)
    submission_claim: Mapped[bool] = mapped_column(Boolean, default=False)
    submitted: Mapped[bool] = mapped_column(Boolean, default=False)
    acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)
    assessment: Mapped[bool] = mapped_column(Boolean, default=False)
    interview: Mapped[bool] = mapped_column(Boolean, default=False)
    rejected: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now(timezone.utc),
        onupdate=datetime.now(timezone.utc),
    )

    # Relationship
    job: Mapped["JobORM"] = relationship("JobORM", back_populates="applications")

    def to_dict(self):
        return {
            "id": self.id,
            "job_id": self.job_id,
            "url": self.url,
            "fields": self.fields,
            "prepare_claim": self.prepare_claim,
            "prepared": self.prepared,
            "approved": self.approved,
            "discarded": self.discarded,
            "referred": self.referred,
            "submission_claim": self.submission_claim,
            "submitted": self.submitted,
            "acknowledged": self.acknowledged,
            "assessment": self.assessment,
            "interview": self.interview,
            "rejected": self.rejected,
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
