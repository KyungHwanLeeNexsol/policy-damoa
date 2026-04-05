# Project Structure: 정책다모아 (Policy-Damoa)

## Overview

Policy-Damoa is a Next.js 14+ App Router application organized around domain-driven feature modules. The directory structure separates concerns cleanly: the `src/app` directory handles routing, `src/features` contains domain logic, `src/components` holds shared UI, and `src/services` abstracts external integrations.

---

## Top-Level Directory Structure

```
policy-damoa/
├── src/
│   ├── app/                    # Next.js App Router pages and layouts
│   ├── features/               # Domain feature modules
│   ├── components/             # Shared UI components
│   ├── lib/                    # Utilities, helpers, config
│   ├── services/               # External service integrations
│   ├── hooks/                  # Shared React hooks
│   ├── types/                  # Global TypeScript type definitions
│   └── styles/                 # Global CSS and Tailwind config
├── prisma/                     # Database schema and migrations
├── public/                     # Static assets
├── scripts/                    # Data collection and maintenance scripts
├── tests/                      # Test files (unit, integration, e2e)
├── .env.example                # Environment variable template
├── next.config.ts              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── package.json
```

---

## `src/app` — Routing Layer (App Router)

The `app` directory follows Next.js App Router conventions. Each folder represents a route segment. Layouts wrap nested routes with shared UI (header, footer, sidebar). Loading and error files provide per-route suspense and error boundaries.

```
src/app/
├── (auth)/                     # Auth route group (no layout chrome)
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   └── layout.tsx
├── (main)/                     # Main app route group (with nav layout)
│   ├── layout.tsx              # Main layout with header, sidebar
│   ├── page.tsx                # Home / landing page
│   ├── policies/
│   │   ├── page.tsx            # Policy search and listing
│   │   ├── [id]/
│   │   │   └── page.tsx        # Policy detail page
│   │   └── loading.tsx
│   ├── recommendations/
│   │   └── page.tsx            # AI recommendations page
│   ├── notifications/
│   │   └── page.tsx            # Notification settings and history
│   └── profile/
│       └── page.tsx            # User profile and saved policies
├── api/                        # API route handlers (Route Handlers)
│   ├── auth/
│   │   └── [...nextauth]/
│   │       └── route.ts        # NextAuth.js handler
│   ├── policies/
│   │   ├── route.ts            # GET /api/policies (list, search, filter)
│   │   └── [id]/
│   │       └── route.ts        # GET /api/policies/:id
│   ├── notifications/
│   │   └── route.ts            # GET/POST /api/notifications
│   ├── recommendations/
│   │   └── route.ts            # GET /api/recommendations (AI-powered)
│   └── webhooks/
│       └── data-sync/
│           └── route.ts        # Webhook for data collection jobs
├── layout.tsx                  # Root layout (HTML, metadata, providers)
├── not-found.tsx
└── globals.css
```

---

## `src/features` — Domain Feature Modules

Each feature module is self-contained and owns its own components, hooks, actions, and types. This approach follows the vertical slice architecture pattern, keeping related code co-located.

```
src/features/
├── policies/
│   ├── components/
│   │   ├── PolicyCard.tsx          # Summary card for policy listing
│   │   ├── PolicyDetail.tsx        # Full policy detail view
│   │   ├── PolicyFilter.tsx        # Filter sidebar/panel
│   │   ├── PolicySearchBar.tsx     # Search input with suggestions
│   │   └── PolicyList.tsx          # List with pagination
│   ├── hooks/
│   │   ├── usePolicies.ts          # Fetch and filter policies
│   │   └── usePolicyDetail.ts      # Fetch single policy
│   ├── actions/
│   │   ├── searchPolicies.ts       # Server action: search
│   │   └── getPolicyById.ts        # Server action: detail fetch
│   ├── schemas/
│   │   └── policy.schema.ts        # Zod validation schemas
│   └── types/
│       └── policy.types.ts         # Policy domain types
│
├── notifications/
│   ├── components/
│   │   ├── NotificationSettings.tsx
│   │   ├── NotificationCard.tsx
│   │   └── NotificationBell.tsx    # Header notification indicator
│   ├── hooks/
│   │   └── useNotifications.ts
│   ├── actions/
│   │   └── updateNotificationPrefs.ts
│   └── types/
│       └── notification.types.ts
│
├── recommendations/
│   ├── components/
│   │   ├── RecommendationPanel.tsx
│   │   ├── RecommendationCard.tsx
│   │   └── AIExplanation.tsx       # AI matching explanation display
│   ├── hooks/
│   │   └── useRecommendations.ts
│   ├── actions/
│   │   └── getPersonalizedRecs.ts  # Server action: call AI service
│   └── types/
│       └── recommendation.types.ts
│
└── user/
    ├── components/
    │   ├── ProfileForm.tsx          # Profile setup/edit wizard
    │   ├── SavedPolicies.tsx        # Bookmarked policies list
    │   └── ProfileSummary.tsx
    ├── hooks/
    │   └── useUserProfile.ts
    ├── actions/
    │   └── updateProfile.ts        # Server action: profile update
    └── types/
        └── user.types.ts
```

