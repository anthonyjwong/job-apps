import logging
import re

import pandas as pd
from app.core.llm import answer_question, upload_resume
from app.core.utils import clean_url, clean_val, get_base_url
from app.schemas.definitions import App, Job, User
from app.schemas.errors import MissingAppUrlError
from app.scrapers.scraper import JobSite
from app.scrapers.sites import Ashby, LinkedIn
from jobspy import scrape_jobs

DOMAIN_HANDLERS = {"jobs.ashbyhq.com": Ashby, "www.linkedin.com": LinkedIn}


def _create_common_questions_regular_expression(common_questions: dict[str]):
    pattern = r"("
    for i, key in enumerate(common_questions.keys()):
        if i + 1 < len(common_questions.keys()):
            pattern += f"{key}|"
        else:
            pattern += f"{key})"
    return pattern


def _preprocess_jobspy_listing(listing: dict) -> dict:
    """Preprocess listing data to match Job parameters."""
    # Create mapping from DataFrame columns to Job attributes
    mapped_data = {
        "jobspy_id": clean_val(listing.get("id")),
        "title": clean_val(listing.get("title")),
        "company": clean_val(listing.get("company")),
        "location": clean_val(listing.get("location")),
        "min_salary": clean_val(
            listing.get("min_amount")
        ),  # Map min_amount to min_salary
        "max_salary": clean_val(
            listing.get("max_amount")
        ),  # Map max_amount to max_salary
        "date_posted": clean_val(str(listing.get("date_posted"))),
        "job_type": clean_val(listing.get("job_type")),
        "linkedin_job_url": (
            clean_url(clean_val(listing.get("job_url")))
        ),  # Map job_url to linkedin_job_url
        "direct_job_url": (clean_url(clean_val(listing.get("job_url_direct")))),
        "description": clean_val(listing.get("description")),
    }

    return mapped_data


def get_domain_handler(url: str) -> JobSite:
    base_url = get_base_url(url)
    if base_url in DOMAIN_HANDLERS:
        return DOMAIN_HANDLERS[base_url]
    else:
        return None


def save_jobs(num_jobs=5) -> list[Job]:
    """Finds jobs and saves them to the database."""
    listings: pd.DataFrame = scrape_jobs(
        site_name=[
            "linkedin",
        ],
        search_term="software engineer",
        location="New York, NY",
        results_wanted=num_jobs,
        hours_old=24,
        country_indeed="USA",
        linkedin_fetch_description=True,
        # proxies=["208.195.175.46:65095", "208.195.175.45:65095", "localhost"],
    )

    # Convert listings to Job objects
    jobs = [
        Job(**_preprocess_jobspy_listing(row.to_dict()))
        for _, row in listings.iterrows()
    ]

    return jobs


def scrape_job_app(job: Job) -> App:
    """Scrape job details and create an application."""
    job_url = job.direct_job_url or job.linkedin_job_url
    if not job_url:
        logging.error(f"Job {job.id} is missing URLs.")
        raise ValueError("Job must have a direct job URL or LinkedIn job URL.")

    job_site: JobSite = get_domain_handler(job_url)(job)
    if job_site is None:
        raise NotImplementedError(f"Site not supported: {job_url}")

    return job_site.scrape_questions()


def prepare_job_app(job: Job, app: App, user: User) -> App:
    """Initially fill out application questions."""
    common_questions = user.get_common_questions()
    pattern = _create_common_questions_regular_expression(common_questions)

    # Upload resume once for this request and reuse the file id
    resume_file_id = upload_resume(user.resume_pdf_path)

    for field in app.fields:
        matches = re.findall(pattern, field.question, re.IGNORECASE)
        if matches:
            field.answer = common_questions[matches[0].lower()]
        else:
            response = answer_question(
                field, job, app, user, resume_file_id=resume_file_id
            )
            field.answer = response.output_text.strip()

    return app


def submit_app(app: App, job: Job) -> App:
    """Submit an application."""
    if not app.url:
        raise MissingAppUrlError("App must have a URL.")

    job_site: JobSite = get_domain_handler(app.url)(job)
    if job_site is None:
        raise NotImplementedError(f"Site not supported: {app.url}")

    if job_site.apply(app):
        app.submitted = True

    return app


def check_job_expiration(job) -> bool:
    return LinkedIn(job).check_for_expiration()


if __name__ == "__main__":
    save_jobs()
