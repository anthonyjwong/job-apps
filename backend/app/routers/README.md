# API Routing Plan

This document outlines the endpoints available in the backend.

## Global
- Base prefix: `/api/v1`
- Common patterns:
  - Pagination: `?page=1&page_size=25`
  - Sorting: `?sort=created_at:desc` (field whitelist)
  - Filtering via query params (state/status/date/company/search)
- All long-running operations return `{ task_id }` and are polled via `/api/v1/tasks/{task_id}`.

## Routers

### Core (`app/routers/core.py`)
- `GET /api/v1/health` — basic health
- `GET /api/v1/version` — version/build info
- `GET /api/v1/tasks/{task_id}` — Celery task status

### Jobs (`app/routers/jobs.py`)
- `GET /api/v1/jobs` — list jobs (filters: `state`, `classification`, `company`, `search`, `min_date`, `max_date`, pagination, sort)
- `GET /api/v1/jobs/{job_id}` — get job details
- `PATCH /api/v1/jobs/{job_id}` — update fields (state/classification/action)
- `POST /api/v1/jobs/refresh` — enqueue job discovery (`get_new_jobs_task`)
- `POST /api/v1/jobs/{job_id}/review` — enqueue job review (`evaluate_job_task`)
- `POST /api/v1/jobs/{job_id}/expire-check` — enqueue expiration check (`check_if_job_still_exists_task`)
- `POST /api/v1/jobs/{job_id}/application` — enqueue scraping/creation of application form (`create_app_task`)

### Applications (`app/routers/applications.py`)
- `GET /api/v1/applications` — list applications (filters: `status`, `form_state`, `company`, `min_date`, `max_date`)
- `GET /api/v1/applications/{app_id}` — get app details
- `PATCH /api/v1/applications/{app_id}` — approve/discard/acknowledge/status transitions
- `GET /api/v1/applications/{app_id}/form` — read form (questions/answers)
- `PATCH /api/v1/applications/{app_id}/form` — update answers
- `POST /api/v1/applications/{app_id}/prepare` — enqueue preparation (`prepare_application_task`)
- `POST /api/v1/applications/{app_id}/submit` — enqueue submission (`submit_application_task`)

### Users (`app/routers/users.py`)
- `GET /api/v1/users/me` — get candidate profile used for LLM/app filling
- `PUT /api/v1/users/me` — update profile

### Bulk (`app/routers/bulk.py`)
- `POST /api/v1/bulk/jobs/review` — review jobs in bulk
- `POST /api/v1/bulk/jobs/expire` — check job expirations in bulk
- `POST /api/v1/bulk/jobs/application` - create applications for jobs in bulk
- `POST /api/v1/bulk/applications/prepare` — prepare apps in bulk
- `POST /api/v1/bulk/applications/submit` — submit apps in bulk

### Data (`app/routers/data.py`)
- `GET /api/v1/data/summary` — summary stats for dashboards
- `GET /api/v1/data/analytics` — time series / funnel metrics
- `GET /api/v1/data/exports/{kind}` — export CSV/JSON (jobs, applications)
