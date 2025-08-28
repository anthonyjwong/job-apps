import json
import logging
import re

from openai import OpenAI
from openai.types.responses import Response
from scrapers.sites import Ashby
from src.definitions import App, AppField, Job, Review, User
from src.utils import get_base_url

client = OpenAI()
DOMAIN_HANDLERS = {"jobs.ashbyhq.com": Ashby}


def evaluate_candidate_aptitude(job: Job, user: User) -> Job:
    """Review job and resume and determine fit for the role."""
    with open(".instructions/REVIEWER.md", "r") as f:
        instructions = f.read()

    # upload resume
    resume_pdf = client.files.create(
        file=open(user.resume_pdf_path, "rb"),
        purpose="user_data",
    )

    response = client.responses.create(
        model="gpt-5-nano",
        input=[
            {"role": "developer", "content": instructions},
            {"role": "user", "content": job.description},
            {"role": "assistant", "content": "Please provide the resume PDF."},
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_file",
                        "file_id": resume_pdf.id,
                    }
                ],
            },
        ],
    )

    try:
        review_data = json.loads(response.output_text)
        job.review = Review(**review_data)
        job.reviewed = True
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


def scrape_job_app(job: Job) -> App:
    """Scrape job details and create an application."""
    if not job.direct_job_url and not job.linkedin_job_url:
        logging.warning(f"Job {job.id} is missing URLs.")
        raise ValueError("Job must have a direct job URL or LinkedIn job URL.")

    base_url = get_base_url(job.direct_job_url)
    if base_url in DOMAIN_HANDLERS:
        return DOMAIN_HANDLERS[base_url].scrape_questions(job)

    logging.warning(f"Site not supported: {get_base_url(job.direct_job_url)}")
    raise NotImplementedError(f"Site not supported: {job.direct_job_url}")


def create_common_questions_regular_expression(common_questions: dict[str]):
    pattern = r"("
    for i, key in enumerate(common_questions.keys()):
        if i + 1 < len(common_questions.keys()):
            pattern += f"{key}|"
        else:
            pattern += f"{key})"
    return pattern


def answer_question(field: AppField, job: Job, app: App, user: User) -> Response:
    # I want the AI to have a large source of data about the applicant. It should have more than just the resume,
    # but also use answers the applicant has already provided if possible.

    # upload resume
    resume_pdf = client.files.create(
        file=open(user.resume_pdf_path, "rb"),
        purpose="user_data",
    )

    if field.multiple_choice:
        with open(".instructions/MC_FILLER.md", "r") as f:
            instructions = f.read()

        response = client.responses.create(
            model="gpt-5-nano",
            input=[
                {"role": "developer", "content": instructions},
                {
                    "role": "user",
                    "content": user.to_prompt(),
                },
                {
                    "role": "assistant",
                    "content": "Please provide the jobseeker's resume",
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_file",
                            "file_id": resume_pdf.id,
                        }
                    ],
                },
                {
                    "role": "assistant",
                    "content": "Please provide the company name, the role name, and role description of the job the jobseeker is applying for.",
                },
                {
                    "role": "user",
                    "content": job.to_prompt(),
                },
                {
                    "role": "assistant",
                    "content": "Please provide the application question and choices in a numbered list.",
                },
                {
                    "role": "user",
                    "content": field.to_prompt(),
                },
            ],
        )
    else:
        with open(".instructions/TEXT_FILLER.md", "r") as f:
            instructions = f.read()

        response = client.responses.create(
            model="gpt-5-nano",
            input=[
                {"role": "developer", "content": instructions},
                {
                    "role": "user",
                    "content": user.to_prompt(),
                },
                {
                    "role": "assistant",
                    "content": "Please provide the jobseeker's resume",
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_file",
                            "file_id": resume_pdf.id,
                        }
                    ],
                },
                {
                    "role": "assistant",
                    "content": "Please provide the company name, the role name, and role description of the job the jobseeker is applying for.",
                },
                {
                    "role": "user",
                    "content": job.to_prompt(),
                },
                {
                    "role": "assistant",
                    "content": "Please provide the application question.",
                },
                {
                    "role": "user",
                    "content": field.question,
                },
            ],
        )

    return response


def prepare_job_app(job: Job, app: App, user: User) -> App:
    """Initially fill out application questions."""
    common_questions = user.get_common_questions()
    pattern = create_common_questions_regular_expression(common_questions)

    for field in app.fields:
        matches = re.findall(pattern, field.question, re.IGNORECASE)
        if matches:
            field.answer = common_questions[matches[0].lower()]
        else:
            response = answer_question(field, job, app, user)
            field.answer = response.output_text

    app.prepared = True
    return app


def submit_app(app: App, job: Job) -> bool:
    """Submit an application."""
    if not job.direct_job_url or not job.linkedin_job_url:
        raise ValueError("Job must have a direct job URL or LinkedIn job URL.")

    base_url = get_base_url(job.direct_job_url)
    if base_url in DOMAIN_HANDLERS:
        if DOMAIN_HANDLERS[base_url].apply(app, job):
            app.user_approved = True
            app.submitted = True
        return app
    raise NotImplementedError(f"Site not supported: {job.direct_job_url}")
