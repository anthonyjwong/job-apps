# Server Actions

- Use server actions for mutations instead of ad-hoc client fetches.
- Pattern:
  - `"use server"` at top of the file.
  - Build base URL via `headers()` to support local and deployed environments.
  - Perform `fetch` to internal API or call shared server utilities directly.
  - On success, `revalidatePath` for pages that depend on the mutated data.

## Examples

- Applications: `app/actions.ts#createApplicationAction` (POST `/api/applications`, revalidates `/` and `/applications`).
- Jobs: `app/jobs/actions.ts` (`applyToJob`, `saveJobAction`, `unsaveJobAction`, revalidate `/jobs` and `/applications`).
- Settings: `app/settings/actions.ts` (`saveProfile`, `saveNotifications`, `savePreferences`, `savePrivacy`, revalidate `/settings`).

## Error Handling

- Return `{ success: boolean, message?: string }` to islands for toast/UI feedback.
- Catch network errors; avoid throwing in client path where it would crash the island.
