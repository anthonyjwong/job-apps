# https://fastapi.tiangolo.com/tutorial/dependencies/
from app.database.session import SessionLocal
from app.schemas.definitions import User


def get_current_user():
    """Dummy function to represent getting the current user."""
    return User(
        first_name="AJ",
        last_name="Wong",
        email="anthonyjaredwong@gmail.com",
        resume_pdf_path="AJ Wong's Resume.pdf",
        linkedin_url="https://www.linkedin.com/in/anthonyjaredwong/",
        github_url="https://github.com/anthonyjwong",
        current_location="Danville, California, United States",
        desired_location="New York, NY",
        work_mode_ranking=["hybrid", "onsite", "remote"],
    )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
