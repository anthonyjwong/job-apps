# Prompting Cheatsheet (LLMs)

- When adding a new feature:
  - Keep the page a Server Component; create a small client island for interactivity only.
  - Define/extend boundary types in `lib/types.ts`.
  - Fetch data on the server via route handlers or shared server utilities.
  - For mutations, add a server action in the relevant route (e.g., `app/feature/actions.ts`) and call it from the island.

- When integrating a third-party UI lib (charts/editors/maps):
  - Wrap it in a client island and pass JSON-only props from the server.

- When defining an endpoint:
  - Check existing shapes in `.docs/endpoints/*` and align types.
  - Ensure GET returns a stable JSON shape; POST/PATCH return the created/updated entity and a message.

- When you see RSC violations:
  - Remove client-only imports from server files; move to islands.
  - Replace passing components across the boundary with `iconName` strings or plain data.

- Revalidation:
  - After mutations, call `revalidatePath` for dependent pages to keep server-rendered state fresh.
