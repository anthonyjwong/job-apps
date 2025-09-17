import json
import logging

from core.utils import with_retry
from openai import OpenAI
from openai.types.responses import Response
from schemas.definitions import App, AppField, Job, Review, User

client = OpenAI(timeout=60)


def upload_resume(resume_pdf_path: str):
    # Upload resume once for this request and reuse the file id
    with open(resume_pdf_path, "rb") as f:
        resume_pdf = with_retry(client.files.create, file=f, purpose="user_data")
        return resume_pdf.id


def evaluate_candidate_aptitude(job: Job, user: User) -> Review:
    """Review job and resume and determine fit for the role."""
    with open(".instructions/REVIEWER.md", "r") as f:
        instructions = f.read()

    # upload resume (retry on transient 5xx)
    with open(user.resume_pdf_path, "rb") as f:
        resume_pdf = with_retry(
            client.files.create,
            file=f,
            purpose="user_data",
        )

    response = with_retry(
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
        return Review(**review_data)
    except json.JSONDecodeError as e:
        logging.error(
            {
                "method": "llm.apply.evaluate_candidate_aptitude",
                "type": "FailedToParseOutput",
                "response": response.output_text,
            }
        )
        raise e


def answer_question(
    field: AppField, job: Job, app: App, user: User, *, resume_file_id: str | None
) -> Response:
    # I want the AI to have a large source of data about the applicant. It should have more than just the resume,
    # but also use answers the applicant has already provided if possible.

    # Ensure we have a resume file id (upload once per prepare request)
    if not resume_file_id:
        with open(user.resume_pdf_path, "rb") as f:
            resume_pdf = with_retry(
                client.files.create,
                file=f,
                purpose="user_data",
            )
            resume_file_id = resume_pdf.id

    if field.multiple_choice:
        with open(".instructions/MC_FILLER.md", "r") as f:
            instructions = f.read()

        response = with_retry(
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

        response = with_retry(
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
