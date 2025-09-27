import re

import pandas as pd
from app.core.llm import answer_question, upload_resume
from app.core.scrapers.scraper import JobSite
from app.core.scrapers.sites import LinkedIn
from app.core.utils import get_domain_handler, jobspy_to_job
from app.schemas.definitions import Application, ApplicationForm, Job, User
from app.schemas.errors import MissingAppUrlError
from jobspy import scrape_jobs


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

    # convert listings to Job objects
    jobs = [jobspy_to_job(row.to_dict()) for _, row in listings.iterrows()]

    return jobs


def scrape_application_form(app: Application) -> ApplicationForm:
    """Scrape job details and create an application."""
    job_site: JobSite = get_domain_handler(app.url)(app.job)
    if job_site is None:
        raise NotImplementedError(f"Site not supported: {app.url}")

    return job_site.scrape_questions()


def fill_out_application_form(app: Application, user: User) -> ApplicationForm:
    """Initially fill out application questions."""
    if app.form is None:
        raise ValueError("Application must have a form to fill out.")
    # upload resume once for this request and reuse the file id
    resume_file_id = upload_resume(user.resume_pdf_path)

    common_questions = user.get_common_questions()
    for field in app.form.fields:
        matches = re.findall(user.get_common_questions_regex(), field.question, re.IGNORECASE)
        if matches:
            field.answer = common_questions[matches[0].lower()]
        else:
            response = answer_question(field, app, user, resume_file_id=resume_file_id)
            field.answer = response.output_text.strip()

    return app


def submit_app(app: Application) -> bool:
    """Submit an application."""
    if not app.url:
        raise MissingAppUrlError("App must have a URL.")

    job_site: JobSite = get_domain_handler(app.url)(app.job)
    if job_site is None:
        raise NotImplementedError(f"Site not supported: {app.url}")

    return job_site.apply(app)


def check_job_expiration(job) -> bool:
    return LinkedIn(job).check_for_expiration()


if __name__ == "__main__":
    save_jobs()
