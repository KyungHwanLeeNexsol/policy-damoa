# SPEC-UI-001 Compact (Run Phase Reference)

## Requirements

### REQ-UI-001 [UBIQUITOUS]
The system shall always display policies paginated (20/page default), show "전체 N개 정책" count, and encode all filter+pagination state in URL query parameters.

### REQ-UI-002 [EVENT-DRIVEN]
When a user submits a search query (300ms debounce), the system shall run case-insensitive substring search on Policy.title + description + sourceAgency, reset page to 1, update `?q=` in URL, and display updated results.

### REQ-UI-003 [UNWANTED]
The system must not lose filter state when navigating to detail page and returning via browser back. URL encoding ensures state restoration.

### REQ-UI-004 [STATE-DRIVEN]
While any filter is applied, the system shall display dismissible badge chips below the search bar with human-readable Korean labels and X (removal) buttons.

### REQ-UI-005 [EVENT-DRIVEN]
When user taps "필터" on mobile (<1024px), the system shall open a full-height Sheet from the bottom with all filter controls. On "적용"/close, Sheet closes and URL updates.

### REQ-UI-006 [OPTIONAL]
If user is authenticated with UserProfile.regionId set, the system may pre-populate region filter when no `?region=` is in URL.

### REQ-UI-007 [STATE-DRIVEN]
While viewing policy detail page authenticated with UserProfile, the system shall render Eligibility Checklist: ✅ 충족 / 🟡 미확인 / ❌ 미충족 per criterion. Default to 미확인 for any ambiguous data.

### REQ-UI-008 [STATE-DRIVEN]
While viewing policy detail page unauthenticated, the system shall render blurred checklist with CTA: "로그인하면 나에게 맞는지 확인할 수 있어요."

### REQ-UI-009 [UBIQUITOUS]
The system shall always check Redis cache before Prisma queries. Cache key = MD5(alphabetically-sorted filter params). TTL: 15min list, 30min detail. Redis failure → graceful Prisma fallback.

### REQ-UI-010 [UNWANTED]
The system must not show blank/broken UI during loading or zero results. Skeleton cards during loading. Contextual suggestion with one-click filter relaxation on zero results.

### REQ-UI-011 [UBIQUITOUS]
The system shall always maintain all 266 pre-existing tests passing. New tests must achieve 80%+ coverage per commit, 85%+ aggregate by M8.

---

## Acceptance Criteria

| AC | Requirement | Verification |
|----|-------------|-------------|
| AC-UI-001 | List shows 20 cards with "전체 N개 정책" count | Test: 50 policies → 20 rendered, count shows 50 |
| AC-UI-002 | Search updates URL and filters results after 300ms | Test: type "청년 월세" → URL has `?q=청년 월세`, 3 results |
| AC-UI-003 | Filter state survives browser back navigation | E2E: navigate to detail, back, filter state preserved in URL |
| AC-UI-004 | Active filter badges appear and dismiss | Test: apply 2 filters → 2 badges; click X → badge gone, URL param removed |
| AC-UI-005 | Mobile filter Sheet opens/closes | E2E: mobile viewport, tap "필터" → sheet opens; "적용" → sheet closes |
| AC-UI-006 | Authenticated user sees Eligibility Checklist | Test: mock session + userProfile → checklist with ✅/🟡/❌ items |
| AC-UI-007 | Unauthenticated user sees blurred CTA | Test: no session → blurred checklist + CTA visible |
| AC-UI-008 | Redis cache checked before Prisma | Unit test: mock Redis hit → Prisma.findMany never called |
| AC-UI-009 | Zero results shows contextual suggestion | Test: zero results with filter → suggestion with one-click relaxation |
| AC-UI-010 | 266 pre-existing tests remain green | CI: `pnpm test` passes with no regressions |

---

## Files to Create/Modify

### New Files (~26)
- `src/app/(main)/policies/page.tsx`
- `src/app/(main)/policies/error.tsx`
- `src/app/(main)/policies/[id]/page.tsx`
- `src/app/(main)/policies/[id]/loading.tsx`
- `src/components/features/policy/PolicyCard.tsx`
- `src/components/features/policy/PolicyList.tsx`
- `src/components/features/policy/PolicyFilter.tsx`
- `src/components/features/policy/PolicySearch.tsx`
- `src/components/features/policy/PolicyPagination.tsx`
- `src/components/features/policy/PolicyDetail.tsx`
- `src/components/features/policy/EligibilityChecklist.tsx`
- `src/components/features/policy/ActiveFilterBadges.tsx`
- `src/lib/actions/policy.actions.ts`
- `src/lib/queries/policy.queries.ts`
- `src/lib/utils/eligibility.ts`
- Test files for each component/action/utility
- `tests/integration/policy-search.test.ts`
- `tests/e2e/policy-search.spec.ts`

### Modified Files (4)
- `src/types/index.ts` — Add occupation?, familyStatus? to PolicySearchFilters; add PolicyWithRelations type

### shadcn Components to Add
```bash
pnpx shadcn@latest add checkbox radio-group select slider combobox pagination
```

---

## What NOT to Build

- UserSavedPolicy bookmark feature
- AI recommendation engine
- Push notifications
- 시군구 region tree (full 3-level hierarchy)
- PostgreSQL tsvector full-text search
- Policy comparison feature
- User profile setup wizard
