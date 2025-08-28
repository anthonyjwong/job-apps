import logging
import random
import time
from abc import ABC, abstractmethod

from src.definitions import App, Job


class JobSite(ABC):
    @abstractmethod
    def scrape_questions(job: Job) -> App:
        """Get the questions from a job application."""
        pass

    @abstractmethod
    def apply(app: App) -> bool:
        """Submit an application."""
        pass
