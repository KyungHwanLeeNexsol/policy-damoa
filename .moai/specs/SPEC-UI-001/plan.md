# SPEC-UI-001: Implementation Plan

**SPEC ID**: SPEC-UI-001
**Title**: Policy Search & Filtering UI
**Date**: 2026-04-06
**Author**: manager-spec (MoAI)
**Status**: Draft

---

## Overview

SPEC-UI-001 delivers the primary user-facing surface of 정책다모아: the policy discovery experience. This encompasses the policy list page with server-side pagination and filtering, a policy detail page with an eligibility checklist (시그니처 요소), a full-text search input, a multi-condition filter panel, and all associated loading/empty/error states.

This is the interface through which the entire data pipeline (SPEC-API-001) becomes visible to end users.

---

## Dependencies

| SPEC | Status | What It Provides |
|------|--------|-----------------|
| SPEC-INFRA-001 | ✅ Complete | Next.js 16, App Router, layout components, shadcn/ui base, Vitest + Playwright setup, 110 passing tests |
| SPEC-API-001 | ✅ Complete | Policy/Region/Category data in PostgreSQL, Redis caching layer, seed data (20 policies, 17 regions, 8 categories), 156 passing tests |

**Critical constraint**: The 266 pre-existing tests must pass after every implementation cycle. No regressions permitted.

---

## Technical Approach

### Server vs. Client Component Boundary

The primary architectural decision is where to draw the Server/Client boundary.

**Server Components** (no `'use client'` directive):
- `src/app/(main)/policies/page.tsx` — Reads `searchParams`, calls server actions, renders page shell
- `src/app/(main)/policies/[id]/page.tsx` — Reads `params.id`, calls server action, renders detail
- `src/components/features/policy/PolicyList.tsx` — Receives pre-fetched data as props, renders card grid
- `src/components/features/policy/PolicyDetail.tsx` — Renders policy detail view and eligibility checklist

**Client Components** (`'use client'` required):
- `src/components/features/policy/PolicySearch.tsx` — Controlled search input with 300ms debounce; updates URL via `useRouter().replace()`
- `src/components/features/policy/PolicyFilter.tsx` — Reads active filters from URL, updates URL on change; Sheet on mobile, inline on desktop
- `src/components/features/policy/PolicyPagination.tsx` — Updates `?page=N` in URL while preserving other params
- `src/components/features/policy/PolicyCard.tsx` — Needs `useSession()` for bookmark button
- `src/components/features/policy/ActiveFilterBadges.tsx` — Dismissible filter badge chips

**Data flow**: User changes filter (client) → URL params update → page.tsx re-renders on server with new searchParams → getPolicies() server action → Redis cache checked → Prisma query on miss → data flows into PolicyList (server) → cards rendered.

This pattern: preserves SSR for SEO, keeps filtering shareable via URL, avoids client-side state management for server data.

### Filter State via URL Query Params

All filter state lives in the URL.

**URL parameter schema**:
```
?q=검색어          → full-text search query
?category=housing  → category slug
?region=11         → region code (시도 code)
?benefit=cash      → benefitType
?status=active     → policy status
?sort=newest       → sort order: newest | deadline | relevance
?age_min=20        → age range minimum
?age_max=34        → age range maximum
?occupation=student → occupation filter
?family=single     → familyStatus filter
?page=2            → current page (default 1)
```

### Full-Text Search Strategy (MVP)

Prisma `contains` with `mode: 'insensitive'` across `title`, `description`, and `sourceAgency`. This is substring matching — sufficient for Korean substring discovery at MVP scale. Korean morphological variants (e.g., "청년" vs "청소년") are a known limitation. Post-MVP upgrade path: PostgreSQL `tsvector` with `pg_bigm` extension.

Search input debounced at 300ms client-side.

### Cache Strategy

Reuses existing `policy.cache.ts`. Cache key = alphabetically-sorted filter params → stable string → MD5 hash. This ensures `?region=11&category=housing` and `?category=housing&region=11` hit the same cache entry.

