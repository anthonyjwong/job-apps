import asyncio
import logging
import os
import uuid
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright

from app.core.scrapers.scraper import JobSite, human_delay
from app.schemas.definitions import (
    Application,
    ApplicationForm,
    ApplicationFormField,
    ApplicationFormState,
    ApplicationStatus,
    Job,
    JobReview,
)

# Load .env from repo root (job-apps/.env) regardless of CWD
_REPO_ROOT = Path(__file__).resolve().parents[3]
_ENV_PATH = _REPO_ROOT / ".env"
if _ENV_PATH.exists():
    load_dotenv(_ENV_PATH)

LINKEDIN_CLIENT_ID = os.getenv("LINKEDIN_CLIENT_ID")
LINKEDIN_CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET")

# Where to store Playwright auth state (cookies, localStorage)
_STORAGE_DIR = Path(__file__).resolve().parent / "playwright_storage"
_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
_STORAGE_PATH = _STORAGE_DIR / "linkedin.json"


class LinkedInCheckpointError(Exception):
    """Raised when LinkedIn presents a checkpoint (e.g., CAPTCHA/verification)."""

    pass


class LinkedIn(JobSite):
    job: Job
    headless: bool = True

    def __init__(self, job: Job, headless: bool = True):
        self.job = job
        self.headless = headless

    def _write(self, element, text):
        for char in text:
            element.type(char)
            human_delay(0.05, 0.15)

    def _next_page(self, element):
        element.scroll_into_view_if_needed()
        element.click()
        human_delay(1, 2)

    def _find_questions(self, page, submit: bool = False) -> list[ApplicationFormField]:
        # resume
        # file_upload = question.locator("input[type='file']").first
        #     if file_upload.count():
        #         # linkedin autofills resume
        #         next_button.scroll_into_view_if_needed()
        #         next_button.click()
        #         human_delay(1, 2)
        fields = []

        question_elements = page.locator(".DklSpvuYKpZWRlAbeBtitReCzWRCFaZjmnnIMw")
        total = question_elements.count()
        for i in range(total):
            element = question_elements.nth(i)
            text_input = element.locator("input[type='text']").first
            if text_input.count():
                question = (element.locator("label").first.text_content()).strip()
                answer = (text_input.input_value()).strip()
                if not submit:
                    fields.append(
                        ApplicationFormField(
                            question=question,
                            multiple_choice=False,
                            choices=None,
                            answer=answer,
                        )
                    )
                print(f"Question: {question}\nAnswer: {answer}")

            dropdown = element.locator("select").first
            if dropdown.count():
                question = (element.locator("label").first.text_content()).strip()
                question = question[0 : len(question) // 2]
                options = dropdown.locator("option")
                if not submit:
                    fields.append(
                        ApplicationFormField(
                            question=question,
                            multiple_choice=True,
                            choices=[
                                (options.nth(i).text_content()).strip()
                                for i in range(options.count())
                            ],
                            answer=None,
                        )
                    )
                print(f"Question: {question}")
                print(
                    f"Options: {[(options.nth(i).text_content()).strip() for i in range(options.count())]}"
                )

            radio_options = element.locator("input[type='radio']")
            if radio_options.count():
                question = (element.locator("legend").first.text_content()).strip()
                option_labels = element.locator("label")
                option_inputs = element.locator("input[type='radio']")
                if not submit:
                    fields.append(
                        ApplicationFormField(
                            question=question,
                            multiple_choice=True,
                            choices=[
                                (option_labels.nth(i).text_content()).strip()
                                for i in range(option_labels.count())
                            ],
                            answer=None,
                        )
                    )
                print(f"Question: {question}")
                print(
                    f"Options: {[(option_labels.nth(i).text_content()).strip() for i in range(option_labels.count())]}"
                )

        return fields

    def _check_for_captcha(self, page):
        if "/checkpoint/challenge" in page.url:
            if self.headless:
                raise LinkedInCheckpointError(
                    "Checkpoint challenge in headless mode; cannot proceed."
                )
            else:
                logging.warning(
                    "LinkedIn triggered a checkpoint challenge (e.g., CAPTCHA or verification). Manual intervention required."
                )
                page.wait_for_selector("div.feed-container-theme")

    def _login(self, page):
        page.goto("https://www.linkedin.com/login")
        human_delay(3, 5)

        try:
            page.wait_for_selector("div.feed-container-theme", timeout=5000)
            # Already logged in
            return page
        except Exception:
            pass

        page.wait_for_selector("input[type='password']#password")
        username_input = page.locator("input[type='email']#username")
        if username_input.count():
            username_input.click()
            self._write(username_input, LINKEDIN_CLIENT_ID or "")
            human_delay(1, 2)

        password_input = page.locator("input[type='password']#password")
        password_input.click()
        self._write(password_input, LINKEDIN_CLIENT_SECRET or "")
        human_delay(1, 2)

        login_button = page.locator("button[aria-label='Sign in']")
        login_button.scroll_into_view_if_needed()
        login_button.click()

        self._check_for_captcha(page)

        # Wait for navigation after clicking the login button
        human_delay(3, 5)
        return page

    def scrape(self, app: Application = None, submit: bool = False) -> Application:
        if app is None:
            app = Application(
                job_id=self.job.id,
                url=self.job.linkedin_job_url,
                form=ApplicationForm(fields=[]),
            )
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=self.headless)
                # Use a browser context so we can persist and restore auth state
                context = browser.new_context(
                    storage_state=str(_STORAGE_PATH) if _STORAGE_PATH.exists() else None
                )
                context.set_default_timeout(60000)  # 60s
                page = context.new_page()

                # If no storage or not logged in, perform login once and save storage
                needs_login = not _STORAGE_PATH.exists()
                if not needs_login:
                    try:
                        page.goto("https://www.linkedin.com/feed/")
                        # If redirected to login, we still need to login
                        page.wait_for_load_state("domcontentloaded")

                        # Check if the "Remember me" checkbox is present
                        if page.locator("div#rememberme-div").count():
                            self.__next_page(
                                page.locator("button.member-profile__details").first
                            )

                            self._check_for_captcha(page)
                            context.storage_state(path=str(_STORAGE_PATH))

                        # Check if we need to reenter password
                        if page.locator("#password").count():
                            needs_login = True
                    except Exception:
                        needs_login = True

                if needs_login:
                    # Ensure creds exist
                    if not (LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET):
                        raise RuntimeError(
                            "Missing LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET env vars."
                        )
                    self._login(page)
                    # Save auth state for reuse
                    context.storage_state(path=str(_STORAGE_PATH))

                # Now go to the job URL
                print(f"Navigating to {app.url}")
                page.goto(app.url)
                page.wait_for_load_state("domcontentloaded")
                human_delay(3, 5)

                # Wait for any apply-related buttons
                page.wait_for_selector("button.jobs-apply-button", state="attached")
                apply_button = page.locator("button.jobs-apply-button").nth(1)
                apply_button.scroll_into_view_if_needed()
                apply_button.click()

                # Wait for the Easy Apply modal to become visible inside the modal outlet
                page.wait_for_selector(".jobs-easy-apply-modal__content")
                human_delay(1, 2)

                def detect_step():
                    """Detect which step the Easy Apply modal is currently on.

                    Returns a tuple of (step_name, locator) where step_name is one of
                    'next', 'review', 'submit', or None.
                    """
                    next_button = page.locator(
                        "button[aria-label='Continue to next step']"
                    )
                    if next_button.count():
                        return "next", next_button.first

                    review_button = page.locator(
                        "button[aria-label='Review your application']"
                    )
                    if review_button.count():
                        return "review", review_button.first

                    submit_button = page.locator(
                        "button[aria-label='Submit application']"
                    )
                    if submit_button.count():
                        return "submit", submit_button.first

                    return None, None

                MAX_STEPS = 10  # safety to avoid infinite loops
                for _ in range(MAX_STEPS):
                    step, button = detect_step()

                    if step == "next":
                        self._find_questions(app.form, page, submit=submit)
                        self._next_page(button)
                    elif step == "review":
                        self._find_questions(app.form, page, submit=submit)

                        if not submit:
                            # caller only wants questions; stop before submitting
                            browser.close()
                            app.form.state = ApplicationFormState.SCRAPED
                            return app

                        self._next_page(button)
                    elif step == "submit":
                        # optional checkbox shown on some flows
                        follow_company_checkbox = page.locator(
                            "input[type='checkbox']#follow-company-checkbox"
                        )
                        if follow_company_checkbox.count():
                            follow_company_checkbox.scroll_into_view_if_needed()
                            follow_company_checkbox.click()  # don't follow company
                            human_delay(0.2, 0.5)

                        if submit:  # dbl check
                            self._next_page(button)
                            app.status = ApplicationStatus.SUBMITTED

                        return app
                    elif step is None:
                        logging.error("Unexpected state: no navigation buttons found")
                        raise RuntimeError("No navigation buttons found")

                # If we exit the loop, we hit the safety cap
                raise RuntimeError("Exceeded maximum Easy Apply steps; aborting.")
        except LinkedInCheckpointError as e:
            logging.warning(
                f"Checkpoint encountered for {app.id}: {e}. Manual intervention may be required."
            )
            raise
        except Exception as e:
            logging.error(f"Error occurred app scraping/submitting for {app.id}: {e}")
            raise

    def scrape_questions(self) -> ApplicationForm:
        # return self.scrape(submit=False).form

        # don't actually scrape questions for now
        return ApplicationForm(
            fields=[],
        )

    def apply(self, app: Application) -> bool:
        # return self.scrape(app, submit=True)

        # automatically succeed for now
        return True

    def check_for_expiration(self) -> bool:
        html = requests.get(self.job.linkedin_job_url).text
        soup = BeautifulSoup(html, "html.parser")
        if soup.find(class_="closed-job__flavor--closed"):
            return True
        else:
            return False


if __name__ == "__main__":
    import asyncio

    job = Job(
        id=uuid.uuid4(),
        jobspy_id="li-4264253178",
        title="Software Engineer",
        company="Rokt",
        linkedin_job_url="https://www.linkedin.com/jobs/view/4288804260",
        review=JobReview(
            action="Add explicit TypeScript experience and a concrete Next.js project (with a link or portfolio) to your resume to demonstrate full-stack TS/Next.js capability.",
            classification="target",
        ),
        reviewed=True,
    )
    scraper = LinkedIn(job, headless=False)

    def main():
        app = scraper.scrape_questions()
        print("Done!")

    asyncio.run(main())
