import re
from urllib.parse import urlparse

import pandas as pd

from src.definitions import Job


def convert_df_to_object_list(df: pd.DataFrame, obj_type: type) -> list[object]:
    return [obj_type(**row) for _, row in df.iterrows()]


def convert_object_list_to_df(objects: list[object]) -> pd.DataFrame:
    return pd.DataFrame([obj.__dict__ for obj in objects])


def clean_val(x):
    return x if pd.notna(x) else None


from typing import Optional


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


if __name__ == "__main__":
    pass
