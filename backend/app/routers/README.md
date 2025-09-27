# API Routing Plan

This document outlines the endpoints available in the backend.

## Global
- Common patterns:
  - Pagination: `?page=1&page_size=25`
  - Sorting: `?sort=created_at:desc` (field whitelist)
  - Filtering via query params (state/status/date/company/search)
- All long-running operations return `{ task_id }` and are polled via `/tasks/{task_id}`.

## Routers

### Core (`app/routers/core.py`)
- `GET /health` — basic health
- `GET /version` — version/build info
- `GET /tasks/{task_id}` — Celery task status

### Jobs (`app/routers/jobs.py`)
- `GET /jobs` — list jobs (filters: `state`, `classification`, `company`, `search`, `min_date`, `max_date`, pagination, sort)
- `GET /jobs/{job_id}` — get job details
- `PATCH /jobs/{job_id}` — update fields (state/classification/action)
- `POST /jobs/refresh` — enqueue job discovery (`get_new_jobs_task`)
- `POST /jobs/{job_id}/review` — enqueue job review (`evaluate_job_task`)
- `POST /jobs/{job_id}/expire-check` — enqueue expiration check (`check_if_job_still_exists_task`)
- `POST /jobs/{job_id}/application` — enqueue scraping/creation of application form (`create_app_task`)

### Applications (`app/routers/applications.py`)
- `GET /applications` — list applications (filters: `status`, `form_state`, `company`, `min_date`, `max_date`)
- `GET /applications/{app_id}` — get app details
- `PATCH /applications/{app_id}` — approve/discard/acknowledge/status transitions
- `GET /applications/{app_id}/form` — read form (questions/answers)
- `PATCH /applications/{app_id}/form` — update answers
- `POST /applications/{app_id}/prepare` — enqueue preparation (`prepare_application_task`)
- `POST /applications/{app_id}/submit` — enqueue submission (`submit_application_task`)

### Users (`app/routers/users.py`)
- `GET /users/me` — get candidate profile used for LLM/app filling
- `PUT /users/me` — update profile

### Bulk (`app/routers/bulk.py`)
- `POST /bulk/jobs/review` — review jobs in bulk
- `POST /bulk/jobs/expire` — check job expirations in bulk
- `POST /bulk/jobs/application` - create applications for jobs in bulk
- `POST /bulk/applications/prepare` — prepare apps in bulk
- `POST /bulk/applications/submit` — submit apps in bulk

### Data (`app/routers/data.py`)
- `GET /data/summary` — summary stats for dashboards
- `GET /data/analytics` — time series / funnel metrics
- `GET /data/exports/{kind}` — export CSV/JSON (jobs, applications)
