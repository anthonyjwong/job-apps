import asyncio
import random
from abc import ABC, abstractmethod

from src.definitions import App, Job

EMULATE_HUMAN = True


async def human_delay(min_sec=0.5, max_sec=1.5, override=False):
    if EMULATE_HUMAN or override:
        await asyncio.sleep(random.uniform(min_sec, max_sec))


class JobSite(ABC):
    job: Job

    def __init__(self, job):
        self.job = job

    @abstractmethod
    async def scrape_questions(self) -> App:
        """Get the questions from a job application."""
        pass

    @abstractmethod
    async def apply(self, app: App) -> bool:
        """Submit an application."""
        pass
