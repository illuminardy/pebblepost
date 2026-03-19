# PebblePost URL Shortener - Implementation Spec

## Overview

A URL shortener with click analytics, built as a monorepo with an Express/Prisma/TypeScript backend and a Vite/React/TypeScript frontend, orchestrated via Docker Compose.

---

## Decisions Log

| Decision | Choice | Rationale |
|---|---|---|
| Database | PostgreSQL 16 | Closer to production; relational with strong indexing support |
| Authentication | None | Intentional simplification; documented in README |
| Redirect status | 302 Temporary | Ensures every click hits the server for accurate analytics |
| CRUD scope | Full CRUD (soft delete) | Create, read, update, and soft-delete with `deletedAt` flag |
| Link expiration | Yes, optional per link | `expiresAt` field; expired links return 410 Gone |
| Frontend framework | Vite + React (SPA) | Lightweight, fast DX |
| Backend framework | Express | Widely known, large ecosystem |
| ORM | Prisma | Type-safe client, auto-generated, built-in migrations |
| Testing | Vitest + supertest | Fast, Vite-native, Jest-compatible API |
| Slug format | Alphanumeric + hyphens, lowercase | 3-30 chars; no leading/trailing/consecutive hyphens |
| Auto-generated slug | 8 chars, `[a-z0-9]` | ~2.8 trillion combinations; collision retry up to 3x |
| Case sensitivity | Normalized to lowercase | Avoids user confusion between `Foo` and `foo`; documented as design decision |
| Analytics parsing | UA parsed into browser/OS/device | Uses `ua-parser-js`; raw user-agent also stored |
| Date range filtering | Preset ranges: 7d, 30d, 90d | Default: 30d |
| Charting | Recharts | Popular, React-native, simple API (not yet implemented) |
| Repo structure | Monorepo: `/backend` + `/frontend` | Single `docker compose up` brings everything up |
| Seed data | 4 links, ~50 clicks over 14 days | Includes one expired link for testing |
| Infrastructure | Docker Compose | Postgres + backend + frontend; single command startup |

---

## Architecture

```
Browser ──► Frontend (Vite :5173) ──proxy──► Backend (Express :3000) ──► PostgreSQL (:5432)
                                              │
User ──► GET /:slug ──────────────────────────┘ (302 redirect + async click recording)
```

### Monorepo Structure

```
pebblepost/
├── docker-compose.yml
├── docs/
│   ├── project_brief.md
│   ├── llms.md
│   └── SPEC.md              ← this file
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma    # Link + ClickEvent models
│   │   └── seed.ts          # 4 links, 50 click events
│   └── src/
│       ├── index.ts          # Express app entry
│       ├── lib/
│       │   ├── prisma.ts     # Prisma client singleton
│       │   ├── slug.ts       # Slug generation (crypto.randomBytes)
│       │   └── ua-parser.ts  # UA parsing wrapper
│       ├── schemas/
│       │   ├── link.schema.ts       # Zod: createLinkSchema
│       │   └── analytics.schema.ts  # Zod: analyticsQuerySchema
│       ├── middleware/
│       │   ├── error-handler.ts     # AppError class + global handler
│       │   └── validate.ts          # validateBody / validateQuery
│       ├── services/
│       │   ├── link.service.ts      # createLink, getLinks, getLinkBySlug, getLinkById
│       │   └── analytics.service.ts # recordClick, getAnalytics
│       └── routes/
│           ├── links.ts       # POST + GET /api/v1/links
│           ├── analytics.ts   # GET /api/v1/links/:id/analytics
│           └── redirect.ts    # GET /:slug
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts        # Proxy /api → backend
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx            # Router: / and /links/:id
        ├── api/
        │   └── client.ts     # Typed fetch wrapper + API types
        └── pages/
            ├── LinksPage.tsx       # Create form + links table
            └── LinkDetailPage.tsx  # Analytics: daily, browser, OS, device
```

---

## Database Schema

Two tables: `links` and `click_events`.

