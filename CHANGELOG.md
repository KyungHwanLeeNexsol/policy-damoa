# Changelog

All notable changes to 정책다모아 (Policy-Damoa) are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Changed — Pencil 디자인 정밀 반영 (UI/UX 개선)

**수정 날짜**: 2026-04-09

- `feat(design)`: 로고를 텍스트 기반에서 SVG 이미지 로고(`public/logo-icon.svg`)로 교체 — 그라디언트 레이어 아이콘(#4F6EF7→#6B8AFF)
- `feat(ui)`: Header 네비게이션 폰트·컬러·활성 상태 개선 (활성 탭 하단 2px 보더, `#4F6EF7`)
- `feat(ui)`: Header 검색 버튼 "통합검색" 텍스트 및 aria-label 추가
- `feat(ui)`: 홈 카테고리 탭 비활성 배경 `#F4F5F7`로 통일 (테두리 제거)
- `feat(ui)`: 로그인 페이지 설명 문구 및 하단 푸터 텍스트 디자인 명세 반영
- `style(format)`: Prettier CI 통과를 위한 3개 파일 포맷 수정

---

### Added — SPEC-AI-001: AI 기반 맞춤 정책 추천

**구현 날짜**: 2026-04-06

**신규 파일 (20개)**

- `src/lib/openai.ts` — Gemini 클라이언트 싱글톤 (gemini-2.0-flash, OpenAI-compatible endpoint)
- `src/lib/cache-ttl.ts` — CACHE_TTL 상수 (RECOMMENDATIONS=3600, SIMILAR_POLICIES=21600, BEHAVIOR_RECENT=1800)
- `src/services/ai/behavior-tracking.service.ts` — trackPolicyView, trackSearch, getRecentBehavior
- `src/services/ai/prompts/schemas.ts` — Gemini 구조화 출력용 Zod 스키마
- `src/services/ai/prompts/recommendation.prompt.ts` — PII 제거 프롬프트 빌더
- `src/services/ai/recommendation.service.ts` — 핵심 추천 엔진 (캐시→Gemini→폴백)
- `src/services/ai/similar-policies.service.ts` — 유사 정책 AI 재랭킹
- `src/features/recommendations/types/index.ts` — 추천 관련 타입 정의
- `src/features/recommendations/hooks/use-recommendations.ts` — TanStack Query 훅
- `src/features/recommendations/hooks/use-recommendation-feedback.ts` — 낙관적 업데이트 뮤테이션 훅
- `src/features/recommendations/actions/feedback.action.ts` — 피드백 Server Action
- `src/features/recommendations/components/recommendation-card.tsx` — 추천 카드 컴포넌트
- `src/features/recommendations/components/recommendation-feed.tsx` — 홈 피드 섹션
- `src/features/recommendations/components/similar-policies.tsx` — 유사 정책 섹션
- `src/features/recommendations/components/feedback-buttons.tsx` — 좋아요/싫어요 버튼
- `src/app/(main)/recommendations/page.tsx` — 전체 추천 페이지
- `src/app/api/recommendations/route.ts` — GET /api/recommendations (auth, 401/422/200)
- `src/app/api/recommendations/feedback/route.ts` — POST /api/recommendations/feedback
- `src/app/api/policies/[id]/similar/route.ts` — GET /api/policies/[id]/similar
- `src/app/api/cron/generate-recommendations/route.ts` — POST (x-cron-secret, 배치 50, 지수 백오프)

**수정 파일 (6개)**

- `prisma/schema.prisma` — PolicyView, SearchLog, PolicyRecommendation, RecommendationFeedback 모델 추가
- `src/app/(main)/page.tsx` — RecommendationFeed 섹션 추가
- `src/app/(main)/policies/[id]/page.tsx` — SimilarPolicies, trackPolicyView 추가
- `src/features/policies/actions/policy.actions.ts` — trackSearch 호출 추가
- `package.json` / `pnpm-lock.yaml` — openai 패키지 추가
- `.env.example` — GEMINI_API_KEY, CRON_SECRET 추가

**테스트**: 343 / 343 통과

**인수 기준**: 28 / 28 완료

---

### Fixed — TypeScript 타입 정합성 수정

**수정 날짜**: 2026-04-07

- `fix(types)`: `NotificationLog` Prisma 모델 필드 수정 — `createdAt` → `sentAt` (스키마 실제 컬럼명 반영)
- `fix(types)`: `UserProfileData` 인터페이스 nullable 필드 반영 — `birthYear`, `gender`, `occupation` 등을 `T | null`로 수정
- `fix(types)`: `getNotificationPreferences()` 반환 타입에 `DigestFrequency` 캐스팅 추가
- `fix(query)`: cron 라우트 빈 `include: {}` 객체 제거 (`match-policies`, `send-digest`)
- `fix(ui)`: `NotificationItem` 컴포넌트 날짜 필드 `createdAt` → `sentAt` 수정

---

### Fixed — TypeScript CI 오류 수정 (abfec31)

**수정 날짜**: 2026-04-07

- `fix(ci)`: TypeScript strict 모드 오류 수정 (notification services, AI services, profile actions)
- 의존성 추가: 테스트 환경에서 누락된 패키지 추가

---

### Added — SPEC-NOTIF-001: 사용자 프로필 및 알림 시스템

**구현 날짜**: 2026-04-06

**신규 파일 (40+개)**

- `src/features/user/schemas/profile.ts` — Zod 프로필 스키마
- `src/features/user/types/index.ts` — TypeScript 타입 정의
- `src/features/user/actions/profile.actions.ts` — Server Actions (saveProfile, getMyProfile)
- `src/features/user/actions/__tests__/profile.actions.test.ts` — 프로필 액션 테스트
- `src/features/user/hooks/use-profile-wizard.ts` — 위자드 상태 훅
- `src/features/user/components/ProfileWizard.tsx` — 6단계 위자드 루트 컴포넌트
- `src/features/user/components/wizard/StepBasicInfo.tsx` — Step 1: 기본 정보
- `src/features/user/components/wizard/StepOccupation.tsx` — Step 2: 직업·소득
- `src/features/user/components/wizard/StepRegion.tsx` — Step 3: 지역 선택
- `src/features/user/components/wizard/StepFamily.tsx` — Step 4: 가구 상황
- `src/features/user/components/wizard/StepSpecialConditions.tsx` — Step 5: 특수 조건
- `src/features/user/components/wizard/StepConfirmation.tsx` — Step 6: 확인·완료
- `src/features/user/components/wizard/WizardProgress.tsx` — 진행률 표시 컴포넌트
- `src/features/user/components/NotificationPreferences.tsx` — Push·이메일 설정 UI
- `src/features/notifications/schemas/preferences.ts` — Zod 알림 설정 스키마
- `src/features/notifications/types/index.ts` — 알림 관련 타입 정의
- `src/features/notifications/actions/notification.actions.ts` — markAsRead, markAllAsRead, saveNotificationPreferences
- `src/features/notifications/actions/notification.queries.ts` — 커서 페이지네이션 (PAGE_SIZE=20)
- `src/features/notifications/actions/__tests__/notification.actions.test.ts` — 액션 테스트
- `src/features/notifications/actions/__tests__/notification.queries.test.ts` — 쿼리 테스트
- `src/features/notifications/components/NotificationBadge.tsx` — 안읽음 배지 컴포넌트
- `src/features/notifications/components/NotificationList.tsx` — 알림 목록 컴포넌트
- `src/features/notifications/components/NotificationItem.tsx` — 알림 아이템 컴포넌트
- `src/features/notifications/components/NotificationEmptyState.tsx` — 빈 상태 컴포넌트
- `src/features/notifications/components/__tests__/` — 컴포넌트 테스트
- `src/features/notifications/hooks/use-notifications.ts` — usePushNotifications 훅
- `src/services/notification/matching.service.ts` — 배치 매칭 엔진 (50% 임계값)
- `src/services/notification/email.service.ts` — sendMatchEmail, sendDigestEmail, sendEmailNotification (재시도: 3회, 1s/2s/4s)
- `src/services/notification/push.service.ts` — sendPushNotification (VAPID)
- `src/services/notification/__tests__/matching.service.test.ts` — 매칭 서비스 테스트
- `src/services/notification/__tests__/email.service.test.ts` — 이메일 서비스 테스트
- `src/services/notification/__tests__/push.service.test.ts` — Push 서비스 테스트
- `src/app/(main)/profile/setup/page.tsx` — 프로필 위자드 페이지
- `src/app/(main)/profile/notifications/page.tsx` — 알림 설정 페이지
- `src/app/(main)/profile/page.tsx` — 프로필 리다이렉트
- `src/app/(main)/notifications/page.tsx` — 알림 히스토리 페이지
- `src/app/api/cron/match-policies/route.ts` — Cron: 매시간 정책 매칭
- `src/app/api/cron/send-digest/route.ts` — Cron: 매일 오전 8시 KST 다이제스트
- `src/app/api/cron/deadline-reminder/route.ts` — Cron: 매일 오전 9시 KST 마감 알림
- `src/app/api/push/subscribe/route.ts` — Push 구독 엔드포인트
- `src/app/api/push/unsubscribe/route.ts` — Push 구독 취소 엔드포인트
- `src/components/layout/NotificationBell.tsx` — 벨 아이콘 + 배지 레이아웃 컴포넌트
- `public/sw.js` — Service Worker (push 이벤트, notificationclick)

**수정 파일 (7개)**

- `prisma/schema.prisma` — NotificationPreference, PushSubscription, MatchingResult 모델 추가; NotificationLog 모델 확장 (type, status, policyId, readAt, metadata)
- `vercel.json` — 3개 Cron Job 추가 (match-policies, send-digest, deadline-reminder) + maxDuration:900
- `.env.example` — RESEND_FROM_EMAIL, NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT 추가
- `package.json` — web-push, @types/web-push, resend 의존성 추가
- `pnpm-lock.yaml` — 의존성 잠금 파일 업데이트
- `tsconfig.json` — 소폭 조정
- `tests/unit/prisma/schema.test.ts` — timeout:15000 추가

**테스트**: 303 / 303 통과

**인수 기준**: 24 / 24 완료

---

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
