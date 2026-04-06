## Task Decomposition
SPEC: SPEC-UI-001

| Task ID | Description | Requirement | Dependencies | Planned Files | Status |
|---------|-------------|-------------|--------------|---------------|--------|
| T-001 | PolicySearchFilters 타입 확장 | REQ-UI-001 | - | src/types/index.ts | pending |
| T-002 | PolicyWithCategories 타입 정의 | REQ-UI-001 | - | src/features/policies/types/index.ts | pending |
| T-003 | URL 파라미터 Zod 스키마 | REQ-UI-001, REQ-UI-002 | T-001 | src/features/policies/schemas/search.ts | pending |
| T-004 | buildPolicyWhere, buildCacheKey 구현 | REQ-UI-001, REQ-UI-009 | T-001, T-002 | src/features/policies/actions/policy.queries.ts | pending |
| T-005 | getPolicies, getPolicyById Server Actions | REQ-UI-001, REQ-UI-009 | T-002, T-004 | src/features/policies/actions/policy.actions.ts | pending |
| T-006 | matchEligibility 유틸 | REQ-UI-007, REQ-UI-008 | - | src/features/policies/utils/eligibility.ts | pending |
| T-007 | PolicyCard 컴포넌트 | REQ-UI-001, REQ-UI-003 | T-005 | src/features/policies/components/PolicyCard.tsx | pending |
| T-008 | EligibilityChecklist 컴포넌트 | REQ-UI-007, REQ-UI-008 | T-006 | src/features/policies/components/EligibilityChecklist.tsx | pending |
| T-009 | Policy 상세 페이지 | REQ-UI-007, REQ-UI-008 | T-005, T-007, T-008 | src/app/(main)/policies/[id]/page.tsx, src/app/(main)/policies/[id]/loading.tsx | pending |
| T-010 | PolicyDetail 컴포넌트 | REQ-UI-007 | T-008 | src/features/policies/components/PolicyDetail.tsx | pending |
| T-011 | Policy 목록 페이지 | REQ-UI-001, REQ-UI-006 | T-005, T-007 | src/app/(main)/policies/page.tsx, src/app/(main)/policies/error.tsx | pending |
| T-012 | PolicyList 컴포넌트 | REQ-UI-001, REQ-UI-010 | T-007 | src/features/policies/components/PolicyList.tsx | pending |
| T-013 | PolicySearch 컴포넌트 (debounce) | REQ-UI-002 | - | src/features/policies/components/PolicySearch.tsx | pending |
| T-014 | shadcn 컴포넌트 설치 (M4용) | REQ-UI-004, REQ-UI-005 | - | shadcn: select, checkbox, radio-group, popover, command | pending |
| T-015 | PolicyFilter 컴포넌트 | REQ-UI-004, REQ-UI-005 | T-014 | src/features/policies/components/PolicyFilter.tsx | pending |
| T-016 | ActiveFilterBadges 컴포넌트 | REQ-UI-004 | T-014 | src/features/policies/components/ActiveFilterBadges.tsx | pending |
| T-017 | shadcn pagination 설치 + PolicyPagination 컴포넌트 | REQ-UI-001 | - | src/features/policies/components/PolicyPagination.tsx | pending |
| T-018 | 캐시 통합 검증 테스트 | REQ-UI-009 | T-004, T-005 | 기존 파일 업데이트 | pending |
| T-019 | PolicyEmptyState 컴포넌트 | REQ-UI-010 | - | src/features/policies/components/PolicyEmptyState.tsx | pending |
| T-020 | E2E 테스트 | REQ-UI-001~010 | T-011~T-017 | tests/e2e/policies.spec.ts | pending |
