import logging

from app.core.scrapers.scraper import JobSite, human_delay
from app.schemas.definitions import (
    Application,
    ApplicationForm,
    ApplicationFormField,
    ApplicationFormState,
    Job,
)
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright


class Ashby(JobSite):
    job: Job

    def __init__(self, job):
        self.job = job

    def find_answer_area(self, children):
        divs = children[1:]
        answer_area = divs[0]
        if len(divs) > 1 and "ashby-application-form-question-description" in divs[0].get("class"):
            answer_area = divs[1]
        return answer_area

    def fill_combobox(self, element, value, timeout=7000):
        """
        entry: locator for the field container that includes the combobox input
        value: text to select, e.g. "New York, NY, United States"
        """

        cb = element.get_by_role("combobox").first

        cb.wait_for(state="visible", timeout=timeout)
        assert cb.is_enabled(), "Combobox is disabled"
        assert cb.is_editable(), "Combobox is not editable (possibly readonly)"

        cb.scroll_into_view_if_needed()
        human_delay(0.2, 0.5)
        cb.click()
        human_delay(0.2, 0.5)

        try:
            aria_expanded = cb.get_attribute("aria-expanded")
            if (aria_expanded or "false").lower() == "false":
                toggle = element.locator("button").filter(has=element.locator("svg")).first
                if toggle.count():
                    toggle.click()
                    human_delay(0.2, 0.5)
        except Exception as e:
            logging.warning("Failed to expand combobox: %s", e)

        try:
            cb.press("Control+A")
            human_delay(0.1, 0.2)
        except Exception as e:
            logging.warning("Failed to press Control+A: %s", e)
        for char in value:
            cb.type(char)
            human_delay(0.05, 0.15)
        human_delay(0.3, 0.7, override=True)

        try:
            listbox = cb.page.get_by_role("listbox")
            listbox.wait_for(state="visible", timeout=2000)
            opt = listbox.get_by_role("option", name=value)
            if opt.count() and opt.first.is_visible():
                opt.first.scroll_into_view_if_needed()
                human_delay(0.1, 0.3, override=True)
                opt.first.click()
            else:
                first_opt = listbox.get_by_role("option").first
                if first_opt.is_visible():
                    first_opt.scroll_into_view_if_needed()
                    human_delay(0.1, 0.3, override=True)
                    first_opt.click()
                else:
                    cb.press("Enter")
                    human_delay(0.1, 0.3, override=True)
        except Exception:
            cb.press("Enter")
            human_delay(0.1, 0.3, override=True)
        finally:
            human_delay(0.2, 0.5)

        cb.press("Tab")  # always press tab after filling out combobox

        # post-fill combobox value check and correction
        combobox_value = ((cb.input_value()) or "").strip()
        if not combobox_value or value.split(",")[0] not in combobox_value:
            cb.evaluate(
                """(el, val) => {
                    el.value = val;
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                }""",
                value,
            )
            human_delay(0.1, 0.3, override=True)

        assert value.split(",")[0] in (cb.input_value())

    def scrape_questions(self) -> ApplicationForm:
        url = self.job.direct_job_url
        if not url.endswith("/application"):
            url += "/application"

        with sync_playwright() as p:
            browser = p.firefox.launch(headless=True)
            page = browser.new_page()
            page.goto(url)
            page.wait_for_selector("div.ashby-application-form-container")  # wait until loaded

            # get page content
            html = page.content()
            soup = BeautifulSoup(html, "html.parser")
            browser.close()  # we have all the info we need at this point

            # parse job app
            form = ApplicationForm(fields=[])
            container = soup.find(class_="ashby-application-form-container")
            sections = container.find_all(class_="ashby-application-form-section-container")
            for section in sections:
                for element in section:
                    question = element.find(class_="ashby-application-form-question-title")
                    if element.name != "fieldset" and question is None:  # skip non questions
                        continue

                    if "ashby-application-form-field-entry" in element.get(
                        "class"
                    ):  # scrape text question
                        children = element.find_all(recursive=False)
                        answer_area = self.find_answer_area(children)
                        if (
                            answer_area.name == "input" or answer_area.name == "textarea"
                        ):  # label + input/textarea = text answer
                            form.fields.append(
                                ApplicationFormField(
                                    question=question.text,
                                    multiple_choice=False,
                                    choices=None,
                                    answer=None,
                                )
                            )
                        elif (
                            answer_area.name == "div"
                        ):  # label + div = yes/no or text dropdown or file upload
                            if "_yesno_hkyf8_143" in answer_area.get("class"):  # yes/no question
                                form.fields.append(
                                    ApplicationFormField(
                                        question=question.text,
                                        multiple_choice=True,
                                        choices=["Yes", "No"],
                                        answer=None,
                                    )
                                )
                            else:  # text dropdown or file upload
                                form.fields.append(
                                    ApplicationFormField(
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
                        radio_answers = element.find_all("label", class_="_label_1v5e2_43")
                        if len(radio_buttons) > 0:
                            for choice in radio_answers:
                                choices.append(choice.text)

                        form.fields.append(
                            ApplicationFormField(
                                question=question.text,
                                multiple_choice=True,
                                choices=choices,
                                answer=None,
                            )
                        )

        return form

    def apply(self, app: Application) -> bool:
        url = app.url
        if not url.endswith("/application"):
            url += "/application"

        try:
            with sync_playwright() as p:
                browser = p.firefox.launch(headless=True)
                page = browser.new_page()
                page.goto(url, wait_until="domcontentloaded")
                page.wait_for_selector("div.ashby-application-form-container")

                question_elements = page.locator(".ashby-application-form-field-entry, fieldset")

                total = question_elements.count()
                for i in range(total):
                    if i >= len(app.form.fields):
                        break

                    element = question_elements.nth(i)
                    tag = element.evaluate("e => e.tagName.toLowerCase()")

                    question = element.locator(
                        ".ashby-application-form-question-title"
                    ).first.text_content()
                    answer = app.form.find_answer(question)

                    if tag == "div":
                        text_input = element.locator("._input_hkyf8_33").first
                        if text_input.count() > 0:
                            text_input.scroll_into_view_if_needed()
                            for char in answer:
                                text_input.type(char)
                                human_delay(0.05, 0.15)
                            human_delay()

                        dropdown_text = element.locator("._input_v5ami_28")
                        if dropdown_text.count() > 0:
                            dropdown_text.scroll_into_view_if_needed()
                            self.fill_combobox(element, answer)
                            human_delay()

                        boolean_options = element.locator("._option_y2cw4_33")
                        if boolean_options.count() > 0:
                            count_bool = boolean_options.count()
                            for j in range(count_bool):
                                option = boolean_options.nth(j)
                                if (option.text_content()) == answer:
                                    option.scroll_into_view_if_needed()
                                    option.click()
                                    human_delay()

                        file_upload = element.locator("input#_systemfield_resume[type='file']")
                        if file_upload.count() > 0:
                            file_upload.set_input_files(answer)
                            human_delay()

                    elif tag == "fieldset":
                        checkboxes = element.locator("._option_1v5e2_35")
                        count_cb = checkboxes.count()
                        for j in range(count_cb):
                            option = checkboxes.nth(j)
                            if (option.text_content()) == answer:
                                option.scroll_into_view_if_needed()
                                option.locator("input").first.click()
                                human_delay()

                if app.form.state == ApplicationFormState.APPROVED:
                    # submit
                    human_delay(1, 2, override=True)
                    submit_button = page.locator(".ashby-application-form-submit-button").first
                    submit_button.scroll_into_view_if_needed()
                    submit_button.click()
                    human_delay(2, 3)

                    # check for success or failure after submission
                    success_selector = "div.ashby-application-form-success-container"
                    failure_selector = "div.ashby-application-form-failure-container"
                    try:
                        page.wait_for_selector(
                            f"{success_selector}, {failure_selector}", timeout=7000
                        )
                    except Exception as e:
                        logging.error(
                            f"Timed out waiting for success or failure container for app {app.id}. Submission may have been improperly filled out."
                        )
                        raise e

                    success = (page.locator(success_selector).count()) > 0
                    failure = (page.locator(failure_selector).count()) > 0
                    if success:
                        logging.info(f"App {app.id} submitted successfully!")
                        return True
                    elif failure:
                        error_message = (
                            f"App {app.id} submission failed; Failure container detected."
                        )
                        logging.error(error_message)
                        raise RuntimeError(error_message)
                    else:
                        error_message = f"App {app.id} submission failed; No container detected. Assuming failure."
                        logging.error(error_message)
                        raise RuntimeError(error_message)
                else:
                    logging.error("Application not approved by user.")
                    raise RuntimeError(f"Failed to submit app {app.id}: User did not approve.")

        except Exception as e:
            logging.error(f"Error occurred while submitting app {app.id}: {e}")
            raise e
