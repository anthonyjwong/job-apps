import logging
import os
import uuid
from pathlib import Path

from dotenv import load_dotenv
from playwright.async_api import async_playwright
from scrapers.scraper import EMULATE_HUMAN, JobSite, human_delay
from src.definitions import App, AppField, Job, Review

# Load .env from repo root (job-apps/.env) regardless of CWD
_REPO_ROOT = Path(__file__).resolve().parents[3]
_ENV_PATH = _REPO_ROOT / ".env"
if _ENV_PATH.exists():
    load_dotenv(_ENV_PATH)

LINKEDIN_CLIENT_ID = os.getenv("LINKEDIN_CLIENT_ID")
LINKEDIN_CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET")

# Where to store Playwright auth state (cookies, localStorage)
_STORAGE_DIR = Path(__file__).resolve().parents[1].parent / ".db" / "playwright_storage"
_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
_STORAGE_PATH = _STORAGE_DIR / "linkedin.json"


class LinkedIn(JobSite):
    job: Job

    def __init__(self, job):
        self.job = job

    async def write(self, element, text):
        for char in text:
            await element.type(char)
            await human_delay(0.05, 0.15)

    async def login(self, page):
        await page.goto("https://www.linkedin.com/login")
        await human_delay(3, 5)

        username_input = page.locator("input[type='email']#username")
        password_input = page.locator("input[type='password']#password")
        await username_input.click()
        await self.write(username_input, LINKEDIN_CLIENT_ID or "")
        await human_delay(1, 2)
        await password_input.click()
        await self.write(password_input, LINKEDIN_CLIENT_SECRET or "")
        await human_delay(1, 2)

        login_button = page.locator("button[aria-label='Sign in']")
        await login_button.scroll_into_view_if_needed()
        await login_button.click()

        # Wait for navigation after clicking the login button
        await human_delay(3, 5)
        return page

    async def next_page(self, element):
        await element.scroll_into_view_if_needed()
        await element.click()
        await human_delay(1, 2)

    async def find_questions(self, app: App, page, submit: bool = False):
        # resume
        # file_upload = question.locator("input[type='file']").first
        #     if await file_upload.count() > 0:
        #         # linkedin autofills resume
        #         await next_button.scroll_into_view_if_needed()
        #         await next_button.click()
        #         await human_delay(1, 2)
        if app is None:
            raise ValueError("App cannot be None")

        question_elements = page.locator(".DklSpvuYKpZWRlAbeBtitReCzWRCFaZjmnnIMw")
        total = await question_elements.count()
        for i in range(total):
            element = question_elements.nth(i)
            text_input = element.locator("input[type='text']").first
            if await text_input.count() > 0:
                question = (await element.locator("label").first.text_content()).strip()
                answer = (await text_input.input_value()).strip()
                if not submit:
                    app.fields.append(
                        AppField(
                            question=question,
                            multiple_choice=False,
                            choices=None,
                            answer=answer,
                        )
                    )
                print(f"Question: {question}\nAnswer: {answer}")

            dropdown = element.locator("select").first
            if await dropdown.count() > 0:
                question = (await element.locator("label").first.text_content()).strip()
                question = question[0 : len(question) // 2]
                options = dropdown.locator("option")
                if not submit:
                    app.fields.append(
                        AppField(
                            question=question,
                            multiple_choice=True,
                            choices=[
                                (await options.nth(i).text_content()).strip()
                                for i in range(await options.count())
                            ],
                            answer=None,
                        )
                    )
                print(f"Question: {question}")
                print(
                    f"Options: {[(await options.nth(i).text_content()).strip() for i in range(await options.count())]}"
                )

            radio_options = element.locator("input[type='radio']")
            if await radio_options.count() > 0:
                question = (
                    await element.locator("legend").first.text_content()
                ).strip()
                option_labels = element.locator("label")
                option_inputs = element.locator("input[type='radio']")
                if not submit:
                    app.fields.append(
                        AppField(
                            question=question,
                            multiple_choice=True,
                            choices=[
                                (await option_labels.nth(i).text_content()).strip()
                                for i in range(await option_labels.count())
                            ],
                            answer=None,
                        )
                    )
                print(f"Question: {question}")
                print(
                    f"Options: {[(await option_labels.nth(i).text_content()).strip() for i in range(await option_labels.count())]}"
                )

    async def scrape(
        self, app: App = None, submit: bool = False, headless: bool = True
    ) -> App:
        if app is None:
            app = App(
                job_id=self.job.id,
                url=self.job.linkedin_job_url,
            )
        try:
            async with async_playwright() as p:
                browser = await p.firefox.launch(headless=headless)
                # Use a browser context so we can persist and restore auth state
                context = await browser.new_context(
                    storage_state=str(_STORAGE_PATH) if _STORAGE_PATH.exists() else None
                )
                page = await context.new_page()

                # If no storage or not logged in, perform login once and save storage
                needs_login = not _STORAGE_PATH.exists()
                if not needs_login:
                    try:
                        await page.goto("https://www.linkedin.com/feed/")
                        # If redirected to login, we still need to login
                        await page.wait_for_load_state("domcontentloaded")

                        if await page.locator("div#rememberme-div").count():
                            await self.next_page(
                                page.locator("button.member-profile__details").first
                            )
                        if await page.locator("#username").count():
                            needs_login = True
                    except Exception:
                        needs_login = True

                if needs_login:
                    # Ensure creds exist
                    if not (LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET):
                        raise RuntimeError(
                            "Missing LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET env vars."
                        )
                    await self.login(page)
                    # Save auth state for reuse
                    await context.storage_state(path=str(_STORAGE_PATH))

                # Now go to the job URL
                print(f"Navigating to {app.url}")
                await page.goto(app.url, timeout=10000)
                await human_delay(3, 5)

                # Wait for the "Easy Apply" button to appear
                apply_buttons = page.locator("button#jobs-apply-button-id")
                if await apply_buttons.count() != 2:
                    raise RuntimeError("Unusual number of apply buttons found")
                apply_button = apply_buttons.nth(1)
                await apply_button.click()
                await human_delay(3, 5)

                # Wait for the Easy Apply modal to become visible inside the modal outlet
                await page.wait_for_selector(".jobs-easy-apply-modal__content")
                await human_delay(1, 2)

                async def detect_step():
                    """Detect which step the Easy Apply modal is currently on.

                    Returns a tuple of (step_name, locator) where step_name is one of
                    'next', 'review', 'submit', or None.
                    """
                    next_button = page.locator(
                        "button[aria-label='Continue to next step']"
                    )
                    if await next_button.count() > 0:
                        return "next", next_button.first

                    review_button = page.locator(
                        "button[aria-label='Review your application']"
                    )
                    if await review_button.count() > 0:
                        return "review", review_button.first

                    submit_button = page.locator(
                        "button[aria-label='Submit application']"
                    )
                    if await submit_button.count() > 0:
                        return "submit", submit_button.first

                    return None, None

                MAX_STEPS = 10  # safety to avoid infinite loops
                for _ in range(MAX_STEPS):
                    step, button = await detect_step()

                    if step == "next":
                        await self.find_questions(app, page, submit=submit)
                        await self.next_page(button)
                        continue
                    elif step == "review":
                        await self.find_questions(app, page, submit=submit)
                        if not submit:
                            # caller only wants questions; stop before submitting
                            await browser.close()
                            return app
                        await self.next_page(button)
                        continue
                    elif step == "submit":
                        # Optional checkbox shown on some flows
                        follow_company_checkbox = page.locator(
                            "input[type='checkbox']#follow-company-checkbox"
                        )
                        if await follow_company_checkbox.count() > 0:
                            await follow_company_checkbox.scroll_into_view_if_needed()
                            await follow_company_checkbox.click()  # don't follow company
                            await human_delay(0.2, 0.5)

                        if submit:  # dbl check
                            await self.next_page(button)
                            app.submitted = True

                        return app
                    elif step is None:
                        logging.error("Unexpected state: no navigation buttons found")
                        raise RuntimeError("No navigation buttons found")

                # If we exit the loop, we hit the safety cap
                raise RuntimeError("Exceeded maximum Easy Apply steps; aborting.")
        except Exception as e:
            logging.error(f"Error occurred app scraping/submitting for {app.id}: {e}")
            raise e

    async def scrape_questions(self) -> App:
        return await self.scrape()

    async def apply(self, app: App) -> bool:
        app = await self.scrape(app, submit=True)
        return app.submitted


if __name__ == "__main__":
    import asyncio

    job = Job(
        id=uuid.uuid4(),
        jobspy_id="li-4264253178",
        title="Software Engineer",
        company="Rokt",
        linkedin_job_url="https://www.linkedin.com/jobs/view/4288804260",
        review=Review(
            action="Add explicit TypeScript experience and a concrete Next.js project (with a link or portfolio) to your resume to demonstrate full-stack TS/Next.js capability.",
            classification="target",
        ),
        reviewed=True,
    )
    scraper = LinkedIn(job)

    async def main():
        app = await scraper.scrape(headless=False)
        print("Done!")

    asyncio.run(main())
