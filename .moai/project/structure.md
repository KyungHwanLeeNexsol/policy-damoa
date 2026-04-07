# Project Structure: 정책다모아 (Policy-Damoa)

## Overview

Policy-Damoa is a Next.js 16.2.2 App Router application organized around domain-driven feature modules. The directory structure separates concerns cleanly: the `src/app` directory handles routing, `src/features` contains domain logic, `src/components` holds shared UI, and `src/services` abstracts external integrations.

---

## Top-Level Directory Structure

```
policy-damoa/
├── src/
│   ├── app/                    # Next.js App Router pages and layouts
│   ├── features/               # Domain feature modules
│   ├── components/             # Shared UI components
│   ├── lib/                    # Utilities, helpers, config
│   ├── services/               # External service integrations (planned)
│   ├── hooks/                  # Shared React hooks (planned)
│   ├── types/                  # Global TypeScript type definitions
│   ├── styles/                 # Global CSS placeholder (Tailwind v4 config in app/globals.css)
│   └── middleware.ts           # Next.js middleware
├── prisma/                     # Database schema and migrations
│   ├── schema.prisma           # Prisma schema
│   └── prisma.config.ts        # Prisma 7.x datasource config (replaces url in schema)
├── public/                     # Static assets
├── scripts/                    # Data collection and maintenance scripts (planned)
├── .env.example                # Environment variable template
├── next.config.ts              # Next.js configuration
├── eslint.config.mjs           # ESLint 9 flat config (replaces .eslintrc)
├── vitest.config.ts            # Vitest configuration
├── playwright.config.ts        # Playwright E2E configuration
├── components.json             # shadcn/ui configuration
├── tsconfig.json               # TypeScript configuration
└── package.json
```

> **Note**: Tailwind CSS v4 does not use `tailwind.config.ts`. Design tokens are configured via `@theme` blocks in `src/app/globals.css`. ESLint 9 uses the flat config format (`eslint.config.mjs`) instead of `.eslintrc`.

---

## `src/app` — Routing Layer (App Router)

The `app` directory follows Next.js App Router conventions. Each folder represents a route segment. Layouts wrap nested routes with shared UI (header, footer, sidebar). Loading and error files provide per-route suspense and error boundaries.

```
src/app/
├── (auth)/                     # Auth route group (no layout chrome)
│   ├── login/
│   │   └── page.tsx            # [implemented]
│   └── layout.tsx              # [implemented]
├── (main)/                     # Main app route group (with nav layout)
│   ├── layout.tsx              # Main layout with header, sidebar [implemented]
│   ├── page.tsx                # Home / landing page [implemented]
│   ├── policies/
│   │   ├── page.tsx            # 정책 목록 페이지 (Server Component, REQ-UI-001~006) [SPEC-UI-001]
│   │   ├── loading.tsx         # 목록 스켈레톤 로딩 [implemented]
│   │   ├── error.tsx           # 에러 바운더리 [SPEC-UI-001]
│   │   └── [id]/
│   │       ├── page.tsx        # 정책 상세 페이지 (Server Component, REQ-UI-007~011) [SPEC-UI-001]
│   │       └── loading.tsx     # 상세 스켈레톤 로딩 [SPEC-UI-001]
│   ├── recommendations/        # 전체 추천 페이지 [SPEC-AI-001]
│   │   └── page.tsx            # 개인화 추천 목록 페이지 [implemented]
│   ├── notifications/          # 알림 히스토리 페이지 [SPEC-NOTIF-001]
│   │   └── page.tsx            # 커서 페이지네이션 알림 목록 [implemented]
│   └── profile/                # 프로필 관련 페이지 [SPEC-NOTIF-001]
│       ├── page.tsx            # 프로필 리다이렉트 [implemented]
│       ├── setup/page.tsx      # 6단계 프로필 위자드 [implemented]
│       └── notifications/page.tsx # 알림 설정 페이지 [implemented]
├── api/                        # API route handlers (Route Handlers)
│   ├── auth/
│   │   └── [...nextauth]/
│   │       └── route.ts        # NextAuth.js v5 handler [implemented]
│   ├── cron/                   # Vercel Cron Job Route Handlers (CRON_SECRET Bearer 인증)
│   │   ├── sync-public-data/route.ts  # data.go.kr 동기화 (@MX:WARN, 6시간마다) [SPEC-API-001]
│   │   ├── sync-bojo24/route.ts       # 보조금24 동기화 (@MX:WARN, 6시간마다) [SPEC-API-001]
│   │   ├── match-policies/route.ts    # 매시간 정책 매칭 (SPEC-NOTIF-001) [implemented]
│   │   ├── send-digest/route.ts       # 매일 오전 8시 KST 다이제스트 [SPEC-NOTIF-001]
│   │   ├── deadline-reminder/route.ts # 매일 오전 9시 KST 마감 알림 [SPEC-NOTIF-001]
│   │   ├── generate-recommendations/route.ts # 야간 배치 추천 생성 (배치 50, 지수 백오프) [SPEC-AI-001]
│   │   └── __tests__/          # Cron 핸들러 단위 테스트
│   ├── recommendations/
│   │   ├── route.ts            # GET /api/recommendations (auth, 401/422/200) [SPEC-AI-001]
│   │   └── feedback/route.ts   # POST /api/recommendations/feedback [SPEC-AI-001]
│   ├── policies/
│   │   └── [id]/similar/route.ts # GET /api/policies/[id]/similar [SPEC-AI-001]
│   └── push/
│       ├── subscribe/route.ts  # Push 구독 엔드포인트 [SPEC-NOTIF-001]
│       └── unsubscribe/route.ts # Push 구독 취소 [SPEC-NOTIF-001]
├── layout.tsx                  # Root layout (HTML, metadata, providers) [implemented]
├── not-found.tsx               # [implemented]
└── globals.css                 # Tailwind v4 CSS-first config (@import 'tailwindcss', @theme)
```

