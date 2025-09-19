Let's refactor our frontend so that, following good practice in the Next.js App Router, **Server Components are the default and should be your baseline.** Add `"use client"` only where you genuinely need client-side capabilities. That keeps bundles small, avoids hydration work, and improves TTFB/TTI.

# When to add `"use client"`

* You need **interactivity**: `onClick`, `useState`, `useEffect`, `useRef`, animations tied to the DOM.
* You use **browser-only APIs**: `window`, `localStorage`, `ResizeObserver`, etc.
* You depend on **client-only libraries** (most UI component libs, charting libs, maps, editors).
* You need **client navigation hooks** (`useRouter`, `usePathname`, etc.) beyond what `<Link>` can do.

# Common anti-patterns

* **Putting `"use client"` high in the tree** (e.g., at `app/layout.tsx` or a page wrapper). A Client Component **cannot import** a Server Component, so this forces large subtrees to ship JS.
* **Fetching data in Client Components** when it can happen on the server (causes waterfalls and larger bundles).
* **Using client hooks just for convenience** (e.g., reading URL with `usePathname` when you could pass it from a server parent).

# Practical pattern (islands)

* Keep pages/layouts **Server Components**.
* Create small **leaf Client Components** for interactive bits.
* Do data fetching and heavy computation in **Server Components**; pass the results down as props.
* Use **Server Actions** for mutations to avoid writing ad-hoc client API calls.

# Quick checklist

* Can this be **server-rendered** with no interactivity? → Keep it server.
* Is only a **small part** interactive? → Make just that part a client island.
* Does a third-party UI lib force client? → Wrap it in a small client wrapper; keep parents server.
* Are you tempted to put `"use client"` in **layout/page**? → Try not to; push it down.
* Can a **Server Action** replace an XHR/fetch from the browser? → Use it.

## Analytics Refactor Notes (Do This Next Time)

- Server-first structure:
	- Keep `app/*/page.tsx` and `app/*/layout.tsx` as Server Components.
	- Put charting and other client-only dependencies into small leaf islands (e.g., `components/AnalyticsCharts.tsx`).

- Fetch on the server:
	- Do data fetching in Server Components or Server Actions. Avoid fetching in client components when not required.
	- When calling our own API routes from the server, use `fetch('/api/...',{cache:'no-store'})` or resolve the absolute URL via `next/headers` if needed. Prefer calling shared server utilities directly when available.
	- Define and reuse response types in `lib/types.ts` (e.g., `AnalyticsData`) to keep props stable and serializable.

- Serializable boundaries only:
	- Do NOT pass React elements/classes/functions across the Server → Client boundary. That includes Lucide icon components, event handlers, Dates, etc.
	- Instead, pass serializable data (strings, numbers, arrays, objects). For icons, pass an `iconName` string and map it to the actual icon inside the client component.
	- Example: `StatsCard` now accepts `iconName` and resolves Lucide icons internally instead of receiving an icon component from the server.

- Client islands best practices:
	- Keep island props minimal and serializable (e.g., chart data arrays, labels, colors).
	- Avoid leaking client-only imports upward. Parent server components should import only server-safe modules.
	- Keep island files annotated with `"use client"` and colocate any browser APIs within.

- Common pitfalls we hit (avoid):
	- Passing icon components from server to client components. Fix: use `iconName` and a client-side map.
	- Fetching analytics in a Client Component with `useEffect`. Fix: fetch on the server and pass data as props.
	- Adding `"use client"` at page/layout level, which forces large subtrees to ship JS.

### Mini checklist before committing a refactor

- Pages and layouts are server by default; only leaf components have `"use client"`.
- All props crossing server→client are JSON-serializable (no functions, class instances, or components).
- Third-party UI libs (charts, editors, maps) are isolated in small client wrappers.
- Data fetching is on the server; types live in `lib/types.ts` and are used at the boundary.
- Run a build to catch RSC boundary issues:
	- `pnpm -C frontend build`
	- Look for messages about “Client Component cannot be used in a Server Component”, or serialization errors.

### Pattern snippets

- Serializable icon prop

```ts
// Server Component (page)
<StatsCard title="Interview Rate" value="50%" iconName="target" />

// Client Component (island)
// stats-card.tsx
"use client";
import { Target, Users, Brain, Zap, Star, TrendingUp, type LucideIcon } from "lucide-react";
const ICONS: Record<
	"target" | "users" | "brain" | "zap" | "star" | "trending-up",
	LucideIcon
> = { target: Target, users: Users, brain: Brain, zap: Zap, star: Star, "trending-up": TrendingUp };
```

- Client island for charts

```ts
// components/AnalyticsCharts.tsx
"use client";
// import Recharts... export small components that accept plain data arrays
```

- Typed server fetch

```ts
// lib/types.ts
export interface AnalyticsData { /* ... */ }

// app/analytics/page.tsx (server component)
const res = await fetch("/api/analytics", { cache: "no-store" });
const analytics: AnalyticsData = await res.json();
```

## Home Refactor Notes

- Server-first page:
	- `app/page.tsx` is a Server Component that fetches interviews, assessments, and applications via route handlers using `headers()` to build the base URL and `{ cache: "no-store" }`.
	- Computes serializable `stats` (totals, category counts, success rates, weekly goal progress) on the server.

- Client island:
	- `components/HomeInteractive.tsx` holds all interactivity: opening the Add Application modal, optimistic list updates, and UI that uses Lucide/shadcn.
	- Accepts only serializable props: arrays of entities and a plain `stats` object.

- Server Actions:
	- `app/actions.ts` exposes `createApplicationAction(application)` to create new applications server-side and `revalidatePath('/')` and `/applications`.
	- The island calls the action directly instead of ad-hoc client fetches.

- RSC boundary hygiene:
	- No client-only imports in `app/page.tsx`; icons and UI libs live in the island.
	- Avoid passing functions/elements across the boundary; pass JSON only.

- Quick checks before commit:
	- Build with `pnpm -C frontend build` and verify `/` compiles as an RSC with a small island.
	- Confirm no “Client Component cannot be used in a Server Component” or serialization errors.


## Jobs Refactor Notes

- Server-first page:
  - `app/jobs/page.tsx` remains a Server Component. It fetches jobs and saved IDs on the server (`cache: "no-store"`) and passes plain props to a client island.

- Small client islands:
  - `components/JobsView.tsx` owns interactivity (search, filters, save/apply) and rendering the list. It does not perform the initial data fetch.
  - `components/JobsFilters.tsx` is a separate filters island to keep `JobsView` lean and reduce re-renders.

- Mutations via Server Actions:
  - `app/jobs/actions.ts` exposes `applyToJob`, `saveJobAction`, and `unsaveJobAction`. `JobsView` calls these directly instead of ad-hoc client fetches.
  - Actions revalidate the `/jobs` path to keep server-rendered state aligned on navigation/refresh.

- Optimistic UI:
  - `JobsView` uses optimistic updates for save/unsave with rollback on error and user toasts for feedback.

- Serialization boundaries:
  - Only serializable data crosses server→client. No React elements, functions, or Dates are passed as props.

- Pitfalls to avoid next time:
  - Do not pass Lucide icon components across the boundary; use them only inside client islands.
  - After extracting `JobsFilters`, ensure all old inline filter JSX is removed to avoid duplicate/mismatched JSX.

- Verify with build:
  - Run `pnpm -C frontend build` to catch RSC boundary and JSX issues early.
