import os
import uuid

from playwright.async_api import async_playwright
from scrapers.scraper import EMULATE_HUMAN, JobSite, human_delay
from src.definitions import App, AppField, Job, Review

LINKEDIN_CLIENT_ID = os.getenv("LINKEDIN_CLIENT_ID")
LINKEDIN_CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET")


class LinkedIn(JobSite):
    job: Job

    def __init__(self, job):
        self.job = job

    async def write(self, element, text):
        for char in text:
            await element.type(char)
            await human_delay(0.05, 0.15)

    async def login(self, browser):
        page = await browser.new_page()
        await page.goto("https://www.linkedin.com/login")
        await human_delay()

        username_input = page.locator("input[type='email']#username")
        password_input = page.locator("input[type='password']#password")
        await self.write(username_input, LINKEDIN_CLIENT_ID)
        await self.write(password_input, LINKEDIN_CLIENT_SECRET)

        login_button = page.locator("button[aria-label='Sign in']")
        await login_button.scroll_into_view_if_needed()
        await login_button.click()

        # Wait for navigation after clicking the login button
        await page.wait_for_load_state("networkidle")
        return page

    async def next_page(self, element):
        await element.scroll_into_view_if_needed()
        await element.click()
        await human_delay(1, 2)

    async def scrape(self, app: App = None, submit: bool = False) -> App:
        if app == None:
            app = App(
                job_id=self.job.id,
                url=self.job.linkedin_job_url if self.job.linkedin_job_url else None,
            )

        async with async_playwright() as p:
            browser = await p.firefox.launch(headless=False)
            page = await self.login(browser)
            await page.goto(app.url)

            # Wait for the "Easy Apply" button to appear
            await page.wait_for_selector("button#jobs-apply-button-id")
            await human_delay()

            apply_button = page.locator("button#jobs-apply-button-id")
            await apply_button.scroll_into_view_if_needed()
            await apply_button.click()

            # Wait for the Easy Apply modal to become visible inside the modal outlet
            modal = page.locator(".jobs-easy-apply-modal__content")
            await modal.wait_for(state="visible")
            await human_delay(1, 2)

            next_button = modal.locator("button[aria-label='Continue to next step']")
            review_button = modal.locator(
                "button[aria-label='Review your application']"
            )
            submit_button = modal.locator("button[aria-label='Submit application']")
            while next_button or review_button or submit_button:
                if next_button:
                    # resume
                    # file_upload = question.locator("input[type='file']").first
                    #     if await file_upload.count() > 0:
                    #         # linkedin autofills resume
                    #         await next_button.scroll_into_view_if_needed()
                    #         await next_button.click()
                    #         await human_delay(1, 2)

                    # get questions
                    question_elements = page.locator(
                        ".DklSpvuYKpZWRlAbeBtitReCzWRCFaZjmnnIMw"
                    )
                    for question in question_elements:
                        text_input = question.locator("input[type='text']").first
                        if await text_input.count() > 0:
                            question = await question.locator(
                                "label"
                            ).first.text_content()
                            print(f"Text input question: {question}")

                        dropdown = question.locator("select").first
                        if await dropdown.count() > 0:
                            question = await question.locator(
                                "label"
                            ).first.text_content()
                            options = await question.locator("option")
                            print(f"Dropdown question: {question}")
                            print(f"Dropdown options: {await options.count()}")

                        radio_options = question.locator("input[type='radio']")
                        if await radio_options.count() > 0:
                            question = await question.locator(
                                "legend"
                            ).first.text_content()
                            option_labels = question.locator("label")
                            option_inputs = await question.locator(
                                "input[type='radio']"
                            )
                            print(f"Radio button question: {question}")
                            print(
                                f"Radio button options: {await option_labels.count()}"
                            )
                            print(f"Radio button inputs: {await option_inputs.count()}")

                    await self.next_page(next_button)
                elif review_button:
                    follow_company_checkbox = modal.locator(
                        "input[type='checkbox']#follow-company-checkbox"
                    )
                    await follow_company_checkbox.scroll_into_view_if_needed()
                    await follow_company_checkbox.click()  # don't follow company
                    await human_delay(0.2, 0.5)

                    await self.next_page(review_button)
                elif submit_button:
                    if submit:
                        await self.next_page(submit_button)
                        app.submitted = True

        return app

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
        app = await scraper.scrape_questions()
        print("Done!")

    asyncio.run(main())
