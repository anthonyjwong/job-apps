# Types & Serialization Boundaries

- Boundary types live in `lib/types.ts` and define the JSON shapes exchanged across server↔client.
- Do not pass Dates or class instances; pass strings (e.g., ISO dates) and parse on the client if needed.
- UI-specific types stay in islands; shared domain types (Application, Job, Interview, Assessment, SavedJob, AnalyticsData, UserSettings) are reusable.

## Core Types

- Applications: `Application`, `NewApplication`, `ApplicationStatus`.
- Jobs: `Job`, `JobClassification`, `SavedJob`.
- Scheduling: `Interview`, `Assessment`.
- Analytics: `AnalyticsData` and subtypes.
- Settings: `UserSettings` with `UserProfileSettings`, `UserNotificationSettings`, `UserPreferenceSettings`, `UserPrivacySettings`.

## Icon Passing

- Pass `iconName: string` from server to client and map to Lucide icons client-side to avoid RSC boundary issues.
