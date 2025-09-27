FROM mcr.microsoft.com/playwright/python:v1.55.0-noble

ENV POETRY_VERSION=2.2.0 \
    POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_CREATE=0 \
    POETRY_CACHE_DIR=/tmp/poetry_cache \
    PIP_NO_CACHE_DIR=1

RUN pip install --no-cache-dir "poetry==${POETRY_VERSION}"

WORKDIR /app

# Copy only dependency manifests first for caching
COPY pyproject.toml poetry.lock* ./

# Install dependency tree only (no project package) for maximum cache reuse
RUN touch README.md && poetry install --without dev --no-root && rm -rf "$POETRY_CACHE_DIR"

# LLM prompts
COPY ./.instructions ./.instructions

# Alembic config & migrations
COPY alembic.ini ./
COPY ./migrations ./migrations

# Resume asset (temporary until external storage) 
ARG resume="AJ Wong's Resume.pdf"
COPY ${resume} ./

# Copy application source
COPY ./app ./app

# Install project itself (lightweight, just creates entry points & metadata)
RUN poetry install --only-root && rm -rf "$POETRY_CACHE_DIR"

# Ensure files owned by non-root user
RUN chown -R pwuser:pwuser /app

# necessary for healthcheck to work (combine update & install, then clean)
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Switch to non-root user
USER pwuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]