---

## `src/components` — Shared UI Components

Components used across multiple features. Organized by category, following shadcn/ui conventions.

```
src/components/
├── ui/                         # shadcn/ui base components (auto-generated)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── badge.tsx
│   └── ...
├── layout/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Sidebar.tsx
│   └── Navigation.tsx
├── common/
│   ├── LoadingSpinner.tsx
│   ├── ErrorBoundary.tsx
│   ├── EmptyState.tsx
│   ├── Pagination.tsx
│   └── SearchInput.tsx
└── providers/
    ├── AuthProvider.tsx         # NextAuth.js session provider
    ├── QueryProvider.tsx        # TanStack Query provider
    └── ThemeProvider.tsx        # next-themes provider
```

---

## `src/lib` — Utilities and Shared Logic

```
src/lib/
├── db.ts                       # Prisma client singleton
├── auth.ts                     # NextAuth.js config
├── redis.ts                    # Redis client (Upstash)
├── openai.ts                   # OpenAI client
├── utils.ts                    # General utility functions (cn, formatDate, etc.)
├── constants.ts                # App-wide constants
└── validators/
    ├── policy.validator.ts
    └── user.validator.ts
```

---

## `src/services` — External Service Integrations

Service layer abstracts all external API calls. Each service module has a clear interface; implementation details are hidden from feature code.

```
src/services/
├── data-collection/
│   ├── publicDataPortal.service.ts    # data.go.kr API client
│   ├── bojo24.service.ts              # 보조금24 API client
│   ├── crawler/
│   │   ├── localGov.crawler.ts        # Local government site crawler
│   │   ├── crawler.config.ts          # Crawl targets and schedules
│   │   └── parser.ts                  # HTML parsing utilities
│   └── index.ts                       # Unified data collection entry
├── ai/
│   ├── recommendation.service.ts      # AI recommendation logic
│   ├── eligibility.service.ts         # Eligibility analysis
│   └── prompts/
│       ├── recommendation.prompt.ts
│       └── eligibility.prompt.ts
├── notification/
│   ├── push.service.ts                # Web push (via FCM or web-push)
│   ├── email.service.ts               # Email via Resend
│   └── matcher.service.ts             # Policy-to-user matching engine
└── cache/
    └── policy.cache.ts                # Redis cache layer for policies
```

---

## `prisma` — Database Schema

```
prisma/
├── schema.prisma               # Main Prisma schema
└── migrations/                 # Auto-generated migration files
    └── YYYYMMDDHHMMSS_init/
        └── migration.sql
```

### Key Prisma Models

- `User` — Authentication, profile attributes, notification preferences
- `Policy` — Aggregated policy data (title, description, eligibility, benefit, deadline, source)
- `PolicyCategory` — Taxonomy (housing, employment, childcare, startup, welfare, etc.)
- `UserSavedPolicy` — Join table for user bookmarks with application status
- `NotificationLog` — Record of notifications sent to users
- `DataSyncLog` — Audit log for data collection jobs

---

## `scripts` — Data Collection and Maintenance

```
scripts/
├── sync/
│   ├── syncPublicDataPortal.ts        # Pull from data.go.kr APIs
│   ├── syncBojo24.ts                  # Pull from 보조금24 API
│   └── crawlLocalGovs.ts              # Crawl local government sites
├── maintenance/
│   ├── deduplicatePolicies.ts         # Remove duplicate entries
│   ├── expireOldPolicies.ts           # Mark expired programs
│   └── reindexSearch.ts              # Rebuild search index
└── seed/
    └── seed.ts                        # Development seed data
```

