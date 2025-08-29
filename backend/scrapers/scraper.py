import random
import time
from abc import ABC, abstractmethod

from src.definitions import App, Job

EMULATE_HUMAN = True


def human_delay(min_sec=0.5, max_sec=1.5, override=False):
    if EMULATE_HUMAN or override:
        time.sleep(random.uniform(min_sec, max_sec))
    else:
        pass


class JobSite(ABC):
    job: Job

    def __init__(self, job):
        self.job = job

    @abstractmethod
    def scrape_questions(self) -> App:
        """Get the questions from a job application."""
        pass

    @abstractmethod
    def apply(self, app: App) -> bool:
        """Submit an application."""
        pass
