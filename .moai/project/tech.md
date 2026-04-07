# Technology Stack: 정책다모아 (Policy-Damoa)

## Overview

Policy-Damoa is built on a modern TypeScript-first full-stack architecture optimized for rapid iteration, serverless deployment, and real-time data freshness. Every technology choice prioritizes developer productivity, cost efficiency at startup scale, and the ability to scale with user growth.

---

## Framework: Next.js 16.2.2 (App Router)

**Choice**: Next.js 16.2.2 with App Router and TypeScript

**Rationale**:

Next.js 16 with App Router provides the best unified full-stack TypeScript experience available in 2024-2026. The App Router's React Server Components model is particularly well-suited for this project because:

- **Server-side rendering** delivers fast initial page loads for policy search results, which is critical for SEO and cold-start user acquisition
- **Route Handlers** replace the need for a separate API server for most endpoints, reducing infrastructure complexity
- **Server Actions** allow form submissions and mutations without manual API endpoint creation, speeding up development of profile setup and notification preferences
- **Built-in image optimization** handles policy agency logos and banner images efficiently
- **Edge Runtime support** allows middleware (e.g., authentication checks) to run at the CDN edge for low-latency responses
- **Note**: Next.js 16 deprecates middleware-based proxy patterns; the proxy approach is recommended for future auth middleware architecture
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

**Prisma 7.x** is the installed version. Key behavioral differences from earlier versions:

- Uses `prisma/prisma.config.ts` for datasource configuration (instead of embedding `DATABASE_URL` directly in `schema.prisma`)
- `earlyAccess: true` is required for certain v7 features still under early access
- The `schema.prisma` datasource block no longer contains the `url` field; it is managed via `prisma.config.ts`

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

**Choice**: Tailwind CSS v4.2.2 + shadcn/ui component library

**Rationale**:

**Tailwind CSS**:

- Utility-first approach eliminates CSS naming conflicts and dead CSS
- **v4 CSS-first configuration**: Design tokens are defined directly in `src/app/globals.css` using `@theme` blocks and CSS custom properties — there is no `tailwind.config.ts` file
- `@import 'tailwindcss'` in `globals.css` replaces the previous PostCSS plugin approach
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

**Choice**: TanStack Query v5.96.2

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

## AI / ML: Gemini API (OpenAI-Compatible Endpoint)

**Choice**: Google Gemini API via OpenAI-compatible endpoint (gemini-2.0-flash)

**Rationale** (updated after SPEC-AI-001 implementation):

- **gemini-2.0-flash** is used via OpenAI SDK's `baseURL` pointing to `https://generativelanguage.googleapis.com/v1beta/openai/` — provides cost-effective AI recommendations with structured output support
- **Gemini structured output** (JSON Schema mode) ensures reliable parsing of AI responses into typed recommendation objects via Zod schema validation
- **PII removal** is enforced in prompt construction before any user data is sent to the AI model
- **Fallback strategy**: Redis cache → Gemini API → rule-based fallback, ensuring recommendations are always available even when the AI service is unavailable
- **Behavior tracking**: `trackPolicyView` and `trackSearch` events are stored in PostgreSQL (fire-and-forget pattern) to feed the recommendation engine
- **Nightly batch pre-computation**: Cron job generates recommendations in batches of 50 users with exponential backoff, reducing real-time AI call latency

**SPEC-AI-001 implementation details**:

- Client singleton: `src/lib/openai.ts` (Gemini OpenAI-compatible, `@MX:ANCHOR`)
- Cache TTLs: `src/lib/cache-ttl.ts` (RECOMMENDATIONS: 3600s, SIMILAR_POLICIES: 21600s, BEHAVIOR_RECENT: 1800s)
- Recommendation engine: `src/services/ai/recommendation.service.ts`
- Similar policy re-ranking: `src/services/ai/similar-policies.service.ts`

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

