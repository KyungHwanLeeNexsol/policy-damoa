# SPEC-UI-001 Research: Policy Search & Filtering UI

**Date**: 2026-04-06
**Researcher**: Explore subagent (MoAI)
**Status**: Complete

---

## Architecture Summary

### Current File Structure (Post INFRA-001 + API-001)

```
src/
├── app/
│   ├── (auth)/login/          - Authentication pages
│   ├── (main)/                - Main layout (Header, Sidebar, Footer, Navigation)
│   │   ├── policies/          - Policy list page (loading.tsx skeleton only)
│   │   │   └── loading.tsx    - Suspense skeleton (6 card placeholders)
│   ├── api/
│   │   ├── auth/[...nextauth] - NextAuth v5 route
│   │   └── cron/              - Vercel Cron routes (sync-public-data, sync-bojo24)
├── components/
│   ├── ui/                    - shadcn/ui: button, card, dialog, dropdown-menu,
│   │                            avatar, input, separator, sheet, skeleton, badge
│   ├── layout/                - Header, Footer, Sidebar, Navigation
│   ├── common/                - EmptyState, LoadingSpinner, ErrorBoundary
│   └── providers/             - AuthProvider, QueryProvider, ThemeProvider
├── lib/
│   ├── auth.ts                - NextAuth v5 config (Kakao, Naver, Google)
│   ├── db.ts                  - Prisma client singleton (Proxy pattern)
│   ├── redis.ts               - Upstash Redis singleton (graceful degradation)
│   ├── utils.ts               - cn(), formatDate(), formatCurrency(), getDday(), truncate()
│   └── constants.ts           - App name, categories, pagination defaults, cache TTLs
├── services/
│   ├── cache/policy.cache.ts  - Redis caching layer (list, detail, invalidation)
│   └── data-collection/       - API integration (publicDataPortal, bojo24)
└── types/index.ts             - Policy, PolicyCategory, Region, UserProfile types
```

### Key Dependency Versions

| Package | Version | Notes |
|---------|---------|-------|
| Next.js | 16.2.2 | App Router, Server Components |
| React | 19.2.4 | |
| TypeScript | 5.x | strict mode |
| @prisma/client | 7.6.0 | |
| next-auth | 5.0.0-beta.30 | v5 beta, Kakao/Naver/Google |
| @upstash/redis | 1.37.0 | graceful degradation |
| @tanstack/react-query | 5.80.6 | QueryProvider wrapper exists |
| tailwindcss | 4.x | |
| Vitest | 4.1.2 | jsdom, @testing-library/jest-dom |
| Playwright | 1.59.1 | E2E tests |

**Path alias**: `@` → `src/`

---

## Policy Data Model

### Policy Schema (Full)

```prisma
model Policy {
  id                  String    @id @default(cuid())
  externalId          String    @unique
  title               String
  description         String?   @db.Text
  eligibilityCriteria Json?     // JSONB: flexible criteria structure
  additionalConditions Json?    // JSONB: extra conditions
  benefitType         String?   // cash | voucher | service | loan
  benefitAmount       String?
  applicationMethod   String?   @db.Text
  applicationDeadline DateTime?
  sourceUrl           String?
  sourceAgency        String?
  regionId            String?
  region              Region?   @relation(...)
  categories          PolicyCategoryRelation[]
  savedByUsers        UserSavedPolicy[]
  status              String    @default("active") // active | expired | upcoming
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([title])
  @@index([regionId])
  @@index([applicationDeadline])
}
```

### Region Hierarchy (3-level Korean administrative)

```prisma
model Region {
  id       String
  name     String
  code     String  @unique  // e.g., "11" for Seoul, "11110" for 종로구
  level    Int              // 1=시도(17개), 2=시군구(~230개), 3=읍면동
  parentId String?
  parent   Region?  @relation("RegionHierarchy", fields: [parentId], references: [id])
  children Region[] @relation("RegionHierarchy")
  policies Policy[]
}
```

- Seed data: 17 시도 regions (from SPEC-API-001 seed.ts)
- 시군구 not yet seeded (need to add for region tree)

### PolicyCategory Model

```prisma
model PolicyCategory {
  id          String
  name        String @unique
  slug        String @unique  // housing, employment, startup, childcare, education, welfare, culture
  description String?
  icon        String?
  policies    PolicyCategoryRelation[]
}
```