TTLs: `CACHE_TTL.POLICY_LIST` (15 min) for lists; `CACHE_TTL.POLICY_DETAIL` (30 min) for detail. Redis failure → graceful bypass to Prisma (already implemented).

### Type Extension Required

The existing `PolicySearchFilters` interface in `src/types/index.ts` is missing `occupation` and `familyStatus` fields. These must be added in M1 before any other milestone begins.

---

## Implementation Milestones

### M1: Type Extensions + Server Actions + Prisma Query Builders

**Purpose**: Establish the data layer. All other milestones depend on these functions.

**Files to create/modify**:
- `src/types/index.ts` — Add `occupation?: string`, `familyStatus?: string` to `PolicySearchFilters`; add `PolicyWithRelations` type
- `src/lib/actions/policy.actions.ts` — Server actions: `getPolicies(filters, page, pageSize)`, `getPolicyById(id)`, `getRegions()`, `getCategories()`
- `src/lib/queries/policy.queries.ts` — Pure functions: `buildPolicyWhere(filters)`, `buildOrderBy(sortBy)`, `buildCacheKey(filters, page)`, `parseSearchParams(searchParams)`
- `src/lib/actions/__tests__/policy.actions.test.ts` — TDD first
- `src/lib/queries/__tests__/policy.queries.test.ts` — TDD first

**TDD order**: Query builder tests (pure functions, no deps) → action tests (with mocks) → implementation.

**Key decisions**:
- `occupation` and `familyStatus` filters use JSONB path queries on `eligibilityCriteria`
- `getRegions()` returns level-1 regions only (시도, 17 items) for MVP
- `parseSearchParams` is the single source of truth for URL-param-to-type conversion; extensively tested for edge cases

---

### M2: Policy List Page (Server Component)

**Files to create**:
- `src/app/(main)/policies/page.tsx` — Server component; reads searchParams, calls parseSearchParams + getPolicies, renders page shell with Suspense boundary
- `src/app/(main)/policies/error.tsx` — Error boundary; user-friendly message with retry
- `src/components/features/policy/PolicyList.tsx` — Renders grid of PolicyCard; EmptyState when total=0; PolicyPagination below grid
- `src/components/features/policy/__tests__/PolicyList.test.tsx` — TDD

**Layout note**: Filter panel lives in content area (not in the w-56 Sidebar). Desktop: inline above/beside results. Mobile: Sheet trigger button in page header.

---

### M3: Policy Search Input (Client Component)

**Files to create**:
- `src/components/features/policy/PolicySearch.tsx` — Controlled input, 300ms debounce, `useRouter().replace()` on change, clear (X) button, loading indicator; placeholder cycles through domain examples
- `src/components/features/policy/__tests__/PolicySearch.test.tsx` — TDD

---

### M4: Filter Panel (Client Component)

**New shadcn components needed** (install before implementation):
```bash
pnpx shadcn@latest add checkbox radio-group select slider combobox
```

**Files to create**:
- `src/components/features/policy/PolicyFilter.tsx` — Reads filter values from `useSearchParams()`, updates URL on change, shows filter count badge; desktop: inline; mobile: Sheet
- `src/components/features/policy/ActiveFilterBadges.tsx` — Dismissible badge chips for active filters
- `src/components/features/policy/__tests__/PolicyFilter.test.tsx` — TDD
- `src/components/features/policy/__tests__/ActiveFilterBadges.test.tsx` — TDD

**Filter controls**:
| Filter | UI Component | Values |
|--------|-------------|--------|
| 카테고리 | Checkbox group | housing, employment, startup, childcare, education, welfare, culture |
| 지역 | Combobox (searchable) | 17 시도 names, MVP only |
| 혜택 유형 | Checkbox group | 현금, 바우처, 서비스, 대출 |
| 상태 | Radio group | 모두 보기(default), 진행 중, 마감, 예정 |
| 직업 | Select dropdown | employee, self-employed, student, unemployed, retired |
| 가족 상태 | Radio group | 해당 없음, 기혼, 한부모, 다문화 |
| 나이 범위 | Dual-handle Slider | 0-100, stored as age_min + age_max |
| 정렬 | Select dropdown | 최신순, 마감임박순, 관련도순 |

