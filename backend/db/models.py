import uuid
from datetime import datetime, timezone
from typing import List

from sqlalchemy import JSON, UUID, Boolean, Column, DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class JobORM(Base):
    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    jobspy_id = Column(String, nullable=False)
    title = Column(String, nullable=False)
    company = Column(String, nullable=False)
    location = Column(String, nullable=True)
    min_salary = Column(Float, nullable=True)
    max_salary = Column(Float, nullable=True)
    date_posted = Column(DateTime, nullable=True)
    job_type = Column(String, nullable=True)
    linkedin_job_url = Column(String, nullable=True)
    direct_job_url = Column(String, nullable=True)
    description = Column(String, nullable=True)
    review = Column(JSON, nullable=True)  # Store Review as JSON
    reviewed = Column(Boolean, default=False)
    approved = Column(Boolean, default=False)
    discarded = Column(Boolean, default=False)
    manual = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    updated_at = Column(
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
            "reviewed": self.reviewed,
            "approved": self.approved,
            "discarded": self.discarded,
            "manual": self.manual,
        }


class ApplicationORM(Base):
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=False)
    url = Column(String, nullable=False)
    fields = Column(JSON, nullable=True)  # Store AppFields as JSON
    scraped = Column(Boolean, default=False)
    prepared = Column(Boolean, default=False)
    approved = Column(Boolean, default=False)
    discarded = Column(Boolean, default=False)
    submitted = Column(Boolean, default=False)
    acknowledged = Column(Boolean, default=False)
    assessment = Column(Boolean, default=False)
    interview = Column(Boolean, default=False)
    rejected = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    updated_at = Column(
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
            "scraped": self.scraped,
            "prepared": self.prepared,
            "approved": self.approved,
            "discarded": self.discarded,
            "submitted": self.submitted,
            "acknowledged": self.acknowledged,
            "assessment": self.assessment,
            "interview": self.interview,
            "rejected": self.rejected,
        }


class ErrorORM(Base):
    __tablename__ = "errors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    error = Column(String, nullable=False)
    operation = Column(String, nullable=False)
    error_time = Column(DateTime, default=datetime.now(timezone.utc))
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
