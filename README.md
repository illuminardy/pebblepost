# PebblePost - URL Shortener with Click Analytics

A URL shortener that creates short links, tracks clicks, and displays analytics. Built as a TypeScript monorepo with Express, Prisma, React, and PostgreSQL, orchestrated via Docker Compose.

## Architecture

```mermaid
graph TD
    subgraph compose [Docker Compose]
        FE[Frontend - Vite/React :5173]
        BE[Backend - Express :3000]
        PG[PostgreSQL :5432]
    end

    User -->|"Dashboard"| FE
    FE -->|"/api proxy"| BE
    User -->|"GET /:slug"| BE
    BE -->|"302 Redirect"| Target[Target URL]
    BE --> PG
```

**Data flow for a redirect:**

1. User visits `http://localhost:3000/:slug`.
2. Backend looks up the slug, checks expiration, and responds with a `302` redirect.
3. A click event is recorded asynchronously (fire-and-forget) so the user isn't blocked.
4. The analytics dashboard reads aggregated click data on demand.

## Quick Start

```bash
npm install
docker compose up --build
```

| Service  | URL                                  |
|----------|--------------------------------------|
| Frontend | http://localhost:5173                 |
| API      | http://localhost:3000/api/v1/links    |
| Redirect | http://localhost:3000/:slug           |

The database is auto-initialized on first boot with schema push and seed data (4 links, 50 click events).

### Running Without Docker

To run the backend and frontend independently (requires a running PostgreSQL instance):

```bash
# Backend
cd backend
cp .env.example .env                    # or set DATABASE_URL directly
export DATABASE_URL="postgresql://pebblepost:pebblepost@localhost:5432/pebblepost"
npm install
npx prisma db push                      # initialize schema
npx tsx prisma/seed.ts                  # seed data (optional, skips if data exists)
npm run dev                             # starts on http://localhost:3000
```

```bash
# Frontend (in a separate terminal)
cd frontend
npm install
npm run dev                             # starts on http://localhost:5173
```

The frontend dev server proxies `/api` requests to `http://localhost:3000` via the Vite config.

## Tech Stack

| Layer    | Technology                | Rationale                                                       |
|----------|---------------------------|-----------------------------------------------------------------|
| Language | TypeScript                | Type safety across the full stack                               |
| Backend  | Express 4                 | Widely known, large ecosystem, minimal boilerplate              |
| ORM      | Prisma 6                  | Type-safe client, auto-generated types, built-in migrations     |
| Database | PostgreSQL 16             | Production-grade relational DB with strong indexing              |
| Frontend | React 19 + Vite 6        | Fast development, modern tooling, lightweight SPA               |
| Charts   | Recharts                  | React-native charting, simple declarative API                   |
| Testing  | Vitest + supertest        | Vite-native test runner, Jest-compatible, fast execution        |
| Infra    | Docker Compose            | Single-command startup, reproducible across environments        |

## API Reference

All endpoints return `{ data: T }` on success and `{ error: { code, message } }` on failure.

| Route                              | Method | Description                                                           |
|------------------------------------|--------|-----------------------------------------------------------------------|
| `POST /api/v1/links`              | POST   | Create a short link. Body: `{ url, slug?, expiresAt? }`              |
| `GET /api/v1/links`               | GET    | List all links with click counts, newest first                        |
| `PATCH /api/v1/links/:id`         | PATCH  | Update a link's target URL and/or expiration. Body: `{ url?, expiresAt? }` |
| `DELETE /api/v1/links/:id`        | DELETE | Soft-delete a link (stops redirects, preserves analytics)             |
| `GET /api/v1/links/:id/analytics` | GET    | Click analytics with daily, browser, OS, device breakdowns. Query: `?range=7d\|30d\|90d` |
| `GET /:slug`                       | GET    | 302 redirect to target URL; records click asynchronously              |

### Validation

- **URL**: Must be a valid `http://` or `https://` URL.
- **Slug** (optional): 3-30 characters, lowercase alphanumeric with hyphens. No leading, trailing, or consecutive hyphens.
- **ExpiresAt** (optional): ISO 8601 datetime in the future.
- **Range**: One of `7d`, `30d`, `90d`. Defaults to `30d`.

## Database Schema

Two tables with composite indexes for efficient analytics queries:

- **links** — `id`, `slug` (unique), `target_url`, `expires_at`, `created_at`
- **click_events** — `id`, `link_id` (FK), `timestamp`, `user_agent`, `browser`, `os`, `device`
  - Indexed on `(link_id, timestamp)` for per-link date-range queries
  - Indexed on `(timestamp)` for global date-range queries

## Design Decisions

### Case-insensitive slugs

Slugs are normalized to lowercase on creation and lookup. This avoids user confusion between `/Foo` and `/foo` pointing to different destinations. The trade-off is a slightly smaller slug space (36 vs 62 characters per position).

### 302 Temporary Redirect

