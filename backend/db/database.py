import os

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DB_USER = os.environ.get("DB_USER", "postgres")
DB_PASSWORD = os.environ.get("DB_PASSWORD")
DB_HOST = os.environ.get("DB_HOST")
DB_PORT = os.environ.get("DB_PORT", "5432")
DB_NAME = os.environ.get("DB_NAME", "job_apps")

SQLALCHEMY_DATABASE_URL = (
    f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

# Connection pool settings (tunable via environment)
POOL_SIZE = int(os.environ.get("DB_POOL_SIZE", "10"))
MAX_OVERFLOW = int(os.environ.get("DB_MAX_OVERFLOW", "20"))
POOL_TIMEOUT = int(os.environ.get("DB_POOL_TIMEOUT", "30"))  # seconds
POOL_RECYCLE = int(os.environ.get("DB_POOL_RECYCLE", "1800"))  # seconds

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,  # validate connections before use
    pool_size=POOL_SIZE,
    max_overflow=MAX_OVERFLOW,
    pool_timeout=POOL_TIMEOUT,
    pool_recycle=POOL_RECYCLE,
)
# Avoid expiring attributes on commit so objects can be safely read post-commit
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
    bind=engine,
)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
