import asyncio
import logging
import random

from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
from scrapers.scraper import EMULATE_HUMAN, JobSite, human_delay
from src.definitions import App, AppField, Job


class Ashby(JobSite):
    job: Job

    def __init__(self, job):
        self.job = job

    def find_answer_area(self, children):
        divs = children[1:]
        answer_area = divs[0]
        if len(divs) > 1 and "ashby-application-form-question-description" in divs[
            0
        ].get("class"):
            answer_area = divs[1]
        return answer_area

    async def fill_combobox(self, element, value, timeout=7000):
        """
        entry: locator for the field container that includes the combobox input
        value: text to select, e.g. "New York, NY, United States"
        """

        cb = element.get_by_role("combobox").first

        await cb.wait_for(state="visible", timeout=timeout)
        assert await cb.is_enabled(), "Combobox is disabled"
        assert await cb.is_editable(), "Combobox is not editable (possibly readonly)"

        await cb.scroll_into_view_if_needed()
        await human_delay(0.2, 0.5)
        await cb.click()
        await human_delay(0.2, 0.5)

        try:
            aria_expanded = await cb.get_attribute("aria-expanded")
            if (aria_expanded or "false").lower() == "false":
                toggle = (
                    element.locator("button").filter(has=element.locator("svg")).first
                )
                if await toggle.count():
                    await toggle.click()
                    await human_delay(0.2, 0.5)
        except Exception as e:
            logging.warning("Failed to expand combobox: %s", e)

        try:
            await cb.press("Control+A")
            await human_delay(0.1, 0.2)
        except Exception as e:
            logging.warning("Failed to press Control+A: %s", e)
        for char in value:
            await cb.type(char)
            await human_delay(0.05, 0.15)
        await human_delay(0.3, 0.7, override=True)

        try:
            listbox = cb.page.get_by_role("listbox")
            await listbox.wait_for(state="visible", timeout=2000)
            opt = listbox.get_by_role("option", name=value)
            if await opt.count() and await opt.first.is_visible():
                await opt.first.scroll_into_view_if_needed()
                await human_delay(0.1, 0.3, override=True)
                await opt.first.click()
            else:
                first_opt = listbox.get_by_role("option").first
                if await first_opt.is_visible():
                    await first_opt.scroll_into_view_if_needed()
                    await human_delay(0.1, 0.3, override=True)
                    await first_opt.click()
                else:
                    await cb.press("Enter")
                    await human_delay(0.1, 0.3, override=True)
        except Exception:
            await cb.press("Enter")
            await human_delay(0.1, 0.3, override=True)
        finally:
            await human_delay(0.2, 0.5)

        await cb.press("Tab")  # always press tab after filling out combobox

        # Post-fill combobox value check and correction
        combobox_value = ((await cb.input_value()) or "").strip()
        if not combobox_value or value.split(",")[0] not in combobox_value:
            await cb.evaluate(
                """(el, val) => {
                    el.value = val;
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                }""",
                value,
            )
            await human_delay(0.1, 0.3, override=True)

        assert value.split(",")[0] in (await cb.input_value())

    async def scrape_questions(self) -> App:
        url = self.job.direct_job_url
        if not url.endswith("/application"):
            url += "/application"

        async with async_playwright() as p:
            browser = await p.firefox.launch(headless=True)
            page = await browser.new_page()
            await page.goto(url)
            await page.wait_for_selector(
                "div.ashby-application-form-container"
            )  # wait until loaded
            await asyncio.sleep(1)  # wait 1 sec

            # get page content
            html = await page.content()
            soup = BeautifulSoup(html, "html.parser")
            await browser.close()  # we have all the info we need at this point

            # parse job app
            app = App(
                job_id=self.job.id,
                url=(
                    self.job.direct_job_url
                    if self.job.direct_job_url
                    else (
                        self.job.linkedin_job_url if self.job.linkedin_job_url else None
                    )
                ),
            )
            form = soup.find(class_="ashby-application-form-container")
            sections = form.find_all(class_="ashby-application-form-section-container")
            for section in sections:
                for element in section:
                    question = element.find(
                        class_="ashby-application-form-question-title"
                    )
                    if (
                        element.name != "fieldset" and question is None
                    ):  # skip non questions
                        continue

                    if "ashby-application-form-field-entry" in element.get(
                        "class"
                    ):  # scrape text question
                        children = element.find_all(recursive=False)
                        answer_area = self.find_answer_area(children)
                        if (
                            answer_area.name == "input"
                            or answer_area.name == "textarea"
                        ):  # label + input/textarea = text answer
                            app.fields.append(
                                AppField(
                                    question=question.text,
                                    multiple_choice=False,
                                    choices=None,
                                    answer=None,
                                )
                            )
                        elif (
                            answer_area.name == "div"
                        ):  # label + div = yes/no or text dropdown or file upload
                            if "_yesno_hkyf8_143" in answer_area.get(
                                "class"
                            ):  # yes/no question
                                app.fields.append(
                                    AppField(
                                        question=question.text,
                                        multiple_choice=True,
                                        choices=["Yes", "No"],
                                        answer=None,
                                    )
                                )
                            else:  # text dropdown or file upload
                                app.fields.append(
                                    AppField(
                                        question=question.text,
                                        multiple_choice=False,
                                        choices=None,
                                        answer=None,
                                    )
                                )
                    elif element.name == "fieldset":  # scrape multiple choice question
                        choices = []

                        checkboxes = element.find_all("input", {"type": "checkbox"})
                        if len(checkboxes) > 0:
                            for checkbox in checkboxes:
                                choice = checkbox.get("name")
                                choices.append(choice)

                        radio_buttons = element.find_all("input", {"type": "radio"})
                        radio_answers = element.find_all(
                            "label", class_="_label_1v5e2_43"
                        )
                        if len(radio_buttons) > 0:
                            for choice in radio_answers:
                                choices.append(choice.text)

                        app.fields.append(
                            AppField(
                                question=question.text,
                                multiple_choice=True,
                                choices=choices,
                                answer=None,
                            )
                        )

        return app

    async def apply(self, app: App) -> bool:
        url = app.url
        if not url.endswith("/application"):
            url += "/application"

        try:
            async with async_playwright() as p:
                browser = await p.firefox.launch(headless=True)
                page = await browser.new_page()
                await page.goto(url, wait_until="domcontentloaded")
                await page.wait_for_selector("div.ashby-application-form-container")
                await asyncio.sleep(1)  # wait 1 sec

                question_elements = page.locator(
                    ".ashby-application-form-field-entry, fieldset"
                )

                total = await question_elements.count()
                for i in range(total):
                    if i >= len(app.fields):
                        break

                    element = question_elements.nth(i)
                    tag = await element.evaluate("e => e.tagName.toLowerCase()")

                    question = await element.locator(
                        ".ashby-application-form-question-title"
                    ).first.text_content()
                    answer = app.find_answer(question)

                    if tag == "div":
                        text_input = element.locator("._input_hkyf8_33").first
                        if await text_input.count() > 0:
                            await text_input.scroll_into_view_if_needed()
                            for char in answer:
                                await text_input.type(char)
                                await human_delay(0.05, 0.15)
                            await human_delay()

                        dropdown_text = element.locator("._input_v5ami_28")
                        if await dropdown_text.count() > 0:
                            await dropdown_text.scroll_into_view_if_needed()
                            await self.fill_combobox(element, answer)
                            await human_delay()

                        boolean_options = element.locator("._option_y2cw4_33")
                        if await boolean_options.count() > 0:
                            count_bool = await boolean_options.count()
                            for j in range(count_bool):
                                option = boolean_options.nth(j)
                                if (await option.text_content()) == answer:
                                    await option.scroll_into_view_if_needed()
                                    await option.click()
                                    await human_delay()

                        file_upload = element.locator(
                            "input#_systemfield_resume[type='file']"
                        )
                        if await file_upload.count() > 0:
                            await file_upload.set_input_files(answer)
                            await human_delay()

                    elif tag == "fieldset":
                        checkboxes = element.locator("._option_1v5e2_35")
                        count_cb = await checkboxes.count()
                        for j in range(count_cb):
                            option = checkboxes.nth(j)
                            if (await option.text_content()) == answer:
                                await option.scroll_into_view_if_needed()
                                await option.locator("input").first.click()
                                await human_delay()

                if app.approved:
                    # submit
                    await human_delay(1, 2, override=True)
                    submit_button = page.locator(
                        ".ashby-application-form-submit-button"
                    ).first
                    await submit_button.scroll_into_view_if_needed()
                    await submit_button.click()
                    await human_delay(2, 3)

                    # check for success or failure after submission
                    success_selector = "div.ashby-application-form-success-container"
                    failure_selector = "div.ashby-application-form-failure-container"
                    try:
                        await page.wait_for_selector(
                            f"{success_selector}, {failure_selector}", timeout=7000
                        )
                    except Exception as e:
                        logging.error(
                            f"Timed out waiting for success or failure container for app {app.id}. Submission may have been improperly filled out."
                        )
                        raise e

                    success = (await page.locator(success_selector).count()) > 0
                    failure = (await page.locator(failure_selector).count()) > 0
                    if success:
                        logging.info(f"App {app.id} submitted successfully!")
                        return True
                    elif failure:
                        error_message = f"App {app.id} submission failed; Failure container detected."
                        logging.error(error_message)
                        raise RuntimeError(error_message)
                    else:
                        error_message = f"App {app.id} submission failed; No container detected. Assuming failure."
                        logging.error(error_message)
                        raise RuntimeError(error_message)

                else:
                    logging.error("Application not approved by user.")
                    raise RuntimeError(
                        f"Failed to submit app {app.id}: User did not approve."
                    )

        except Exception as e:
            logging.error(f"Error occurred while submitting app {app.id}: {e}")
            raise e