Using 302 instead of 301 ensures every click hits the server, which is required for accurate click analytics. With 301, browsers cache the redirect and repeat visits would bypass click recording.

### Fire-and-forget click recording

After sending the 302 response, the server records the click event in a detached Promise. This keeps redirect latency low since the user doesn't wait for the database write. Errors are logged but don't affect the redirect.

### User-Agent parsing

Raw `User-Agent` strings are stored alongside parsed fields (browser, OS, device type) extracted using `ua-parser-js`. This allows both structured analytics and the ability to re-parse if the parsing library improves.

### Auto-generated slugs

Generated using `crypto.randomBytes` with a 36-character lowercase alphanumeric alphabet, 8 characters long (~2.8 trillion combinations). On collision (unique constraint violation), the system retries up to 3 times with a fresh slug.

## Assumptions

- **Single-tenant, single-region deployment** — No multi-tenant isolation or geographic distribution. All users share one database and one backend instance.
- **Moderate data volume** — The click_events table is queried with date-range filters on indexed columns, which is efficient for thousands to low millions of rows. Beyond that, aggregation strategies change (see Next Steps).
- **Trusted users** — No authentication means any user can create, edit, or delete any link. Acceptable for a demo; production would require auth.
- **Same-origin frontend** — The Vite dev server proxies API requests to the backend. In production, both would be behind a reverse proxy or the frontend would be served as static assets from the backend.
- **Stable slug space** — 8-character slugs from a 36-character alphabet (~2.8 trillion combinations) are sufficient. Collision probability is negligible at demo scale; retry logic handles the rare case.

## Intentional Simplifications

These are deliberate scope decisions for an 8-hour implementation window:

- **No authentication or authorization** — All links and analytics are public.
- **No rate limiting** — No abuse prevention on link creation or redirects.
- **No pagination** — The links list endpoint returns all links. Fine for demo scale, but would need cursor-based pagination for production.
- **Schema push instead of migrations** — Uses `prisma db push` for simplicity; production would use `prisma migrate` for versioned, reversible changes.
- **Soft delete only** — Deleted links are marked with `deletedAt` rather than removed. Analytics data is preserved but there is no UI to restore deleted links.

## Next Steps

Improvements that would follow given more time, ordered by priority:

### Feature Completions

- **Pagination** — Add cursor-based pagination to `GET /api/v1/links` and the frontend table for large link sets.
- **Prisma migrations** — Replace `prisma db push` with `prisma migrate` for production-grade, reversible schema management.
- **Authentication** — Add user accounts so links are owned and private. OAuth or API keys for programmatic access.
- **Custom domains** — Allow users to bring their own domain for branded short links.
- **Link QR codes** — Generate downloadable QR codes for each short link.
- **Bulk operations** — CSV import/export and batch delete for managing many links.

### Scaling & Infrastructure

- **Click ingestion via message queue** — Replace fire-and-forget Promises with Kafka or SQS to decouple click recording from redirect latency and handle bursts.
- **Materialized views or time-series DB** — Pre-aggregate daily click counts instead of computing them on every analytics request.
- **CDN or edge redirect** — Cache slug-to-URL mappings at the edge (e.g., Cloudflare Workers) to reduce origin load.
- **Read replicas** — Separate read traffic (analytics, link listing) from write traffic (click recording).
- **Slug collision handling** — At very high scale, switch to a sequence-based or shard-aware ID generation strategy.

## Testing

Integration tests use Vitest with supertest against a real PostgreSQL database:

```bash
# Requires Postgres running (via docker compose up)
cd backend
DATABASE_URL="postgresql://pebblepost:pebblepost@localhost:5432/pebblepost" npm test
```

Test coverage includes redirect behavior (302, 404, 410, click recording), analytics aggregation (daily counts, breakdowns, range filtering), and link creation validation.

## Project Structure

```
pebblepost/
├── docker-compose.yml
├── README.md
├── docs/
│   ├── PROGRESS.md
│   ├── project_brief.md
│   └── llms.md
├── backend/
│   ├── src/
│   │   ├── app.ts              # Express app configuration
│   │   ├── index.ts            # Server entry point
│   │   ├── routes/             # links, analytics, redirect
│   │   ├── services/           # link.service, analytics.service
│   │   ├── middleware/         # error-handler, validate
│   │   ├── schemas/            # Zod schemas
│   │   └── lib/                # prisma, slug, ua-parser
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── tests/
│       ├── redirect.test.ts
│       └── analytics.test.ts
└── frontend/
    └── src/
        ├── App.tsx
        ├── api/client.ts       # Typed fetch wrapper
        ├── components/         # CreateLinkForm, LinksTable, ClicksChart, AnalyticsSummary
        └── pages/              # LinksPage, LinkDetailPage
```

## LLM Prompts

See [docs/llms.md](docs/llms.md) for the prompts and decisions made during planning and implementation.
