# Job Applications – Scraper, API, and UI

This is a personal project to find jobs, review fit, scrape application questions, prepare answers with AI, and submit applications. It includes a FastAPI backend and a Next.js frontend.

The main motivation behind this project is to help faciliate my job search while also renewing my technical skills. My updated resume can be found here: [View my resume (PDF)](backend/AJ%20Wong%27s%20Resume.pdf)

## Tech stack

- Backend
  - Python 3.12, FastAPI, Uvicorn
  - PostgreSQL + SQLAlchemy ORM, Alembic migrations
  - Playwright (browser automation) and BeautifulSoup for scraping
  - OpenAI Python SDK for initial application answers
- Frontend
  - Next.js 15, React 19, TypeScript 5
  - Tailwind CSS 4
- Orchestration & Dev
  - Docker
  - Go (scheduler service)

## Environment variables

Create a `.env` at repo root with at least:

- Database
  - `DB_HOST=localhost`
  - `DB_PORT=5432` (or use `DB_PORT_HOST` mapping in compose)
  - `DB_USER=postgres`
  - `DB_PASSWORD=postgres`
  - `DB_NAME=jobs`
- OpenAI
  - `OPENAI_API_KEY=...`
- LinkedIn automation
  - `LINKEDIN_CLIENT_ID=your_login_email`
  - `LINKEDIN_CLIENT_SECRET=your_password`
- Optional
  - `DB_PORT_HOST=5433` (host port mapping to avoid local conflicts)
  - `MAX_CONCURRENT_TASKS=8`

The LinkedIn scraper persists auth state at `backend/.db/playwright_storage/linkedin.json` so you don’t have to log in every run.

## Quick start (Docker Compose)
`make dev`

- Open the API docs: http://localhost:8000/docs
- Open the UI: http://localhost:3000

## Common workflows

- Find jobs: POST `/jobs/find`
- Review job: POST `/job/{job_id}/review`
- Create application: POST `/job/{job_id}/create_app`
- Prepare application: POST `/app/{app_id}/prepare`
- Approve application: POST `/app/{app_id}/approve`
- Submit application: POST `/app/{app_id}/submit`
- Batch helpers: `/apps/create`, `/apps/prepare`, `/apps/submit`

Note: LinkedIn occasionally triggers checkpoints/CAPTCHAs. The scraper detects this and may require a one-time manual login. Running a first login in non-headless mode helps establish a durable session; subsequent runs reuse the stored auth state.