**8 categories seeded**: housing, employment, startup, childcare, education, welfare, culture (+ 1 more)

### UserProfile Model (for filter suggestions)

```prisma
model UserProfile {
  id            String
  userId        String   @unique
  birthYear     Int?
  gender        String?
  occupation    String?  // employee, self-employed, student, unemployed, retired, etc.
  incomeLevel   String?
  regionId      String?
  familyStatus  String?  // single | married | single-parent | multicultural
  isPregnant    Boolean
  hasChildren   Boolean
  childrenCount Int
  isDisabled    Boolean
  isVeteran     Boolean
  additionalInfo Json?
}
```

### Existing Type Definitions (src/types/index.ts)

```typescript
export interface PolicySearchFilters {
  query?: string;
  categoryId?: string;
  regionCode?: string;
  ageRange?: { min: number; max: number };
  benefitType?: string;
  status?: 'active' | 'expired' | 'upcoming';
  sortBy?: 'newest' | 'deadline' | 'relevance';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

**Note**: `occupation` and `familyStatus` filters need to be added to `PolicySearchFilters`.

---

## Existing Patterns Found

### Component Patterns

**1. Client Component Pattern** (`'use client'` directive)
- Used for all interactive components (Header, Navigation)
- `usePathname()` from `next/navigation` for route-based active state
- `useSession()` from `next-auth/react` for auth state
- Lucide React icons throughout

**2. Responsive Layout Pattern**
- Desktop: Sidebar (w-56, `hidden lg:flex`) + main content
- Mobile: Sheet menu (hamburger) + bottom navigation bar
- `lg:hidden` / `hidden lg:flex` pattern consistently used
- `pb-14 lg:pb-0` to avoid bottom nav overlap

**3. shadcn/ui Usage Pattern**
```typescript
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
// cn() utility for conditional classes
className={cn('base-classes', isActive && 'active-classes')}
```

**4. Active State Detection** (Sidebar.tsx pattern)
```typescript
const isActive = pathname?.startsWith(href);
// For query param matching:
const isActive = pathname?.includes(href.split('?')[0]) && 
  href.includes(new URLSearchParams(href.split('?')[1]).get('category') ?? '');
```

**5. Loading Skeleton Pattern** (policies/loading.tsx)
```tsx
import { Skeleton } from '@/components/ui/skeleton';
// Grid of 6 card placeholders during loading
```

### API/Caching Patterns

**1. Redis Cache Key Pattern**
```typescript
// List cache: hash of filter params
const cacheKey = `policy:list:filter:${filterHash}`;
// Detail cache
const cacheKey = `policy:detail:${id}`;
```

**2. Graceful Degradation Pattern** (policy.cache.ts)
```typescript
try {
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
} catch {
  return null; // Redis failure → fetch from DB
}
```

**3. Prisma Singleton** (db.ts)
```typescript
const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

**4. Cache TTL Constants** (constants.ts)
```typescript
export const CACHE_TTL = {
  API_RESPONSE: 6 * 60 * 60,     // 6 hours
  POLICY_LIST: 15 * 60,          // 15 minutes
  POLICY_DETAIL: 30 * 60,        // 30 minutes
};
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
```

### Testing Patterns

- Test files: `src/**/*.test.ts`, `src/**/*.test.tsx`, `tests/**/*.test.ts`
- Vitest config: jsdom environment, setup file `tests/setup.ts`
- Mocking: `vi.mock()`, `vi.useFakeTimers()`, `vi.resetModules()`
- Naming: `describe('Component', () => { it('should ...', () => {}) })`
- Integration tests in `tests/integration/` directory
- 110 tests from INFRA-001, 156 tests from API-001 (all must continue passing)

---

## Reference Implementations

| Reference | File | Line Range | Use For |
|-----------|------|------------|---------|
| Sheet mobile menu | `src/components/layout/Header.tsx` | ~40-80 | Mobile filter panel |
| Sidebar active state | `src/components/layout/Sidebar.tsx` | ~29-71 | Active filter detection |
| Bottom nav layout | `src/components/layout/Navigation.tsx` | ~27-57 | Mobile layout constraint |
| Loading skeleton | `src/app/(main)/policies/loading.tsx` | ~5-31 | Policy card skeletons |
| Empty state | `src/components/common/EmptyState.tsx` | ~19-40 | No results state |
| Cache layer | `src/services/cache/policy.cache.ts` | full | Policy list caching |
| Utility functions | `src/lib/utils.ts` | full | getDday, formatDate |
| Category sidebar | `src/components/layout/Sidebar.tsx` | ~29-71 | Category filter tabs |

