import json
import logging
import re
import time
from typing import Callable, Tuple, Type

from openai import OpenAI
from openai.types.responses import Response
from scrapers.scraper import JobSite
from scrapers.sites import Ashby, LinkedIn
from src.definitions import App, AppField, Job, Review, User
from src.utils import get_base_url

client = OpenAI(timeout=60)
DOMAIN_HANDLERS = {"jobs.ashbyhq.com": Ashby, "www.linkedin.com": LinkedIn}


def _with_retry(
    func: Callable,
    *args,
    retries: int = 5,
    base_delay: float = 1.0,
    retry_exceptions: Tuple[Type[BaseException], ...] = (Exception,),
    **kwargs,
):
    """Run func with retries and exponential backoff.

    Retries on network/server issues (e.g., 5xx). Backoff with jitter.
    """
    attempt = 0
    while True:
        try:
            return func(*args, **kwargs)
        except retry_exceptions as e:
            attempt += 1
            if attempt > retries:
                raise
            sleep_for = base_delay * (2 ** (attempt - 1)) * (1 + 0.1 * attempt)
            logging.warning(
                {
                    "method": "apply._with_retry",
                    "attempt": attempt,
                    "sleep": round(sleep_for, 2),
                    "error": str(e),
                }
            )
            time.sleep(sleep_for)


def evaluate_candidate_aptitude(job: Job, user: User) -> Job:
    """Review job and resume and determine fit for the role."""
    with open(".instructions/REVIEWER.md", "r") as f:
        instructions = f.read()

    # upload resume (retry on transient 5xx)
    with open(user.resume_pdf_path, "rb") as f:
        resume_pdf = _with_retry(
            client.files.create,
            file=f,
            purpose="user_data",
        )

    response = _with_retry(
        client.responses.create,
        model="gpt-5-nano",
        input=[
            {"role": "developer", "content": instructions},
            {"role": "user", "content": job.description},
            {"role": "assistant", "content": "Please provide the resume PDF."},
            {
                "role": "user",
                "content": [{"type": "input_file", "file_id": resume_pdf.id}],
            },
        ],
    )

    try:
        review_data = json.loads(response.output_text)
        job.review = Review(**review_data)
        job.reviewed = True
        if (
            job.review.classification == "safety"
            or job.review.classification == "target"
        ):
            job.approved = True
    except json.JSONDecodeError as e:
        logging.error(
            {
                "method": "src.apply.evaluate_candidate_aptitude",
                "type": "FailedToParseOutput",
                "response": response.output_text,
            }
        )
        raise e

    return job


async def scrape_job_app(job: Job) -> App:
    """Scrape job details and create an application."""
    if not job.direct_job_url and not job.linkedin_job_url:
        logging.error(f"Job {job.id} is missing URLs.")
        raise ValueError("Job must have a direct job URL or LinkedIn job URL.")

    base_url = get_base_url(job.direct_job_url)
    if base_url in DOMAIN_HANDLERS:
        job_site = DOMAIN_HANDLERS[base_url](job)
        app = await job_site.scrape_questions()
        app.scraped = True
        return app
    raise NotImplementedError(f"Site not supported: {job.direct_job_url}")


def create_common_questions_regular_expression(common_questions: dict[str]):
    pattern = r"("
    for i, key in enumerate(common_questions.keys()):
        if i + 1 < len(common_questions.keys()):
            pattern += f"{key}|"
        else:
            pattern += f"{key})"
    return pattern


def answer_question(
    field: AppField, job: Job, app: App, user: User, *, resume_file_id: str | None
) -> Response:
    # I want the AI to have a large source of data about the applicant. It should have more than just the resume,
    # but also use answers the applicant has already provided if possible.

    # Ensure we have a resume file id (upload once per prepare request)
    if not resume_file_id:
        with open(user.resume_pdf_path, "rb") as f:
            resume_pdf = _with_retry(
                client.files.create,
                file=f,
                purpose="user_data",
            )
            resume_file_id = resume_pdf.id

    if field.multiple_choice:
        with open(".instructions/MC_FILLER.md", "r") as f:
            instructions = f.read()

        response = _with_retry(
            client.responses.create,
            model="gpt-5-nano",
            input=[
                {"role": "developer", "content": instructions},
                {"role": "user", "content": user.to_prompt()},
                {
                    "role": "assistant",
                    "content": "Please provide the jobseeker's resume",
                },
                {
                    "role": "user",
                    "content": [{"type": "input_file", "file_id": resume_file_id}],
                },
                {
                    "role": "assistant",
                    "content": "Please provide the company name, the role name, and role description of the job the jobseeker is applying for.",
                },
                {"role": "user", "content": job.to_prompt()},
                {
                    "role": "assistant",
                    "content": "Please provide the application question and choices in a numbered list.",
                },
                {"role": "user", "content": field.to_prompt()},
            ],
        )
    else:
        with open(".instructions/TEXT_FILLER.md", "r") as f:
            instructions = f.read()

        response = _with_retry(
            client.responses.create,
            model="gpt-5-nano",
            input=[
                {"role": "developer", "content": instructions},
                {"role": "user", "content": user.to_prompt()},
                {
                    "role": "assistant",
                    "content": "Please provide the jobseeker's resume",
                },
                {
                    "role": "user",
                    "content": [{"type": "input_file", "file_id": resume_file_id}],
                },
                {
                    "role": "assistant",
                    "content": "Please provide the company name, the role name, and role description of the job the jobseeker is applying for.",
                },
                {"role": "user", "content": job.to_prompt()},
                {
                    "role": "assistant",
                    "content": "Please provide the application question.",
                },
                {"role": "user", "content": field.question},
            ],
        )

    return response


def prepare_job_app(job: Job, app: App, user: User) -> App:
    """Initially fill out application questions."""
    common_questions = user.get_common_questions()
    pattern = create_common_questions_regular_expression(common_questions)

    # Upload resume once for this request and reuse the file id
    with open(user.resume_pdf_path, "rb") as f:
        resume_pdf = _with_retry(client.files.create, file=f, purpose="user_data")
        resume_file_id = resume_pdf.id

    for field in app.fields:
        matches = re.findall(pattern, field.question, re.IGNORECASE)
        if matches:
            field.answer = common_questions[matches[0].lower()]
        else:
            response = answer_question(
                field, job, app, user, resume_file_id=resume_file_id
            )
            field.answer = response.output_text.strip()

    app.prepared = True
    return app


async def submit_app(app: App, job: Job) -> App:
    """Submit an application."""
    if not job.direct_job_url or not job.linkedin_job_url:
        raise ValueError("Job must have a direct job URL or LinkedIn job URL.")

    base_url = get_base_url(job.direct_job_url)
    if base_url in DOMAIN_HANDLERS:
        job_site: JobSite = DOMAIN_HANDLERS[base_url](job)
        if await job_site.apply(app):
            app.submitted = True
            return app
    raise NotImplementedError(f"Site not supported: {job.direct_job_url}")
