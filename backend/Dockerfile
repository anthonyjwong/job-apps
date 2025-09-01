## Base Python for building wheels
FROM python:3.12-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
	PYTHONUNBUFFERED=1 \
	PIP_NO_CACHE_DIR=1 \
	POETRY_VIRTUALENVS_CREATE=false

RUN apt-get update && apt-get install -y --no-install-recommends \
	curl \
	ca-certificates \
	git \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

## Dependencies layer
FROM base AS deps
COPY requirements.txt .
RUN pip install --upgrade pip \
 && pip install -r requirements.txt

# Install Playwright browsers only if required by code
RUN python - <<'PY'
import os, pkgutil
need_pw = pkgutil.find_loader('playwright') is not None
print('playwright-present=', need_pw)
PY
# Install browsers in a separate layer to cache
RUN python -c "import pkgutil; import subprocess; \
import sys; \
sys.exit(0) if not pkgutil.find_loader('playwright') else subprocess.check_call(['python','-m','playwright','install','--with-deps'])"

## Final runtime image
FROM python:3.12-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 \
	PYTHONUNBUFFERED=1
WORKDIR /app

# Copy installed site-packages and binaries
COPY --from=deps /usr/local /usr/local

# Copy app code
COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]