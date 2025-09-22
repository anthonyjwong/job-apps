import logging
import re
import time
from typing import Callable, Optional, Tuple, Type
from urllib.parse import urlparse

import pandas as pd
from app.schemas.definitions import Application, Job
from app.scrapers.scraper import JobSite
from app.scrapers.sites.ashby import Ashby
from app.scrapers.sites.linkedin import LinkedIn

DOMAIN_HANDLERS = {"jobs.ashbyhq.com": Ashby, "www.linkedin.com": LinkedIn}


def get_domain_handler(app: Application) -> JobSite:
    """Get the appropriate JobSite handler based on the URL's domain."""
    base_url = get_base_url(app.url)
    if base_url in DOMAIN_HANDLERS:
        return DOMAIN_HANDLERS[base_url](app.job)
    else:
        return None


def jobspy_to_job(listing: dict) -> Job:
    """Converts jobspy listing data to Job object."""
    return Job(
        title=clean_val(listing.get("title")),
        company=clean_val(listing.get("company")),
        location=clean_val(listing.get("location")),
        min_salary=clean_val(listing.get("min_amount")),
        max_salary=clean_val(listing.get("max_amount")),
        type=clean_val(listing.get("job_type")),
        date_posted=clean_val(str(listing.get("date_posted"))),
        description=clean_val(listing.get("description")),
        linkedin_job_url=clean_url(clean_val(listing.get("job_url"))),
        direct_job_url=clean_url(clean_val(listing.get("job_url_direct"))),
        jobspy_id=clean_val(listing.get("id")),
        manually_created=False,
    )


def convert_df_to_object_list(df: pd.DataFrame, obj_type: type) -> list[object]:
    return [obj_type(**row) for _, row in df.iterrows()]


def convert_object_list_to_df(objects: list[object]) -> pd.DataFrame:
    return pd.DataFrame([obj.__dict__ for obj in objects])


def clean_val(x):
    """Normalize values coming from external sources.

    - Treat pandas NA as None
    - Treat common string placeholders ("", "none", "nan", "nat") as None
    - Leave other values unchanged
    """
    if not pd.notna(x):
        return None
    if isinstance(x, str):
        s = x.strip().lower()
        if s in {"", "none", "nan", "nat", "null"}:
            return None
    return x


def clean_url(url: str) -> Optional[str]:
    """Clean the URL by removing query parameters."""
    return re.sub(r"[?&].*$", "", url) if url else None


def get_base_url(url: str) -> str:
    """Get the base URL from a full URL."""
    if pd.isna(url):
        raise ValueError("Cannot get base URL if value is NaN")

    return urlparse(url).netloc


def get_unique_sites(jobs: list[Job]) -> set[str]:
    """Get unique sites from the direct_job_url."""
    jobs_df = convert_object_list_to_df(jobs)
    sites = set()
    for url in jobs_df.direct_job_url.unique():
        try:
            base_url = urlparse(url).netloc
            sites.add(base_url)
        except AttributeError:
            continue

    return sites


def with_retry(
    func: Callable,
    *args,
    retries: int = 5,
    base_delay: float = 1.0,
    retry_exceptions: Tuple[Type[BaseException], ...] = (Exception,),
    **kwargs,
):
    """Run func with retries and exponential backoff.

    Retries on network/server issues (e.g., 5xx). Backoff with jitter.
    """
    attempt = 0
    while True:
        try:
            return func(*args, **kwargs)
        except retry_exceptions as e:
            attempt += 1
            if attempt > retries:
                raise
            sleep_for = base_delay * (2 ** (attempt - 1)) * (1 + 0.1 * attempt)
            logging.warning(
                {
                    "method": "apply._with_retry",
                    "attempt": attempt,
                    "sleep": round(sleep_for, 2),
                    "error": str(e),
                }
            )
            time.sleep(sleep_for)


if __name__ == "__main__":
    pass