- **links**: `id` (UUID PK), `slug` (unique), `target_url`, `expires_at` (nullable), `created_at`
- **click_events**: `id` (UUID PK), `link_id` (FK → links), `timestamp`, `user_agent`, `browser`, `os`, `device`

Indexes:
- `links.slug` — unique index for O(1) redirect lookups
- `click_events(link_id, timestamp)` — composite index for per-link date-range queries
- `click_events(timestamp)` — for global date-range queries

---

## API Endpoints

Base path: `/api/v1` (except redirect).

### POST /api/v1/links

Creates a short link. Validates body with Zod.

- **Body**: `{ url: string, slug?: string, expiresAt?: string }`
- **Response**: `{ data: Link }` (201)
- **Errors**: 400 (validation), 409 (slug taken)

### GET /api/v1/links

Lists all links with click counts, newest first.

- **Response**: `{ data: Link[] }` (200)

### GET /api/v1/links/:id/analytics

Returns click analytics for a link within a date range.

- **Query**: `?range=7d|30d|90d` (default: 30d)
- **Response**: `{ data: { totalClicks, dailyClicks[], browserBreakdown[], osBreakdown[], deviceBreakdown[] } }`
- **Errors**: 404 (link not found)

### GET /:slug

Redirects to the target URL. Records click asynchronously.

- **Response**: 302 redirect
- **Errors**: 404 (not found), 410 (expired)

### Response Shape

```
Success: { data: T }
Error:   { error: { code: string, message: string } }
```

---

## Implementation Status

### Completed

- [x] Monorepo scaffold (docker-compose.yml, backend/, frontend/, configs)
- [x] Prisma schema (Link, ClickEvent) with indexes
- [x] Seed script (4 links, 50 click events over 14 days, idempotent)
- [x] `POST /api/v1/links` with Zod validation, slug generation, collision retry
- [x] `GET /api/v1/links` with click counts
- [x] `GET /:slug` with 302 redirect, expiration check, fire-and-forget click recording
- [x] `GET /api/v1/links/:id/analytics` with daily aggregation, browser/OS/device breakdowns, preset date ranges
- [x] User-agent parsing via `ua-parser-js`
- [x] Global error handler (AppError, ZodError, unhandled) with consistent response shape
- [x] Zod validation middleware (validateBody, validateQuery)
- [x] Frontend: Links page with create form + links table + empty state + error handling
- [x] Frontend: Link detail page with analytics, daily breakdown, browser/OS/device lists, range selector
- [x] Frontend: API client with typed fetch wrapper
- [x] Docker Compose: Postgres 16 + backend + frontend, single-command startup
- [x] Database auto-setup on startup (`prisma db push` + seed)
- [x] All endpoints verified via curl

- [x] Integration tests (Vitest + supertest): redirect 302/404/410, click recording, analytics aggregation, range filtering, validation (16 tests passing)
- [x] README with architecture diagram, tech stack, API reference, design decisions, simplifications, scaling notes
- [x] Recharts integration: responsive bar chart for daily clicks on analytics page
- [x] UI redesign: CSS-based styling with dark header, card layout, status badges, form validation feedback, success state
- [x] Frontend component extraction: CreateLinkForm, LinksTable, ClicksChart, AnalyticsSummary
- [x] Express app refactored to separate app.ts (testable) from index.ts (server startup)

### Deferred

- [ ] **Pagination** — GET /api/v1/links currently returns all links; add cursor or offset pagination
- [ ] **Proper Prisma migrations** — Currently using `prisma db push`; switch to `prisma migrate` for production-grade schema management

### Out of Scope (Documented Simplifications)

- No authentication or authorization
- No rate limiting or abuse prevention
- No pagination on links list
- No CDN or edge caching for redirects
- No queue-based click ingestion (Kafka, etc.)
- No materialized views or time-series DB for analytics at scale

---

## How to Run

```bash
docker compose up --build
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api/v1/links
- **Short URLs**: http://localhost:3000/:slug
