import logging
import random
import time

from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from scrapers.scraper import JobSite
from src.definitions import App, AppField, Job


def find_answer_area(children):
    divs = children[1:]
    answer_area = divs[0]
    if len(divs) > 1 and "ashby-application-form-question-description" in divs[0].get(
        "class"
    ):
        answer_area = divs[1]
    return answer_area


def human_delay(min_sec=0.5, max_sec=1.5):
    EMULATE_HUMAN = False
    if EMULATE_HUMAN:
        time.sleep(random.uniform(min_sec, max_sec))
    else:
        pass


def fill_combobox(element, value, timeout=7000):
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
        if (cb.get_attribute("aria-expanded") or "false").lower() == "false":
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
    human_delay(0.3, 0.7)

    try:
        listbox = cb.page.get_by_role("listbox")
        listbox.wait_for(state="visible", timeout=2000)
        opt = listbox.get_by_role("option", name=value)
        if opt.count() and opt.first.is_visible():
            opt.first.scroll_into_view_if_needed()
            human_delay(0.1, 0.3)
            opt.first.click()
        else:
            first_opt = listbox.get_by_role("option").first
            if first_opt.is_visible():
                first_opt.scroll_into_view_if_needed()
                human_delay(0.1, 0.3)
                first_opt.click()
            else:
                cb.press("Enter")
                human_delay(0.1, 0.3)
    except Exception:
        cb.press("Enter")
        human_delay(0.1, 0.3)

    cb.press("Tab")  # always press tab after filling out combobox

    if not (cb.input_value() or "").strip():
        cb.evaluate(
            """(el, val) => {
                    el.value = val;
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                }""",
            value,
        )
        human_delay(0.1, 0.3)

    assert value.split(",")[0] in cb.input_value()


class Ashby(JobSite):
    @staticmethod
    def scrape_questions(job: Job) -> App:
        url = job.direct_job_url
        if not url.endswith("/application"):
            url += "/application"

        with sync_playwright() as p:
            browser = p.firefox.launch(headless=True)
            page = browser.new_page()
            page.goto(url)
            page.wait_for_selector(
                "div.ashby-application-form-container"
            )  # wait until loaded

            time.sleep(5)  # sleep 5 sec

            # get page content
            html = page.content()
            soup = BeautifulSoup(html, "html.parser")
            browser.close()  # we have all the info we need at this point

            # parse job app
            app = App(
                job_id=job.id,
                url=(
                    job.direct_job_url
                    if job.direct_job_url
                    else job.linkedin_job_url if job.linkedin_job_url else None
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
                        answer_area = find_answer_area(children)
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

    @staticmethod
    def apply(app: App, job: Job) -> bool:
        url = job.direct_job_url
        if not url.endswith("/application"):
            url += "/application"

        try:
            with sync_playwright() as p:
                browser = p.firefox.launch(headless=False)
                page = browser.new_page()
                page.goto(url, wait_until="domcontentloaded")
                page.wait_for_selector("div.ashby-application-form-container")

                question_elements = page.locator(
                    ".ashby-application-form-field-entry, fieldset"
                )

                for i in range(question_elements.count()):
                    if i >= len(app.fields):
                        break

                    element = question_elements.nth(i)
                    tag = element.evaluate("e => e.tagName.toLowerCase()")

                    question = element.locator(
                        ".ashby-application-form-question-title"
                    ).first.text_content()
                    answer = app.find_answer(question)

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
                            fill_combobox(element, answer)
                            human_delay()

                        boolean_options = element.locator("._option_y2cw4_33")
                        if boolean_options.count() > 0:
                            for j in range(boolean_options.count()):
                                option = boolean_options.nth(j)
                                if option.text_content() == answer:
                                    option.scroll_into_view_if_needed()
                                    option.click()
                                    human_delay()

                        file_upload = element.locator(
                            "input#_systemfield_resume[type='file']"
                        )
                        if file_upload.count() > 0:
                            # file_upload.scroll_into_view_if_needed()
                            file_upload.set_input_files(answer)
                            human_delay()

                    elif tag == "fieldset":
                        checkboxes = element.locator("._option_1v5e2_35")
                        for j in range(checkboxes.count()):
                            option = checkboxes.nth(j)
                            if option.text_content() == answer:
                                option.scroll_into_view_if_needed()
                                option.locator("input").first.click()
                                human_delay()

                human_delay(1, 2)
                submit_button = page.locator(
                    ".ashby-application-form-submit-button"
                ).first
                submit_button.scroll_into_view_if_needed()
                submit_button.click()
                human_delay(2, 3)
                time.sleep(3600)

        except Exception as e:
            logging.error(f"Error occurred while applying: {e}")
            return False
        logging.info(f"Successfully submitted application!")
        return True
