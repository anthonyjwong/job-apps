# Feature → Endpoints → Islands Map

This map shows which server pages fetch which endpoints, which client islands they render, and what mutations occur via server actions.

## Home (`/`)
- Server fetch: `GET /api/interviews`, `GET /api/assessments`, `GET /api/applications`
- Island: `components/HomeInteractive.tsx`
- Mutations: `createApplicationAction(application)` → `POST /api/applications` and revalidate `/` and `/applications`

## Jobs (`/jobs`)
- Server fetch: `GET /api/jobs`, `GET /api/saved-jobs`
- Islands: `components/JobsView.tsx`, `components/JobsFilters.tsx`
- Mutations (server actions):
  - `applyToJob(payload)` → `POST /api/applications` (creates application), revalidate `/applications`
  - `saveJobAction(jobId)` → `POST /api/saved-jobs`, revalidate `/jobs`
  - `unsaveJobAction(jobId)` → `DELETE /api/saved-jobs?jobId=...`, revalidate `/jobs`

## Applications (`/applications`)
- Server fetch: `GET /api/applications`
- Island: `components/ApplicationsView.tsx`

## Analytics (`/analytics`)
- Server fetch: `GET /api/analytics`
- Islands: `components/AnalyticsCharts.tsx` and UI cards (e.g., `StatsCard.tsx`)

## Settings (`/settings`)
- Server fetch: `GET /api/user/settings`
- Island: `components/SettingsView.tsx`
- Mutations (server actions):
  - `saveProfile(profile)` → `PATCH /api/user/settings`
  - `saveNotifications(notifications)` → `PATCH /api/user/settings`
  - `savePreferences(preferences)` → `PATCH /api/user/settings`
  - `savePrivacy(privacy)` → `PATCH /api/user/settings`
  - All revalidate `/settings`

## Notifications (header dropdown)
- Client reads from server-provided lists on pages or fetches server-rendered data
- API: `GET /api/notifications`, `PATCH /api/notifications` (e.g., mark all read), `DELETE /api/notifications?id=...`
