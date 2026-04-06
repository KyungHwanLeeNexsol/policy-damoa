---
id: SPEC-UI-001
version: '1.0.0'
status: draft
created: '2026-04-06'
updated: '2026-04-06'
author: zuge3
priority: P1
issue_number: 0
---

## HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-04-06 | zuge3 | Initial draft |

---

# SPEC-UI-001: Policy Search & Filtering UI

## Overview

정책다모아의 핵심 사용자 경험을 구현한다. 서버사이드 페이지네이션과 필터링이 적용된 정책 목록 페이지, 자격 체크리스트가 포함된 정책 상세 페이지, 다중 조건 필터 패널, 전문 검색(한국어), 모바일 최적화 반응형 UI를 포함한다.

이 SPEC은 SPEC-API-001이 수집하고 저장한 정책 데이터를 사용자에게 시각적으로 전달하는 인터페이스다.

**Depends on**:
- SPEC-INFRA-001 (Next.js 16, App Router, shadcn/ui, 레이아웃 컴포넌트, 110 tests)
- SPEC-API-001 (Policy/Region/Category 데이터, Redis 캐싱 레이어, 156 tests)

**Affects files**:
- `src/app/(main)/policies/page.tsx` [NEW]
- `src/app/(main)/policies/[id]/page.tsx` [NEW]
- `src/app/(main)/policies/[id]/loading.tsx` [NEW]
- `src/app/(main)/policies/error.tsx` [NEW]
- `src/components/features/policy/PolicyCard.tsx` [NEW]
- `src/components/features/policy/PolicyList.tsx` [NEW]
- `src/components/features/policy/PolicyFilter.tsx` [NEW]
- `src/components/features/policy/PolicySearch.tsx` [NEW]
- `src/components/features/policy/PolicyPagination.tsx` [NEW]
- `src/components/features/policy/PolicyDetail.tsx` [NEW]
- `src/components/features/policy/EligibilityChecklist.tsx` [NEW]
- `src/components/features/policy/ActiveFilterBadges.tsx` [NEW]
- `src/lib/actions/policy.actions.ts` [NEW]
- `src/lib/queries/policy.queries.ts` [NEW]
- `src/lib/utils/eligibility.ts` [NEW]
- `src/types/index.ts` [MODIFY]

**What NOT to Build**:
- 정책 저장/북마크 기능 (UserSavedPolicy) → SPEC-USER-001
- AI 추천 엔진 → SPEC-AI-001
- 마감 임박 푸시 알림 → SPEC-NOTIF-001
- 시군구 단위 지역 트리 (3단계 계층) → post-MVP
- tsvector 전문 검색 (형태소 분석) → post-MVP
- 정책 비교 기능 → post-MVP
- 사용자 프로필 설정 플로우 → SPEC-USER-001

---

## Requirements

### Module 1: Policy List & Pagination

**REQ-UI-001** [UBIQUITOUS]
The system shall always display policies in paginated format showing 20 items per page by default, with total count displayed as "전체 N개 정책" above the list, and all filter state and pagination state encoded in URL query parameters to support sharing and browser history navigation.

**REQ-UI-002** [EVENT-DRIVEN]
When a user submits a search query (after 300ms debounce from last keystroke), the system shall query Policy.title, Policy.description, and Policy.sourceAgency using case-insensitive substring matching, reset the page to 1, update the URL with `?q={query}`, and display the updated results with the total count.

**REQ-UI-003** [UNWANTED]
The system must not lose filter state when a user navigates from the policy list to a policy detail page and returns via the browser back button. The list page must restore the exact filter state from the URL on mount.

### Module 2: Filter Panel

**REQ-UI-004** [STATE-DRIVEN]
While any filter is applied (category, region, benefitType, status, occupation, familyStatus, or age range), the system shall display dismissible badge chips below the search bar — one badge per active filter — each showing a human-readable label in Korean and an X (removal) button. Clicking the X shall remove that filter from the URL and trigger a new search.

**REQ-UI-005** [EVENT-DRIVEN]
When a user taps the "필터" button on a viewport narrower than 1024px (mobile), the system shall open a full-height Sheet component from the bottom containing all filter controls. When the user taps "적용" or the Sheet close button, the Sheet shall close and the URL shall be updated with the selected filters.

**REQ-UI-006** [OPTIONAL]
If the user is authenticated and has a UserProfile with a non-null regionId, the system may pre-populate the region filter with the user's region when the URL contains no `?region=` parameter. This pre-population must not override an explicitly URL-specified region.

### Module 3: Policy Detail & Eligibility

**REQ-UI-007** [STATE-DRIVEN]
While a user is viewing a policy detail page and is authenticated with a UserProfile, the system shall render an Eligibility Checklist showing each criterion from the `eligibilityCriteria` JSONB field as a checklist item with one of three states: ✅ 충족 (confirmed match), 🟡 미확인 (profile data insufficient to confirm), ❌ 미충족 (confirmed non-match). The matching logic must default to 미확인 for any ambiguous or missing profile data.