Scheduled via Vercel Cron Jobs (or an external cron service) configured in `vercel.json`.

---

## `tests` — Test Organization

```
tests/
├── unit/
│   ├── services/
│   │   ├── recommendation.service.test.ts
│   │   └── matcher.service.test.ts
│   └── lib/
│       └── utils.test.ts
├── integration/
│   ├── api/
│   │   ├── policies.test.ts
│   │   └── recommendations.test.ts
│   └── db/
│       └── policy.repository.test.ts
└── e2e/
    ├── search.spec.ts
    ├── notifications.spec.ts
    └── profile-setup.spec.ts
```

---

## Data Flow Architecture

```
External Sources                Internal Pipeline               User-Facing Layer
─────────────────               ─────────────────               ─────────────────

data.go.kr API   ──┐
보조금24 API     ──┼──► Data Collection ──► PostgreSQL ──► API Routes ──► React UI
Local Gov Sites  ──┘    (scripts/sync)       (Prisma)     (app/api)     (app/pages)
                              │                  │
                              │                  ├──► Redis Cache
                              │                  │    (policy listings)
                              │                  │
                              └──► DataSyncLog   └──► AI Service
                                   (audit trail)      (recommendations)
                                                       │
                                                  OpenAI API
```

### Data Collection Flow

1. Cron triggers `syncPublicDataPortal.ts`, `syncBojo24.ts`, and `crawlLocalGovs.ts` on schedule
2. Each collector normalizes data into the unified `Policy` schema
3. Deduplication and validation run before upsert into PostgreSQL
4. Redis cache is invalidated for affected policy categories
5. Matching engine runs to identify users who should receive notifications
6. Push notifications and email digests are queued and sent

### Request Flow (Search)

1. User submits search query and filter criteria from `PolicySearchBar`
2. Request hits `GET /api/policies` Route Handler
3. Route Handler checks Redis cache; on miss, queries PostgreSQL via Prisma
4. Results are ranked and returned as JSON
5. Client renders `PolicyList` with `PolicyCard` components
6. Cache result is stored in Redis with 15-minute TTL

### AI Recommendation Flow

1. User profile is read from PostgreSQL
2. Recent policy updates are fetched (last 7 days)
3. OpenAI API is called with user profile + policy metadata as context
4. Response is parsed into ranked recommendation list with explanations
5. Results are cached per user for 1 hour in Redis

---

## File Naming Conventions

| Type                  | Convention                                          | Example                     |
| --------------------- | --------------------------------------------------- | --------------------------- |
| React components      | PascalCase                                          | `PolicyCard.tsx`            |
| Hooks                 | camelCase with `use` prefix                         | `usePolicies.ts`            |
| Server actions        | camelCase, verb-first                               | `searchPolicies.ts`         |
| Service files         | camelCase with `.service.ts` suffix                 | `recommendation.service.ts` |
| Type definition files | camelCase with `.types.ts` suffix                   | `policy.types.ts`           |
| Schema files          | camelCase with `.schema.ts` suffix                  | `policy.schema.ts`          |
| Test files            | same as source with `.test.ts` or `.spec.ts` suffix | `policies.test.ts`          |
| Route handlers        | `route.ts` (App Router convention)                  | `route.ts`                  |
| Constants             | SCREAMING_SNAKE_CASE for values                     | `MAX_RESULTS_PER_PAGE`      |
| Environment variables | SCREAMING_SNAKE_CASE                                | `DATABASE_URL`              |

---

## Environment Variables

Key environment variables (see `.env.example`):

```
# Database
DATABASE_URL=                   # PostgreSQL connection string (Neon/Supabase)

# Authentication
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# AI
OPENAI_API_KEY=

# Cache
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Notifications
FCM_SERVER_KEY=                 # Firebase Cloud Messaging
RESEND_API_KEY=                 # Email service

# Data Collection APIs
PUBLIC_DATA_PORTAL_API_KEY=     # data.go.kr
BOJO24_API_KEY=                 # 보조금24
```

---

Last Updated: 2026-04-05
Version: 1.0.0
