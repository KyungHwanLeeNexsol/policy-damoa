# Technology Stack: 정책다모아 (Policy-Damoa)

## Overview

Policy-Damoa is built on a modern TypeScript-first full-stack architecture optimized for rapid iteration, serverless deployment, and real-time data freshness. Every technology choice prioritizes developer productivity, cost efficiency at startup scale, and the ability to scale with user growth.

---

## Framework: Next.js 14+ (App Router)

**Choice**: Next.js 14+ with App Router and TypeScript

**Rationale**:

Next.js with App Router provides the best unified full-stack TypeScript experience available in 2024-2026. The App Router's React Server Components model is particularly well-suited for this project because:

- **Server-side rendering** delivers fast initial page loads for policy search results, which is critical for SEO and cold-start user acquisition
- **Route Handlers** replace the need for a separate API server for most endpoints, reducing infrastructure complexity
- **Server Actions** allow form submissions and mutations without manual API endpoint creation, speeding up development of profile setup and notification preferences
- **Built-in image optimization** handles policy agency logos and banner images efficiently
- **Edge Runtime support** allows middleware (e.g., authentication checks) to run at the CDN edge for low-latency responses
- **Incremental Static Regeneration (ISR)** can be used for policy detail pages that change infrequently, dramatically reducing database load

The single-repository full-stack model reduces context switching between frontend and backend codebases, enabling a small team to move quickly.

---

## Database: PostgreSQL via Prisma ORM

**Choice**: PostgreSQL (Neon serverless) + Prisma ORM

**Rationale**:

**PostgreSQL** is chosen over alternatives because:

- The policy data model requires complex relational queries — filtering by multiple eligibility criteria simultaneously (age AND region AND occupation AND family status) is well-served by SQL's expressive WHERE clauses
- Full-text search via `pg_trgm` and `tsvector` provides adequate search quality without the operational overhead of a dedicated search index in early phases
- JSONB columns allow flexible storage of source-specific metadata that varies across agencies, without sacrificing query capability
- Mature tooling, extensive community support, and no proprietary lock-in

**Neon** (serverless PostgreSQL) is chosen for hosting because:

- Scales to zero when inactive, eliminating database costs during low-traffic periods
- Serverless connection pooling (via PgBouncer) is compatible with Vercel's serverless function architecture
- Branching feature allows safe schema testing in production-like environments
- Supabase is an equally valid alternative with its own auth and realtime features

**Prisma ORM** is chosen because:

- Type-safe database client generated from schema — TypeScript types are automatically derived, eliminating an entire class of runtime errors
- Schema migration management is structured and version-controlled
- The Prisma schema serves as the authoritative data model documentation
- Strong Next.js integration with examples and community patterns

---

## Authentication: NextAuth.js (Auth.js)

**Choice**: NextAuth.js v5 (Auth.js)

**Rationale**:

NextAuth.js is the de facto standard for authentication in Next.js applications:

- **Provider variety**: Supports Kakao OAuth (essential for Korean users who expect Kakao login), Google, Naver, and email/password out of the box
- **App Router native**: v5 is designed for the App Router and Server Components
- **Session management**: JWT and database sessions are both supported; database sessions allow server-side session invalidation
- **Prisma adapter**: Official adapter keeps user and session data in the same PostgreSQL database, avoiding a separate auth service
- **CSRF protection** and secure cookie handling are built-in, following security best practices by default

Kakao OAuth integration is particularly important for the target demographic (Korean 20s-30s) who use Kakao as their primary social login.

---

## UI: Tailwind CSS + shadcn/ui

**Choice**: Tailwind CSS v3 + shadcn/ui component library

**Rationale**:

**Tailwind CSS**:

- Utility-first approach eliminates CSS naming conflicts and dead CSS
- Design system via `tailwind.config.ts` enforces consistent spacing, colors, and typography across the entire application
- JIT compilation produces minimal production CSS bundles
- Strong integration with shadcn/ui and the broader React ecosystem

**shadcn/ui**:

- Components are copied into the codebase (not a dependency), giving full ownership and customization ability
- Built on Radix UI primitives which provide accessible, unstyled base components — WCAG 2.1 AA compliance is the default, not an afterthought
- Components are styled with Tailwind, maintaining a single styling system
- Active community and regular updates; components can be updated selectively
- Avoids the bloat and version lock of comprehensive UI libraries like MUI or Ant Design

