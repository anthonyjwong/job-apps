FROM mcr.microsoft.com/playwright/python:v1.55.0-noble

ENV POETRY_VERSION=2.2.0 \
    POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_CREATE=0 \
    POETRY_CACHE_DIR=/tmp/poetry_cache \
    PIP_NO_CACHE_DIR=1

RUN pip install --no-cache-dir "poetry==${POETRY_VERSION}"

WORKDIR /app

# Create non-root user and group
RUN addgroup --system app && adduser --system --ingroup app app \
    && mkdir -p /app \
    && chown -R app:app /app

# Install deps first for better caching
COPY pyproject.toml poetry.lock* ./

# Copy application code
COPY ./app ./app

RUN touch README.md && poetry install --without dev && rm -rf "$POETRY_CACHE_DIR"

# Copy LLM prompts
COPY ./.instructions ./.instructions

# Copy Alembic files
COPY alembic.ini ./
COPY ./migrations ./migrations

# Copy resume over, should be removed later when file storage is implemented
ARG resume="AJ Wong's Resume.pdf"
COPY ${resume} ./

# Ensure files owned by non-root user
RUN chown -R app:app /app

# necessary for healthcheck to work
RUN apt-get update && apt-get install -y curl

# Switch to non-root user
USER app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]