> **Implementation status**: The (auth)/register route was not created during SPEC-INFRA-001 (deferred). Most (main) sub-routes and API routes are placeholders pending feature SPECs.

---

## `src/features` — Domain Feature Modules

Each feature module is self-contained and owns its own components, hooks, actions, and types. This approach follows the vertical slice architecture pattern, keeping related code co-located.

> **SPEC-INFRA-001 status**: All feature directories were created with `.gitkeep` placeholders. Individual components, hooks, actions, and types are populated per feature SPEC.
> **SPEC-UI-001 status**: `policies/` feature module fully implemented (TDD, 91 tests passing).

```
src/features/
├── policies/                   # 정책 검색·필터링 UI [SPEC-UI-001 완료]
│   ├── actions/
│   │   ├── policy.actions.ts   # getPolicies, getPolicyById, getRegions, getCategories (@MX:ANCHOR)
│   │   ├── policy.queries.ts   # buildPolicyWhere, buildCacheKey, buildOrderBy (@MX:ANCHOR)
│   │   └── __tests__/          # actions 단위 테스트 (91개 중 일부)
│   ├── components/
│   │   ├── ActiveFilterBadges.tsx  # 활성 필터 배지 (@MX:NOTE)
│   │   ├── EligibilityChecklist.tsx # 자격 체크리스트 (비로그인 CTA)
│   │   ├── PolicyCard.tsx       # 정책 카드 (D-Day 배지, urgency 변형)
│   │   ├── PolicyDetail.tsx     # 정책 상세 뷰 (Server Component)
│   │   ├── PolicyEmptyState.tsx # 빈 상태 컴포넌트
│   │   ├── PolicyFilter.tsx     # 필터 패널 (데스크탑 인라인 + 모바일 Sheet)
│   │   ├── PolicyList.tsx       # 정책 목록 (Server Component)
│   │   ├── PolicyPagination.tsx # 페이지네이션
│   │   ├── PolicySearch.tsx     # 검색 입력 (300ms 디바운스)
│   │   └── __tests__/           # 컴포넌트 단위 테스트
│   ├── schemas/
│   │   ├── search.ts            # Zod searchParamsSchema, parseSearchParams()
│   │   └── __tests__/
│   ├── types/
│   │   └── index.ts             # @/types 재수출
│   └── utils/
│       ├── eligibility.ts       # matchEligibility() (@MX:WARN JSONB 가변성)
│       └── __tests__/
│
├── notifications/              # 알림 시스템 [SPEC-NOTIF-001 완료]
│   ├── components/
│   │   ├── NotificationBadge.tsx    # 안읽음 배지 컴포넌트
│   │   ├── NotificationList.tsx     # 알림 목록 (커서 페이지네이션)
│   │   ├── NotificationItem.tsx     # 알림 아이템
│   │   ├── NotificationEmptyState.tsx # 빈 상태 컴포넌트
│   │   └── __tests__/               # 컴포넌트 테스트
│   ├── hooks/
│   │   └── use-notifications.ts     # usePushNotifications 훅
│   ├── actions/
│   │   ├── notification.actions.ts  # markAsRead, markAllAsRead, saveNotificationPreferences
│   │   ├── notification.queries.ts  # 커서 페이지네이션 (PAGE_SIZE=20)
│   │   └── __tests__/
│   ├── schemas/
│   │   └── preferences.ts           # Zod 알림 설정 스키마
│   └── types/
│       └── index.ts                 # 알림 관련 타입 정의
│
├── recommendations/            # AI 추천 시스템 [SPEC-AI-001 완료]
│   ├── components/
│   │   ├── recommendation-feed.tsx  # 홈 피드 섹션
│   │   ├── recommendation-card.tsx  # 추천 카드 컴포넌트
│   │   ├── similar-policies.tsx     # 유사 정책 섹션
│   │   └── feedback-buttons.tsx     # 좋아요/싫어요 버튼
│   ├── hooks/
│   │   ├── use-recommendations.ts   # TanStack Query 훅
│   │   └── use-recommendation-feedback.ts # 낙관적 업데이트 뮤테이션 훅
│   ├── actions/
│   │   └── feedback.action.ts       # 피드백 Server Action
│   └── types/
│       └── index.ts                 # 추천 관련 타입 정의
│
└── user/                       # 사용자 프로필 [SPEC-NOTIF-001 완료]
    ├── components/
    │   ├── ProfileWizard.tsx         # 6단계 위자드 루트 컴포넌트
    │   ├── NotificationPreferences.tsx # Push·이메일 설정 UI
    │   └── wizard/                   # 위자드 단계 컴포넌트 (Step1~6, WizardProgress)
    ├── hooks/
    │   └── use-profile-wizard.ts     # 위자드 상태 훅
    ├── actions/
    │   ├── profile.actions.ts        # saveProfile, getMyProfile Server Actions
    │   └── __tests__/
    ├── schemas/
    │   └── profile.ts                # Zod 프로필 스키마
    └── types/
        └── index.ts                  # TypeScript 타입 정의
```

