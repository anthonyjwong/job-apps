from abc import ABC, abstractmethod

from src.definitions import App, Job


def fill_combobox(element, value, timeout=7000):
    """
    entry: locator for the field container that includes the combobox input
    value: text to select, e.g. "New York, NY, United States"
    """
    import random
    import time

    cb = element.get_by_role("combobox").first

    cb.wait_for(state="visible", timeout=timeout)
    assert cb.is_enabled(), "Combobox is disabled"
    assert cb.is_editable(), "Combobox is not editable (possibly readonly)"

    cb.scroll_into_view_if_needed()
    time.sleep(random.uniform(0.3, 0.7))
    cb.click()
    time.sleep(random.uniform(0.2, 0.5))

    try:
        if (cb.get_attribute("aria-expanded") or "false").lower() == "false":
            toggle = element.locator("button").filter(has=element.locator("svg")).first
            if toggle.count():
                toggle.click()
                time.sleep(random.uniform(0.2, 0.5))
    except Exception:
        pass

    try:
        cb.press("Control+A")
        time.sleep(random.uniform(0.1, 0.2))
    except:
        pass
    for char in value:
        cb.type(char)
        time.sleep(random.uniform(0.05, 0.15))
    time.sleep(random.uniform(0.3, 0.7))

    try:
        listbox = cb.page.get_by_role("listbox")
        listbox.wait_for(state="visible", timeout=2000)
        opt = listbox.get_by_role("option", name=value)
        if opt.count() and opt.first.is_visible():
            opt.first.scroll_into_view_if_needed()
            time.sleep(random.uniform(0.1, 0.3))
            opt.first.click()
        else:
            first_opt = listbox.get_by_role("option").first
            if first_opt.is_visible():
                first_opt.scroll_into_view_if_needed()
                time.sleep(random.uniform(0.1, 0.3))
                first_opt.click()
            else:
                cb.press("Enter")
                time.sleep(random.uniform(0.1, 0.3))
    except Exception:
        cb.press("Enter")
        time.sleep(random.uniform(0.1, 0.3))

    if not (cb.input_value() or "").strip():
        cb.evaluate(
            """(el, val) => {
                el.value = val;
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            }""",
            value,
        )
        time.sleep(random.uniform(0.1, 0.3))

    assert value.split(",")[0] in cb.input_value()


class JobSite(ABC):
    @abstractmethod
    def scrape_questions(job: Job) -> App:
        """Get the questions from a job application."""
        pass

    @abstractmethod
    def apply(app: App) -> bool:
        """Submit an application."""
        pass