**REQ-UI-008** [STATE-DRIVEN]
While a user is viewing a policy detail page and is not authenticated (or has no UserProfile), the system shall render the Eligibility Checklist section as blurred/obscured with a prominent CTA: "로그인하면 나에게 맞는지 확인할 수 있어요."

### Module 4: Caching & Performance

**REQ-UI-009** [UBIQUITOUS]
The system shall always check the Redis cache before executing Prisma database queries for both policy list and policy detail requests. The cache key for list requests shall be derived from an MD5 hash of alphabetically-sorted filter parameters (ensuring parameter-order-independent cache hits). On Redis failure, the system shall transparently bypass the cache and query Prisma directly without throwing an error to the user.

### Module 5: Loading & Empty States

**REQ-UI-010** [UNWANTED]
The system must not display a blank, broken, or spinner-only UI at any point during data fetching. During loading, the Next.js Suspense boundary shall display skeleton placeholder cards (the existing `policies/loading.tsx` handles this automatically). When results are empty due to active filters, the system shall display a contextual suggestion to relax the most restrictive filter with a one-click action. When results are empty for a search query, the system shall display the query string in the empty state message.

---

## Technical Approach

### Architecture

- **Server Components**: `policies/page.tsx`, `policies/[id]/page.tsx`, `PolicyList.tsx`, `PolicyDetail.tsx` — SSR for SEO and initial performance
- **Client Components**: `PolicySearch.tsx`, `PolicyFilter.tsx`, `PolicyPagination.tsx`, `PolicyCard.tsx`, `ActiveFilterBadges.tsx` — interactivity and URL updates via `useRouter().replace()`
- **Server Actions**: `policy.actions.ts` — `getPolicies()`, `getPolicyById()`, `getRegions()`, `getCategories()` — server-side data fetching with Redis cache integration
- **Pure Query Builders**: `policy.queries.ts` — `buildPolicyWhere()`, `buildCacheKey()`, `parseSearchParams()` — testable without I/O

### Data Flow

```
사용자 필터 변경(Client) → URL params 업데이트 → page.tsx 서버 재렌더
→ getPolicies() 서버 액션 → Redis 캐시 확인 → 캐시 미스 시 Prisma 쿼리
→ PolicyList(Server) → PolicyCard 렌더링
```

### URL Parameter Schema

```
?q=       → 검색어
?category= → 카테고리 슬러그
?region=   → 지역 코드 (시도)
?benefit=  → 혜택 유형
?status=   → 정책 상태
?sort=     → 정렬 순서
?age_min=  → 나이 범위 최솟값
?age_max=  → 나이 범위 최댓값
?occupation= → 직업
?family=   → 가족 상태
?page=     → 현재 페이지 (기본값 1)
```

### New shadcn Components Required

```bash
pnpx shadcn@latest add checkbox radio-group select slider combobox pagination
```

### Type Extensions Required

```typescript
// src/types/index.ts에 추가
export interface PolicySearchFilters {
  query?: string;
  categoryId?: string;
  regionCode?: string;
  ageRange?: { min: number; max: number };
  benefitType?: string;
  occupation?: string;      // 추가
  familyStatus?: string;    // 추가
  status?: 'active' | 'expired' | 'upcoming';
  sortBy?: 'newest' | 'deadline' | 'relevance';
}

export type PolicyWithRelations = Policy & {
  categories: (PolicyCategoryRelation & { category: PolicyCategory })[];
  region: Region | null;
};
```

### Known Limitations

- **한국어 검색**: Prisma `contains` (하위 문자열)만 지원. "청년" 검색 시 "청소년" 미매칭. post-MVP에서 tsvector + pg_bigm으로 업그레이드 예정.
- **지역 필터**: MVP에서 시도 단계(17개)만 지원. 시군구 계층 구조는 post-MVP.
- **자격 체크리스트**: JSONB 스키마 가변성으로 인해 일치 불확실 시 "미확인"으로 기본 처리.

---

## MX Tag Plan

| 파일 | 태그 | 이유 |
|------|------|------|
| `policy.actions.ts` — `getPolicies` | `@MX:ANCHOR` | fan_in ≥ 3: page.tsx, tests, 향후 추천 엔진에서 호출 |
| `policy.queries.ts` — `buildPolicyWhere` | `@MX:NOTE` | 복잡한 필터→Prisma where 매핑; 비즈니스 규칙이 명확하지 않음 |
| `policy.queries.ts` — `buildCacheKey` | `@MX:ANCHOR` | 캐시 일관성 불변 조건: 변경 시 Redis 적중률 파괴 |
| `eligibility.ts` — `matchEligibility` | `@MX:WARN` | JSONB 스키마 가변성; eligibilityCriteria 구조 보장 없음 |
| `PolicyFilter.tsx` — URL 업데이트 | `@MX:NOTE` | URL 업데이트는 모든 기존 파라미터를 보존해야 함 |
| `policy.actions.ts` — 캐시 우회 경로 | `@MX:NOTE` | Redis 그레이스풀 디그레이데이션은 의도적 동작, 버그 아님 |