The combination delivers a professional, accessible UI with high development velocity. The design can match Toss or Kakao's clean consumer aesthetic without requiring a custom design system from scratch.

---

## State Management: TanStack Query (React Query)

**Choice**: TanStack Query v5

**Rationale**:

Policy-Damoa's data access patterns are primarily server-state heavy (fetching lists, details, user data) rather than complex local state. TanStack Query is the optimal solution:

- Automatic background refetching keeps policy lists fresh
- Optimistic updates enable smooth UI for bookmark and notification toggle interactions
- Built-in caching with stale-while-revalidate semantics reduces redundant API calls
- Infinite query support for paginated policy lists
- Works alongside Next.js Server Components — server components handle initial data, TanStack Query handles client-side refetching and mutations

---

## Caching: Redis (Upstash)

**Choice**: Upstash Redis (serverless Redis)

**Rationale**:

Policy data is expensive to query (complex joins, full-text search) but changes infrequently (data collection runs every few hours). Redis caching provides:

- Sub-millisecond response times for cached policy search results
- Session data storage for high-frequency session lookups
- Rate limiting for AI recommendation API calls (prevent cost overruns)
- Notification queue state

**Upstash** is chosen over self-hosted Redis because:

- Serverless model (HTTP-based) is compatible with Vercel serverless functions (traditional Redis connections cannot persist in serverless)
- Generous free tier for development and early production
- Global replication available when needed

---

## Data Collection: Cron Jobs + Public Data APIs

**Choice**: Vercel Cron Jobs + Node.js scripts + Playwright/Cheerio crawling

**Rationale**:

Policy data sources require two distinct collection strategies:

1. **Official APIs (data.go.kr, 보조금24)**: REST API clients with pagination, rate limiting, and incremental sync. These are reliable and structured; handled by TypeScript service modules.

2. **Local government sites**: Many municipalities do not have APIs. Cheerio (HTML parsing) handles static sites; Playwright handles JavaScript-rendered pages. A configurable crawler target list allows adding new sources without code changes.

**Vercel Cron Jobs** provide zero-infrastructure scheduling for data sync runs (every 4-6 hours for major sources, daily for local government crawlers). For more complex orchestration requirements (parallel crawlers, retries, monitoring), a migration to Trigger.dev or similar is straightforward.

---

## AI / ML: OpenAI API

**Choice**: OpenAI API (GPT-4o-mini for recommendations, GPT-4o for complex eligibility analysis)

**Rationale**:

- **GPT-4o-mini** provides sufficient quality for policy-to-profile matching at low cost (~$0.15/million input tokens), making per-request AI recommendations economically viable
- **GPT-4o** is reserved for complex eligibility analysis conversations requiring nuanced understanding of Korean government policy language
- **Embeddings API** (text-embedding-3-small) enables semantic search as an enhancement to keyword search — policies with similar meaning to a query are surfaced even without exact keyword matches
- The OpenAI API requires no ML infrastructure, model training, or GPU management
- Structured output (JSON mode) ensures reliable parsing of AI responses into typed recommendation objects

**Future consideration**: As usage scales, a vector database (Qdrant or pgvector in PostgreSQL) can be added for embedding-based semantic search without changing the AI provider.

---

## Deployment: Vercel

**Choice**: Vercel

**Rationale**:

Vercel is the natural deployment target for Next.js:

- Zero-configuration deployment from GitHub — production deploys trigger on merge to `main`, preview deploys on pull requests
- Edge Network (CDN) for static assets and ISR pages
- Serverless Functions for API routes with automatic scaling
- Vercel Cron Jobs for data collection scheduling
- Analytics and Web Vitals monitoring built-in
- Environment variable management with per-environment scoping (preview vs production)

The free Hobby tier and Starter plan are sufficient for MVP launch, with clear upgrade paths as traffic grows.

---

## Key Dependencies

### Production Dependencies

