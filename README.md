# Shyam & Salim Learn ML

> Do dost. Ek chai. Aur Machine Learning.

An immersive, story-driven ML learning platform: every lesson is a Sunday conversation between two
childhood friends, Shyam and Salim, who take turns teaching each other. Built with Next.js (App
Router), TypeScript, MUI, and MongoDB.

This README covers local setup. See `docs/architecture.md` for the system design and `docs/adr/`
for the reasoning behind major technical decisions. `SECURITY.md` (added in Phase 3) will hold the
security checklist.

## Status

This repository is being built in phases (see the project task list). **Phase 1 is complete**:
project scaffold, TypeScript strict config, centralized MUI theme (light/dark, CSS variables),
MongoDB connection singleton, environment validation, root + public layouts, and base error/SEO
scaffolding (404, global error boundary, robots.txt). Authentication, the content model, the admin
CMS and the full public reading experience land in later phases and are not yet functional.

## Prerequisites

- Node.js 20.9 or later
- npm 10 or later
- A MongoDB instance (local `mongod`, Docker, or MongoDB Atlas)

## Getting started

```bash
npm install
cp .env.example .env.local
# edit .env.local — at minimum set MONGODB_URI and AUTH_SECRET
npm run dev
```

The app starts at http://localhost:3000. The health check at `/api/health` confirms the database
connection is reachable.

Generate a strong `AUTH_SECRET`:

```bash
openssl rand -base64 48
```

## Scripts

| Script                | Purpose                                              |
| ---------------------- | ----------------------------------------------------- |
| `npm run dev`          | Start the Next.js dev server                         |
| `npm run build`        | Production build                                     |
| `npm run start`        | Serve a production build                             |
| `npm run typecheck`    | `tsc --noEmit` (strict mode)                          |
| `npm run lint`         | ESLint (`next/core-web-vitals` + TypeScript + a11y)  |
| `npm run format`       | Prettier write                                       |
| `npm run test`         | Vitest unit/integration tests                        |
| `npm run test:e2e`     | Playwright end-to-end tests                           |
| `npm run seed`         | Seed development content (series/module/episode) — Phase 2 |
| `npm run seed:admin`   | One-time bootstrap of the first admin account — Phase 3     |
| `npm run validate`     | typecheck + lint + unit tests, in that order          |

## Project structure

```
src/
  app/            Next.js App Router routes
    (public)/     Public site route group (home, series, episodes, ...)
    (auth)/       Admin login route group (Phase 3)
    admin/        Protected admin dashboard (Phase 3/4)
    api/          Route handlers
  components/     Presentational, reusable UI (ui/, layout/, episode/, story/, admin/)
  features/       Feature-oriented domain logic (auth/, episodes/, series/, modules/, search/)
  lib/            Cross-cutting infrastructure (auth/, db/, validation/, security/, seo/, utilities/)
  models/         MongoDB document shapes + Zod schemas (Phase 2)
  repositories/   Data-access layer — the only code that talks to MongoDB collections directly
  services/       Business logic that orchestrates repositories (publishing rules, etc.)
  theme/          Centralized MUI theme, design tokens, ThemeRegistry
  types/          Shared TypeScript types
```

The boundary that matters most: **route handlers and Server Actions validate input and check
authorization, then delegate to `services/`, which call `repositories/`.** No component or route
talks to the MongoDB driver directly — see `docs/architecture.md`.

## Environment variables

See `.env.example` for the full, documented list. All variables are validated at startup by
`src/lib/env.ts` — the app throws a clear error (not a silent fallback) if something required is
missing or malformed.

## License

Private project.