---

## Filter Field Mapping

| Filter UI | PolicySearchFilters field | Prisma where clause | Multiple Select |
|-----------|--------------------------|---------------------|-----------------|
| 지역 (Region tree) | `regionCode: string` | `region: { code: regionCode }` | No (single region) |
| 나이 범위 (Age range) | `ageRange: { min, max }` | Calculated from birthYear in UserProfile | No |
| 직업 (Occupation) | `occupation: string` (add) | `eligibilityCriteria` JSONB query | Yes |
| 가족 상태 (Family status) | `familyStatus: string` (add) | `eligibilityCriteria` JSONB query | No |
| 카테고리 (Category) | `categoryId: string` | `categories: { some: { categoryId } }` | Yes |
| 혜택 유형 (Benefit type) | `benefitType: string` | `benefitType: { equals: ... }` | Yes |
| 상태 (Status) | `status: string` | `status: { equals: ... }` | No |
| 정렬 (Sort) | `sortBy: string` | `orderBy` clause | No |

**Note**: `occupation` and `familyStatus` filters work against `eligibilityCriteria` JSONB field since Policy doesn't have direct occupation/familyStatus columns. The filters should match eligibility conditions stored as JSON.

---

## Full-text Search Analysis

### Current State
- Prisma schema has `@@index([title])` for basic title lookups
- No PostgreSQL tsvector setup found
- Korean text: No morphological analyzer configured

### Recommendation for MVP (SPEC-UI-001)

**Option A (Simple - Recommended for MVP)**: PostgreSQL `ILIKE` via Prisma `contains`
```typescript
// In Prisma query
where: {
  OR: [
    { title: { contains: query, mode: 'insensitive' } },
    { description: { contains: query, mode: 'insensitive' } },
    { sourceAgency: { contains: query, mode: 'insensitive' } },
  ]
}
```
- Works immediately, no schema changes
- Sufficient for Korean substring matching at MVP scale
- Can be upgraded to tsvector later

**Option B (Production-grade)**: PostgreSQL tsvector with `pg_bigm` extension
```sql
-- Migration: add search column
ALTER TABLE "Policy" ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, ''))) STORED;
CREATE INDEX idx_policy_fts ON "Policy" USING gin(search_vector);
```
- Requires `pg_bigm` extension for proper Korean tokenization
- Production-scale performance (10k+ policies)
- Plan for post-MVP upgrade

**SPEC-UI-001 should use Option A** and include Option B as a post-MVP upgrade path.

---

## Risks and Constraints

### Technical Risks

1. **Region Tree Selector Complexity**
   - 3-level hierarchy (시도 → 시군구 → 읍면동)
   - Currently only 17 시도 seeded; 시군구 data needed for full tree
   - Mitigation: MVP uses only 시도 level; expand later

2. **Filter State URL Synchronization**
   - Filters stored as URL query params for shareable links and SSR
   - Risk: URL becomes very long with many filters
   - Mitigation: Use short param names, limit to 3-4 filters for MVP

3. **Cache Key Explosion**
   - Each filter combination creates a new cache entry
   - With 5 filters × 5 values each = 3,125 possible combinations
   - Mitigation: Sort filter keys alphabetically before hashing; set aggressive TTL (5 min for filtered results)

4. **Korean Search Quality**
   - `contains` will match substrings but not morphological variants
   - Example: "청년" will not match "청소년" and vice versa
   - Mitigation: Document limitation in SPEC; plan tsvector upgrade in SPEC-AI-001

5. **Server Component + Client State**
   - Filter panel needs to be a Client Component (user interactions)
   - Policy list should be a Server Component (SEO, initial load)
   - Boundary: FilterPanel (client) → URL params → PolicyList (server re-render)

### Performance Considerations

- Default page size: 20 (from constants.ts)
- Max page size: 100 (from constants.ts)
- Cache TTL: 15 min for lists (POLICY_LIST in CACHE_TTL constants)
- Region data: Cache region tree statically (rarely changes)
- Include policy count in filter response for "N개 결과" display