| Package                 | Purpose                                  |
| ----------------------- | ---------------------------------------- |
| `next`                  | Framework                                |
| `react`, `react-dom`    | UI library                               |
| `typescript`            | Type safety                              |
| `@prisma/client`        | Database ORM client                      |
| `next-auth`             | Authentication                           |
| `tailwindcss`           | Styling                                  |
| `@radix-ui/*`           | Accessible UI primitives (via shadcn/ui) |
| `@tanstack/react-query` | Server state management                  |
| `openai`                | AI recommendations and embeddings        |
| `@upstash/redis`        | Redis client (serverless-compatible)     |
| `zod`                   | Runtime schema validation                |
| `date-fns`              | Date formatting and manipulation         |
| `cheerio`               | HTML parsing for static site crawling    |
| `playwright`            | Browser automation for JS-rendered sites |
| `resend`                | Transactional email                      |
| `web-push`              | Web Push notification delivery           |
| `lucide-react`          | Icon library (shadcn/ui compatible)      |

### Development Dependencies

| Package                          | Purpose                          |
| -------------------------------- | -------------------------------- |
| `prisma`                         | Database CLI and migration tool  |
| `vitest`                         | Unit and integration testing     |
| `@playwright/test`               | End-to-end testing               |
| `eslint`, `@typescript-eslint/*` | Linting                          |
| `prettier`                       | Code formatting                  |
| `husky`                          | Git hooks for pre-commit checks  |
| `lint-staged`                    | Run linters only on staged files |

---

## Development Environment Requirements

### Required

- **Node.js**: 20.x LTS or later (required for Next.js 14+)
- **pnpm**: 8.x or later (preferred package manager; faster and more efficient than npm/yarn)
- **Git**: For version control

### Recommended

- **Docker Desktop**: For running a local PostgreSQL instance during development
  - `docker-compose.yml` provided with PostgreSQL and Redis services
  - Alternatively, use a free Neon/Supabase dev database

### Optional

- **Playwright browsers**: Install with `pnpm exec playwright install` for e2e test execution

### Environment Setup

1. Copy `.env.example` to `.env.local`
2. Start local services: `docker compose up -d`
3. Install dependencies: `pnpm install`
4. Run database migrations: `pnpm prisma migrate dev`
5. Seed development data: `pnpm prisma db seed`
6. Start development server: `pnpm dev`

---

## Build and Deployment Configuration Overview

### Development

- `pnpm dev` starts the Next.js dev server on port 3000 with hot module replacement
- TypeScript type checking runs continuously in the background

### Pre-commit Checks (via Husky + lint-staged)

- ESLint on staged `.ts` and `.tsx` files
- Prettier formatting check
- TypeScript type check (`tsc --noEmit`)

### CI Pipeline (GitHub Actions)

On every pull request:

1. Install dependencies (`pnpm install --frozen-lockfile`)
2. Type check (`pnpm tsc --noEmit`)
3. Lint (`pnpm lint`)
4. Unit and integration tests (`pnpm test`)
5. Build (`pnpm build`)
6. E2e tests against preview deployment (`pnpm test:e2e`)

### Production Build

- `pnpm build` produces an optimized Next.js production build
- Static pages are pre-rendered at build time
- Dynamic routes use server-side rendering or ISR as configured per route
- API routes compile to Vercel Serverless Functions

### Vercel Configuration (`vercel.json`)

Key settings:

- Cron job schedule for data collection scripts
- Function memory and timeout limits for AI recommendation endpoints (higher memory, 30s timeout)
- Edge config for feature flags

---

## Architecture Decision Records (ADRs)

### ADR-001: Monorepo vs Separate Repos

**Decision**: Single repository for both frontend and backend code.

**Reasoning**: At MVP stage, a monorepo reduces coordination overhead. Next.js App Router collocates API routes with pages naturally. If the data collection pipeline grows significantly, it can be extracted to a separate service later.

### ADR-002: Serverless vs Dedicated Server for Data Collection

**Decision**: Vercel Cron Jobs for initial implementation; migrate to Trigger.dev if complexity warrants.

**Reasoning**: Crawling scripts run on schedules, not in response to user traffic. Vercel Cron Jobs handle simple cron schedules without additional infrastructure. If parallel crawling, complex retry logic, or crawl observability become requirements, a dedicated job orchestration service is more appropriate.

### ADR-003: pgvector vs External Vector Database

**Decision**: Defer vector search; use PostgreSQL full-text search for MVP.

**Reasoning**: PostgreSQL's built-in `tsvector` full-text search is sufficient for initial launch with Korean text. The `pg_trgm` extension handles fuzzy matching. When semantic search quality becomes a differentiator, adding `pgvector` to the existing PostgreSQL database is lower operational overhead than adding Pinecone or Qdrant as a new infrastructure dependency.

---

Last Updated: 2026-04-05
Version: 1.0.0