---

## `src/components` — Shared UI Components

Components used across multiple features. Organized by category, following shadcn/ui conventions.

```
src/components/
├── ui/                         # shadcn/ui base components (installed via CLI)
│   ├── avatar.tsx              # [installed]
│   ├── badge.tsx               # [installed]
│   ├── button.tsx              # [installed]
│   ├── card.tsx                # [installed]
│   ├── dialog.tsx              # [installed]
│   ├── dropdown-menu.tsx       # [installed]
│   ├── input.tsx               # [installed]
│   ├── separator.tsx           # [installed]
│   ├── sheet.tsx               # [installed]
│   ├── skeleton.tsx            # [installed]
│   └── ...                     # Additional components added per feature SPEC
├── layout/
│   ├── Header.tsx              # [implemented]
│   ├── Footer.tsx              # [implemented]
│   ├── Sidebar.tsx             # [implemented]
│   └── Navigation.tsx          # [implemented]
├── common/
│   ├── LoadingSpinner.tsx      # [implemented]
│   ├── ErrorBoundary.tsx       # [implemented]
│   ├── EmptyState.tsx          # [implemented]
│   ├── Pagination.tsx          # [planned]
│   └── SearchInput.tsx         # [planned]
└── providers/
    ├── AuthProvider.tsx         # NextAuth.js v5 session provider [implemented]
    ├── QueryProvider.tsx        # TanStack Query provider [implemented]
    └── ThemeProvider.tsx        # next-themes provider [implemented]
```

---

## `src/lib` — Utilities and Shared Logic

```
src/lib/
├── db.ts                       # Prisma client singleton [implemented]
├── auth.ts                     # NextAuth.js v5 config [implemented]
├── utils.ts                    # General utility functions (cn, formatDate, etc.) [implemented]
├── constants.ts                # App-wide constants + CACHE_TTL 확장 (API_RESPONSE: 6h, POLICY_DETAIL: 30min) [implemented]
├── redis.ts                    # Upstash Redis 싱글톤 (null-on-failure 패턴, graceful degradation) [implemented — SPEC-API-001]
├── openai.ts                   # Gemini OpenAI-compatible 클라이언트 싱글톤 (@MX:ANCHOR) [SPEC-AI-001]
├── cache-ttl.ts                # CACHE_TTL 상수 (RECOMMENDATIONS/SIMILAR_POLICIES/BEHAVIOR_RECENT) [SPEC-AI-001]
└── validators/                 # [planned]
    ├── policy.validator.ts
    └── user.validator.ts
```

---

## `src/services` — External Service Integrations

Service layer abstracts all external API calls. Each service module has a clear interface; implementation details are hidden from feature code.