### Mobile Constraints

- Filter sheet: Full-screen Sheet component (existing pattern in Header.tsx)
- Policy cards: 1 column mobile → 2 columns tablet → 2-3 desktop
- Min button height: 44px (touch target accessibility)
- Bottom nav: `pb-14 lg:pb-0` padding on policy list page (existing pattern)
- Sticky search bar: Fixed at top on scroll

---

## Implementation Recommendations

### Recommended Page Structure

```
src/app/(main)/
└── policies/
    ├── page.tsx           # Server component: list + filter state from searchParams
    ├── loading.tsx        # Already exists (Skeleton placeholders)
    ├── error.tsx          # Error boundary
    └── [id]/
        ├── page.tsx       # Server component: policy detail
        └── loading.tsx    # Detail loading skeleton

src/components/features/policy/
├── PolicyCard.tsx         # Client: Card with save button, deadline badge
├── PolicyList.tsx         # Server: Grid of PolicyCard components
├── PolicyFilter.tsx       # Client: Filter panel (Sheet on mobile, sidebar on desktop)
├── PolicySearch.tsx       # Client: Search input with debounce
├── PolicyPagination.tsx   # Client: Page navigation
└── PolicyDetail.tsx       # Server: Detail view with eligibility checklist

src/lib/actions/
└── policy.actions.ts      # Server actions: getPolicies(), getPolicyById()

src/lib/queries/
└── policy.queries.ts      # Prisma query builders: buildPolicyWhere(), etc.
```

### Key Libraries Already Installed (No New Install Needed)
- `@radix-ui/react-dialog` → Sheet for mobile filter panel
- `@tanstack/react-query` → Client-side optimistic updates (save/unsave)
- `lucide-react` → All icons
- All shadcn/ui base components

### New shadcn Components Needed
```bash
pnpx shadcn@latest add slider         # Age range slider
pnpx shadcn@latest add combobox       # Region selector
pnpx shadcn@latest add checkbox       # Multi-select filters
pnpx shadcn@latest add radio-group    # Single-select filters
pnpx shadcn@latest add toggle-group   # Category tabs
pnpx shadcn@latest add pagination     # Page navigation
pnpx shadcn@latest add select         # Sort dropdown
```

### Server Action Pattern (Recommended Approach)

```typescript
// src/lib/actions/policy.actions.ts
'use server'

export async function getPolicies(
  filters: PolicySearchFilters,
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<PaginatedResponse<Policy>> {
  // 1. Check Redis cache
  const cacheKey = buildCacheKey(filters, page, pageSize);
  const cached = await getCachedPolicyList(cacheKey);
  if (cached) return cached;

  // 2. Build Prisma where clause
  const where = buildPolicyWhere(filters);

  // 3. Execute parallel count + data query
  const [total, data] = await Promise.all([
    prisma.policy.count({ where }),
    prisma.policy.findMany({
      where,
      take: pageSize,
      skip: (page - 1) * pageSize,
      orderBy: buildOrderBy(filters.sortBy),
      include: { categories: { include: { category: true } }, region: true }
    })
  ]);

  // 4. Cache and return
  const result = { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  await setCachedPolicyList(cacheKey, result);
  return result;
}
```

---

## Summary: All Required Work for SPEC-UI-001

| Area | Status | Notes |
|------|--------|-------|
| Policy model | ✅ Exists | All fields available |
| Region model | ✅ Exists | 시도 seeded; 시군구 needs expansion |
| Category model | ✅ Exists | 8 categories seeded |
| Cache layer | ✅ Exists | policy.cache.ts ready to extend |
| Type definitions | ⚠️ Partial | `PolicySearchFilters` missing occupation/familyStatus |
| Policy list page | ❌ Missing | Need page.tsx, loading.tsx exists |
| Policy detail page | ❌ Missing | Need [id]/page.tsx |
| Filter panel | ❌ Missing | New component |
| Search input | ❌ Missing | New component |
| Pagination | ❌ Missing | New component |
| Server actions | ❌ Missing | Need policy.actions.ts |
| shadcn additions | ❌ Missing | slider, combobox, checkbox, radio-group, pagination, select |
| tsvector search | ❌ Missing | Use `contains` for MVP |