---

### M5: Policy Card + Policy Detail Page

**Files to create**:
- `src/components/features/policy/PolicyCard.tsx` — Client component; category badge(s), benefitType badge, title, 2-line description truncated, D-Day badge (using getDday()), save/bookmark button (useSession); links to `/policies/[id]`
- `src/app/(main)/policies/[id]/page.tsx` — Server component; calls getPolicyById, renders PolicyDetail, sets SEO metadata, handles 404 via notFound()
- `src/app/(main)/policies/[id]/loading.tsx` — Skeleton for detail page
- `src/components/features/policy/PolicyDetail.tsx` — Server component; full policy detail, Eligibility Checklist section
- `src/components/features/policy/EligibilityChecklist.tsx` — Sub-component; renders criteria as ✅/🟡/❌ items for logged-in users; blurred CTA for anonymous users
- `src/lib/utils/eligibility.ts` — Pure function: `matchEligibility(criteria, profile)` → `EligibilityResult[]`
- Test files for each component

**D-Day badge styling**:
- <= 7 days: amber/orange, "D-N" — urgent
- <= 30 days: yellow, "D-N" — approaching
- > 30 days: gray, "D-N" — calm
- Deadline passed: muted, "마감"

---

### M6: Pagination Component

**New shadcn needed**: `pnpx shadcn@latest add pagination`

**Files to create**:
- `src/components/features/policy/PolicyPagination.tsx` — Shows "전체 N개 정책" count, prev/next, numbered pages (up to 5 with ellipsis), preserves all URL params when updating `?page=N`
- `src/components/features/policy/__tests__/PolicyPagination.test.tsx` — TDD

---

### M7: Cache Integration Verification

**Purpose**: Verify and optimize the cache wiring from M1 through M5.

**Files to modify**:
- `src/lib/queries/policy.queries.ts` — Add `buildCacheKey` using `crypto.createHash('md5')` with alphabetically-sorted params
- `src/lib/actions/policy.actions.ts` — Verify cache hit/miss/bypass paths are correct and tested

**No new files** — verification and optimization milestone only.

**Performance targets**:
- Policy list with cache hit: < 200ms TTFB
- Policy list cache miss: < 800ms TTFB
- Policy detail with cache hit: < 150ms TTFB

---

### M8: Empty States + Error Handling + Integration + E2E Tests

**Files to create**:
- `tests/integration/policy-search.test.ts` — Integration tests with real Prisma (test DB): filter combinations, pagination, empty results
- `tests/e2e/policy-search.spec.ts` — Playwright E2E: search → filter → detail page → back button → filter state preserved

**Empty state specifications**:
- Zero results with active filters: "지역 조건을 제거하면 N개를 볼 수 있습니다." + one-click "지역 조건 제거" button
- Zero results with no filters: "현재 등록된 정책이 없습니다. 잠시 후 다시 확인해 주세요."
- Zero results for search query: "'`{query}`'에 대한 검색 결과가 없습니다. 다른 검색어를 시도해 보세요."

---

## EARS Requirements Summary

| ID | Type | Statement |
|----|------|-----------|
| REQ-UI-001 | UBIQUITOUS | The system shall always display policies in paginated format (20/page default) with total count and all state in URL |
| REQ-UI-002 | EVENT-DRIVEN | When a user submits a search query (300ms debounce), the system shall filter results and update the URL |
| REQ-UI-003 | UNWANTED | The system must not lose filter state when navigating between detail and list pages |
| REQ-UI-004 | STATE-DRIVEN | While any filter is applied, the system shall display dismissible badge chips for active filters |
| REQ-UI-005 | OPTIONAL | If user is authenticated with a profile regionId, the system may pre-populate the region filter on first visit |
| REQ-UI-006 | EVENT-DRIVEN | When user taps "필터" on mobile, the system shall open a full-height Sheet with all filter controls |
| REQ-UI-007 | STATE-DRIVEN | While viewing a policy detail page authenticated with UserProfile, the system shall render the Eligibility Checklist |
| REQ-UI-008 | UBIQUITOUS | The system shall always check Redis cache before Prisma queries, with graceful bypass on Redis failure |
| REQ-UI-009 | UNWANTED | The system must not show blank or broken UI during data fetching or zero results |
| REQ-UI-010 | UBIQUITOUS | The system shall always maintain all 266 pre-existing tests in passing state |

