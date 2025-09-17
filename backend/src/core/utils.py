import logging
import re
import time
from typing import Callable, Optional, Tuple, Type
from urllib.parse import urlparse

import pandas as pd

from schemas.definitions import Job


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