```
src/services/
├── data-collection/                   # 외부 API 데이터 수집 서비스 (data.go.kr, 보조금24) [SPEC-API-001]
│   ├── publicDataPortal.service.ts    # data.go.kr API client [implemented]
│   ├── bojo24.service.ts              # 보조금24 API client (AuthError 즉시 중단, 500건/h 제한) [implemented]
│   ├── normalizer.ts                  # 데이터 정규화 (@MX:ANCHOR, fan_in >= 3) [implemented]
│   ├── deduplicator.ts                # externalId 기반 upsert 중복 제거 [implemented]
│   ├── utils.ts                       # withRetry + AuthError 클래스 [implemented]
│   ├── types.ts                       # Zod 스키마 + raw/normalized 타입 [implemented]
│   ├── index.ts                       # barrel exports [implemented]
│   ├── __tests__/                     # 단위 테스트 (normalizer, utils, bojo24)
│   └── crawler/                       # [planned — SPEC-API-002]
│       ├── localGov.crawler.ts        # Local government site crawler
│       ├── crawler.config.ts          # Crawl targets and schedules
│       └── parser.ts                  # HTML parsing utilities
├── ai/                                # AI 서비스 [SPEC-AI-001 완료]
│   ├── behavior-tracking.service.ts   # trackPolicyView/trackSearch/getRecentBehavior (fire-and-forget)
│   ├── recommendation.service.ts      # 핵심 추천 엔진 (캐시→Gemini→폴백)
│   ├── similar-policies.service.ts    # 유사 정책 AI 재랭킹
│   ├── prompts/
│   │   ├── recommendation.prompt.ts   # PII 제거 프롬프트 빌더
│   │   ├── schemas.ts                 # Gemini 구조화 출력용 Zod 스키마
│   │   └── __tests__/
│   └── __tests__/
├── notification/                      # 알림 서비스 [SPEC-NOTIF-001 완료]
│   ├── push.service.ts                # sendPushNotification (VAPID web-push)
│   ├── email.service.ts               # sendMatchEmail, sendDigestEmail, sendEmailNotification (재시도: 3회, 1s/2s/4s)
│   ├── matching.service.ts            # 배치 매칭 엔진 (50% 임계값)
│   └── __tests__/                     # 서비스 단위 테스트
└── cache/
    ├── policy.cache.ts                # Redis 캐싱 레이어 (Upstash Redis, @MX:NOTE) [implemented — SPEC-API-001]
    └── __tests__/                     # 캐시 단위 테스트
```

---

## `prisma` — Database Schema

```
prisma/
├── schema.prisma               # Main Prisma schema [implemented]
└── prisma.config.ts            # Prisma 7.x datasource config (earlyAccess: true) [implemented]
```

> **Prisma 7.x difference**: The `datasource db` block in `schema.prisma` no longer contains the `url` field. Database URL is managed via `prisma/prisma.config.ts` using `defineConfig`. Migrations directory (`prisma/migrations/`) is created on first `prisma migrate dev` run.

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

## Test Organization

Tests are co-located with source using Vitest. The E2E tests use Playwright with a separate config.

```
src/types/
├── sync.ts                     # 데이터 동기화 관련 타입 정의 (SyncSource, SyncStatus, DataSyncLogResult) [implemented — SPEC-API-001]
└── ...                         # 기타 글로벌 타입 (feature SPEC별 추가)
```

```
src/
└── **/*.test.ts                # Unit and integration tests (co-located or in __tests__)

playwright/
└── *.spec.ts                   # E2E test files (Playwright)
```

> **SPEC-INFRA-001 status**: 110 tests passing across unit, integration, and E2E suites. Tests cover infrastructure setup (auth configuration, database client, providers, components).

### Test Configuration

- `vitest.config.ts`: jsdom environment, `@testing-library/jest-dom` setup, coverage via v8
- `playwright.config.ts`: Configured for local dev server at `http://localhost:3000`

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

# AI (SPEC-AI-001: Gemini via OpenAI-compatible endpoint)
GEMINI_API_KEY=
CRON_SECRET=                    # x-cron-secret 헤더 인증 (generate-recommendations cron)

# Cache
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Notifications (SPEC-NOTIF-001)
RESEND_API_KEY=                 # 이메일 서비스 (Resend)
RESEND_FROM_EMAIL=              # 발신자 이메일 주소
NEXT_PUBLIC_VAPID_PUBLIC_KEY=   # Web Push VAPID 공개 키
VAPID_PRIVATE_KEY=              # Web Push VAPID 비공개 키
VAPID_SUBJECT=                  # Web Push VAPID subject (mailto:)

# Data Collection APIs
PUBLIC_DATA_PORTAL_API_KEY=     # data.go.kr
BOJO24_API_KEY=                 # 보조금24
```

---

Last Updated: 2026-04-07
Version: 1.3.0 (Updated after SPEC-AI-001 + SPEC-NOTIF-001 — recommendations, notifications, user profile 모듈 완료)
