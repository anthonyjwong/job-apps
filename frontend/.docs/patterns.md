# Server-First Patterns

- Baseline: pages and layouts are Server Components. Add `"use client"` only where interactivity or browser-only libs are required.
- Islands: Keep client-only functionality in small leaf components that accept JSON-serializable props.
- Data fetching: Do on the server (`headers()` + absolute URL) with `{ cache: "no-store" }` for dynamic data.
- Serialization: Never pass functions, class instances, Dates, or React elements across server→client. Use strings, numbers, arrays, plain objects.
- Third-party libs: Wrap charts, maps, and UI libs in client islands; do not import them in server parents.
- Icons: Pass `iconName` strings from server to client; resolve to actual icons in the client component.
- Types: Centralize boundary types in `lib/types.ts` and reuse across pages and islands.

## Checklists

- Page remains server by default; only leaf components have `"use client"`.
- Props to islands are JSON-serializable.
- Server Actions handle mutations and call `revalidatePath`.
- Fetch from server with `headers()` to build base URL, or call internal server utilities.
- Run builds to catch RSC boundary issues when refactoring.

## Example

- Server page computes stats and fetches JSON, then renders a client island with plain props.
- Client island imports shadcn/lucide/recharts and manages interactivity.
