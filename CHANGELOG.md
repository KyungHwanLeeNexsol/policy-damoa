# Changelog

All notable changes to 정책다모아 (Policy-Damoa) are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added — SPEC-UI-001: 정책 검색·필터링 UI

**구현 날짜**: 2026-04-06

**신규 파일 (21개)**

- `src/app/(main)/policies/page.tsx` — 정책 목록 서버 컴포넌트 (REQ-UI-001~006)
- `src/app/(main)/policies/error.tsx` — 목록 에러 바운더리
- `src/app/(main)/policies/[id]/page.tsx` — 정책 상세 서버 컴포넌트 (REQ-UI-007~011)
- `src/app/(main)/policies/[id]/loading.tsx` — 상세 스켈레톤 로딩
- `src/features/policies/actions/policy.actions.ts` — getPolicies, getPolicyById, getRegions, getCategories (Redis 캐시 → Prisma 폴백)
- `src/features/policies/actions/policy.queries.ts` — buildPolicyWhere, buildCacheKey(MD5), buildOrderBy
- `src/features/policies/components/PolicyCard.tsx` — D-Day 배지, urgency 변형 카드
- `src/features/policies/components/PolicyDetail.tsx` — 정책 상세 뷰
- `src/features/policies/components/PolicyFilter.tsx` — 데스크탑 인라인 + 모바일 Sheet 필터
- `src/features/policies/components/PolicySearch.tsx` — 300ms 디바운스 검색 입력
- `src/features/policies/components/PolicyList.tsx` — 서버 컴포넌트 정책 목록
- `src/features/policies/components/PolicyPagination.tsx` — URL 기반 페이지네이션
- `src/features/policies/components/ActiveFilterBadges.tsx` — 활성 필터 배지 (X 제거)
- `src/features/policies/components/EligibilityChecklist.tsx` — 자격 체크리스트 (비로그인 CTA)
- `src/features/policies/components/PolicyEmptyState.tsx` — 빈 상태 (검색/필터/전체)
- `src/features/policies/schemas/search.ts` — Zod searchParamsSchema, parseSearchParams()
- `src/features/policies/types/index.ts` — @/types 재수출
- `src/features/policies/utils/eligibility.ts` — matchEligibility() JSONB 파싱

**수정 파일 (2개)**

- `src/types/index.ts` — PolicySearchFilters에 occupation, familyStatus, page, pageSize 추가; PolicyWithCategories 인터페이스 추가
- `src/features/policies/components/PolicySearch.tsx` — react-hooks/set-state-in-effect ESLint 오류 수정 (useEffect → 렌더 중 파생 state 패턴)

**테스트**: 91 / 91 통과 (12개 테스트 파일)

**인수 기준**: 10 / 10 완료

---

## [0.3.0] — SPEC-API-001: 데이터 파이프라인

구현 날짜: 2026-04-05 (이전 SPEC)

- Vercel Cron Job 기반 정책 데이터 수집 파이프라인
- data.go.kr 공공데이터 API 연동
- 보조금24 API 연동
- Redis 캐시 레이어 (15분 목록 / 30분 상세)

---

## [0.2.0] — SPEC-INFRA-001: 프로젝트 기반

- Next.js 16.2.2 App Router 초기 설정
- NextAuth v5 (Kakao / Naver / Google OAuth)
- Prisma 7.x + PostgreSQL (Neon) 스키마
- shadcn/ui 컴포넌트 라이브러리
- Vitest + Playwright 테스트 환경
- Redis (Upstash) 캐시 인프라
