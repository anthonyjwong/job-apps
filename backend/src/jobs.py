import pandas as pd
from jobspy import scrape_jobs
from src.definitions import Job
from src.utils import clean_url, clean_val


def preprocess_listing(listing: dict) -> dict:
    """Preprocess listing data to match Job parameters."""
    # Create mapping from DataFrame columns to Job attributes
    mapped_data = {
        "jobspy_id": clean_val(listing.get("id")),
        "title": clean_val(listing.get("title")),
        "company": clean_val(listing.get("company")),
        "location": clean_val(listing.get("location")),
        "min_salary": clean_val(
            listing.get("min_amount")
        ),  # Map min_amount to min_salary
        "max_salary": clean_val(
            listing.get("max_amount")
        ),  # Map max_amount to max_salary
        "date_posted": clean_val(listing.get("date_posted")),
        "job_type": clean_val(listing.get("job_type")),
        "linkedin_job_url": (
            clean_url(clean_val(listing.get("job_url")))
        ),  # Map job_url to linkedin_job_url
        "direct_job_url": (clean_url(clean_val(listing.get("job_url_direct")))),
        "description": clean_val(listing.get("description")),
    }

    return mapped_data


def save_jobs(num_jobs=5) -> list[Job]:
    """Finds jobs and saves them to the database."""

    listings: pd.DataFrame = scrape_jobs(
        site_name=[
            "linkedin",
        ],
        search_term="software engineer",
        location="New York, NY",
        results_wanted=num_jobs,
        hours_old=24,
        country_indeed="USA",
        linkedin_fetch_description=True,
        # proxies=["208.195.175.46:65095", "208.195.175.45:65095", "localhost"],
    )

    # Convert listings to Job objects
    jobs = [Job(**preprocess_listing(row.to_dict())) for _, row in listings.iterrows()]

    return jobs


if __name__ == "__main__":
    save_jobs()