---

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Filter state storage | URL query params | Shareable, SSR-compatible, browser history compatible |
| Search implementation | Prisma `contains` | No schema migration required; sufficient for MVP Korean substring matching |
| Server/Client boundary | Server for list+detail, Client for filters+search | SEO + performance + interactivity only where needed |
| Pagination style | Numbered pagination | Users need to know total count and feel in control |
| Region depth | 시도 level only (MVP) | 17 items seeded; manageable; expand to 시군구 later |
| Mobile filter | Sheet (bottom drawer) | Established pattern in Header.tsx; avoids modal; full-height for complex filters |
| Debounce duration | 300ms | Standard UX; fast feel without excessive server calls |
| Cache key strategy | Alphabetically-sorted params → MD5 hash | Prevents cache misses from param ordering |

---

## Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Filter URL param type conversion | `parseSearchParams()` is single source of truth, extensively unit-tested in M1 |
| Cache key explosion with many filters | Shorter TTL (5 min) for heavily-filtered results vs. base 15 min; hash strategy bounds key count |
| Korean search quality (substring only) | Document as known MVP constraint; post-MVP upgrade path is tsvector + pg_bigm |
| `eligibilityCriteria` JSONB schema variability | `matchEligibility()` defaults to "미확인" for any ambiguous data — never false positives |
| Server Component + auth (bookmark) | PolicyCard is Client Component receiving all data as props; save is a server action |

---

## MX Tag Strategy

Code comments in Korean per `language.yaml` (`code_comments: 'ko'`).

| File | Tag | Reason |
|------|-----|--------|
| `policy.actions.ts` — `getPolicies` | `@MX:ANCHOR` | fan_in >= 3: called by page.tsx, tests, future recommendation engine |
| `policy.queries.ts` — `buildPolicyWhere` | `@MX:NOTE` | Complex filter-to-Prisma-where mapping; non-obvious business rule |
| `policy.queries.ts` — `buildCacheKey` | `@MX:ANCHOR` | Cache consistency invariant: any change breaks Redis hit rates |
| `eligibility.ts` — `matchEligibility` | `@MX:WARN` | JSONB schema variability; eligibilityCriteria structure not guaranteed |
| `PolicyFilter.tsx` — URL update | `@MX:NOTE` | URL update must preserve all existing params, not replace all |
| `policy.actions.ts` — cache bypass | `@MX:NOTE` | Redis graceful degradation is intentional, not a bug |

---

## Estimated File Count

| Milestone | New Files | Modified Files |
|-----------|-----------|----------------|
| M1 | 4 | 1 (types/index.ts) |
| M2 | 4 | 0 |
| M3 | 2 | 0 |
| M4 | 4 | 0 (+5 shadcn) |
| M5 | 7 | 0 |
| M6 | 2 | 0 (+1 shadcn) |
| M7 | 0 | 2 |
| M8 | 3 | 1 |
| **Total** | **26** | **4** |

Total: ~30 files (matches ROADMAP estimate of ~30).

---

## Recommended Implementation Sequence

M1 → M5 (card first, then detail) → M2 (list page, now has PolicyCard) → M3 → M4 → M6 → M7 → M8

---

## Out of Scope

| Feature | Future SPEC |
|---------|------------|
| Save/bookmark policy (UserSavedPolicy) | SPEC-USER-001 |
| AI recommendations | SPEC-AI-001 |
| Push notification on deadline | SPEC-NOTIF-001 |
| 시군구 region tree (full 3-level) | SPEC-UI-002 |
| tsvector full-text search | Post-MVP |
| Policy comparison feature | Post-MVP |
| User profile setup flow | SPEC-USER-001 |
