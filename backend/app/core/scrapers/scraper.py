import random
import time
from abc import ABC, abstractmethod

from app.schemas.definitions import Application, ApplicationForm, Job

EMULATE_HUMAN = True


def human_delay(min_sec=0.5, max_sec=1.5, override=False):
    if EMULATE_HUMAN or override:
        time.sleep(random.uniform(min_sec, max_sec))


class JobSite(ABC):
    job: Job

    def __init__(self, job: Job):
        self.job = job

    @abstractmethod
    def scrape_questions(self) -> ApplicationForm:
        """Get the questions from an application form."""
        pass

    @abstractmethod
    def apply(self, app: Application) -> bool:
        """Submit an application."""
        pass
