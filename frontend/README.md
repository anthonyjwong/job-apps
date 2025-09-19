# TechJobs Platform

A Next.js application for AI-powered job search and career development platform.

## Features

- **AI-Powered Job Classification**: Automatically categorizes jobs into Safety, Target, Reach, and Dream categories based on interview likelihood
- **Smart Action Recommendations**: Provides specific, actionable advice for each job application
- **Interview-Focused Dashboard**: Track applications, interviews, and career progression
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark/Light Theme**: Customizable theme preferences

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS v4 with custom design tokens
- **UI Components**: shadcn/ui component library
- **Icons**: Lucide React
- **Charts**: Recharts
- **TypeScript**: Full type safety

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with theme provider
│   ├── page.tsx          # Homepage (Dashboard)
│   ├── jobs/page.tsx     # Job Discovery page
│   ├── analytics/page.tsx # Analytics page
│   ├── applications/page.tsx # Applications page
│   └── settings/page.tsx # Settings page
├── components/            # Reusable React components
│   ├── ui/               # shadcn/ui components
│   ├── Dashboard.tsx     # Main dashboard component
│   ├── JobDiscovery.tsx  # Job discovery with AI classification
│   ├── Header.tsx        # Navigation header
│   └── ...              # Other components
└── styles/
    └── globals.css       # Global styles and design tokens
```

## Features Overview

### AI Job Classification
- **Safety Jobs** (80%+ interview rate): High likelihood opportunities
- **Target Jobs** (60-80% interview rate): Good fit positions
- **Reach Jobs** (30-60% interview rate): Stretch opportunities
- **Dream Jobs**: Career aspirations and growth targets

### AI Action Recommendations
Each job includes specific, actionable advice to improve your chances:
- Portfolio improvements
- Skill highlighting strategies
- Experience positioning
- Technical preparation tips

## Development

The platform is built with modern React patterns and Next.js best practices:

- **Client Components**: Interactive components use `'use client'` directive
- **Server Components**: Default server-side rendering for performance
- **Type Safety**: Full TypeScript implementation
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## License

Private project for TechJobs platform development.

## Docs

For architecture patterns, server actions, types, and full API endpoint references, see `./.docs`:

- `./.docs/README.md` (index)
- `./.docs/patterns.md` (server-first + islands)
- `./.docs/server-actions.md` (mutations + revalidation)
- `./.docs/types-and-boundaries.md` (shared types + serialization)
- `./.docs/endpoints/` (per-route request/response JSON)