| Package                 | Version       | Purpose                                  |
| ----------------------- | ------------- | ---------------------------------------- |
| `next`                  | 16.2.2        | Framework                                |
| `react`, `react-dom`    | 19.2.4        | UI library                               |
| `@prisma/client`        | ^7.6.0        | Database ORM client                      |
| `next-auth`             | 5.0.0-beta.30 | Authentication                           |
| `@auth/prisma-adapter`  | ^2.11.1       | Prisma adapter for NextAuth.js v5        |
| `tailwindcss`           | ^4            | Styling (CSS-first config via globals.css) |
| `@radix-ui/*`           | latest        | Accessible UI primitives (via shadcn/ui) |
| `@tanstack/react-query` | ^5.80.6       | Server state management                  |
| `next-themes`           | ^0.4.6        | Theme provider for dark mode             |
| `lucide-react`          | ^0.525.0      | Icon library (shadcn/ui compatible)      |
| `class-variance-authority` | ^0.7.1   | Variant styling utility                  |
| `clsx`                  | ^2.1.1        | Class name utility                       |
| `tailwind-merge`        | ^3.3.0        | Tailwind class merge utility             |
| `tw-animate-css`        | ^1.3.4        | Animation utilities for Tailwind v4      |
| `openai`                | latest        | Gemini API via OpenAI-compatible endpoint (SPEC-AI-001) |
| `@upstash/redis`        | ^1.x          | Redis client (serverless-compatible, HTTP-based, added in SPEC-API-001) |
| `zod`                   | latest        | Runtime schema validation (Gemini structured output, search params) |
| `date-fns`              | (planned)     | Date formatting and manipulation         |
| `cheerio`               | (planned)     | HTML parsing for static site crawling    |
| `playwright`            | (planned)     | Browser automation for JS-rendered sites |
| `resend`                | latest        | 트랜잭션 이메일 (SPEC-NOTIF-001: sendMatchEmail, sendDigestEmail) |
| `web-push`              | latest        | Web Push 알림 VAPID 기반 전송 (SPEC-NOTIF-001) |
| `@types/web-push`       | latest        | web-push 타입 정의 (SPEC-NOTIF-001)      |

### Development Dependencies

| Package                          | Version   | Purpose                          |
| -------------------------------- | --------- | -------------------------------- |
| `typescript`                     | ^5 (5.9.3) | Type safety                     |
| `prisma`                         | ^7.6.0    | Database CLI and migration tool  |
| `vitest`                         | ^4.1.2    | Unit and integration testing     |
| `@playwright/test`               | ^1.59.1   | End-to-end testing               |
| `eslint`                         | ^9        | Linting (flat config, eslint.config.mjs) |
| `eslint-config-next`             | 16.2.2    | Next.js ESLint rules             |
| `prettier`                       | ^3.8.1    | Code formatting                  |
| `husky`                          | ^9.1.7    | Git hooks for pre-commit checks  |
| `lint-staged`                    | ^16.4.0   | Run linters only on staged files |
| `@tailwindcss/postcss`           | ^4        | PostCSS integration for Tailwind v4 |
| `@vitejs/plugin-react`           | ^6.0.1    | Vite plugin for React in Vitest  |
| `@testing-library/react`         | ^16.3.2   | React component testing          |
| `@testing-library/jest-dom`      | ^6.9.1    | DOM matchers for testing         |
| `jsdom`                          | ^29.0.1   | DOM environment for Vitest       |

---

## Development Environment Requirements

### Required

- **Node.js**: 20.19.6 (required for Next.js 16; 20.x LTS)
- **pnpm**: 9.x or later (preferred package manager; faster and more efficient than npm/yarn)
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
4. Run database migrations: `pnpm prisma migrate dev` (requires `prisma/prisma.config.ts` with `DATABASE_URL`)
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

- Cron job schedule for data collection scripts (SPEC-API-001: `sync-public-data` and `sync-bojo24` every 6 hours, `maxDuration: 900`)
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

---

## Actual Installed Versions (SPEC-INFRA-001)

| Technology       | Planned          | Installed        | Notes                                                       |
| ---------------- | ---------------- | ---------------- | ----------------------------------------------------------- |
| Next.js          | 14+              | 16.2.2           | App Router, middleware proxy recommended over legacy pattern |
| React            | 18.3.0           | 19.2.4           | Server Components, Actions, use() hook                      |
| TypeScript       | 5.5.0            | 5.9.3            | Stricter type inference improvements                        |
| Tailwind CSS     | 3.4.0            | 4.2.2            | CSS-first config; no `tailwind.config.ts`                   |
| Prisma           | 5.15.0           | 7.x (^7.6.0)     | `prisma/prisma.config.ts` for datasource; `earlyAccess: true` |
| next-auth        | 5.0.0-beta.19    | 5.0.0-beta.30    | v5 App Router native                                        |
| @tanstack/react-query | 5.x         | 5.96.2 (^5.80.6) | —                                                           |
| Vitest           | 1.6.0            | 4.1.2            | `@vitejs/plugin-react` ^6                                   |
| ESLint           | 8.57.0           | 9 (flat config)  | `eslint.config.mjs` flat config format                      |
| Node.js          | 20.x             | 20.19.6          | —                                                           |

---

Last Updated: 2026-04-07
Version: 1.3.0 (Updated after SPEC-AI-001 + SPEC-NOTIF-001 implementation — Gemini API, web-push, resend 추가)
