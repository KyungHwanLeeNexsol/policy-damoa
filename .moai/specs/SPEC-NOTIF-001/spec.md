---
id: SPEC-NOTIF-001
version: '1.0.0'
status: completed
created: '2026-04-06'
updated: '2026-04-06'
completed: '2026-04-06'
author: zuge3
priority: P1
issue_number: 0
---

# SPEC-NOTIF-001: 사용자 프로필 및 알림 시스템

## HISTORY

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 1.0.0 | 2026-04-06 | 초기 SPEC 작성 | zuge3 |

## 1. 개요

정책다모아 사용자가 본인의 조건(나이, 직업, 소득, 지역, 가구 상황 등)을 프로필로 설정하고, 새로운 정책이 등록되거나 마감이 임박할 때 Web Push 및 이메일 알림을 받을 수 있는 시스템을 구축한다.

### 의존성

- **SPEC-INFRA-001**: 인증 시스템 (NextAuth v5, User/UserProfile 모델)
- **SPEC-API-001**: 정책 데이터 파이프라인 (Policy 모델, Cron Job 패턴)
- **SPEC-UI-001**: 정책 검색 UI (정책 카드 컴포넌트 재사용)

## 2. Environment (환경)

- Next.js 16.2.2 App Router (TypeScript strict mode)
- PostgreSQL via Prisma 7.x (Neon serverless)
- NextAuth.js v5 (JWT 세션 전략, Kakao/Naver/Google OAuth)
- Vercel 배포 + Vercel Cron Jobs (최대 900초)
- Upstash Redis 캐싱
- `web-push` 라이브러리 (VAPID 기반 Web Push)
- `resend` SDK (이메일 발송)

## 3. Assumptions (가정)

- A1: 사용자는 OAuth 로그인 완료 후 프로필 설정 위자드에 진입한다
- A2: UserProfile 모델은 이미 Prisma 스키마에 정의되어 있으며, 확장 가능하다
- A3: 정책 데이터(Policy)는 SPEC-API-001의 Cron Job으로 주기적 갱신된다
- A4: Web Push Service Worker는 `public/sw.js`로 정적 제공된다
- A5: Resend 무료 플랜(일 100건) 기준으로 설계하되, 유료 플랜 확장 가능하게 한다
- A6: 매칭 엔진은 Vercel Cron Job으로 실행되며, 실시간 매칭이 아닌 배치 매칭이다

## 4. Requirements (요구사항)

### REQ-NOTIF-001: 프로필 설정 위자드

**WHEN** 로그인된 사용자가 `/profile/setup` 경로에 접근하면, **THEN** 시스템은 단계별 조건 설문 위자드를 표시해야 한다.

- REQ-NOTIF-001.1: 위자드는 다음 단계로 구성된다:
  - Step 1: 기본 정보 (출생연도, 성별)
  - Step 2: 직업 및 소득 (직업 분류, 소득 수준)
  - Step 3: 지역 선택 (시도 > 시군구 2단계 선택)
  - Step 4: 가구 상황 (혼인 여부, 자녀 수, 임신 여부)
  - Step 5: 특수 조건 (장애 여부, 보훈 여부)
  - Step 6: 확인 및 완료
- REQ-NOTIF-001.2: **WHILE** 위자드 진행 중, 시스템은 각 단계의 진행률을 시각적으로 표시해야 한다
- REQ-NOTIF-001.3: **WHEN** 사용자가 위자드를 완료하면, **THEN** 시스템은 UserProfile을 생성/업데이트하고 알림 설정 페이지로 안내해야 한다
- REQ-NOTIF-001.4: **WHEN** 이미 프로필이 존재하는 사용자가 위자드에 접근하면, **THEN** 기존 값을 폼에 미리 채워야 한다

### REQ-NOTIF-002: 알림 환경설정 관리

**WHEN** 로그인된 사용자가 `/profile/notifications` 경로에 접근하면, **THEN** 시스템은 알림 환경설정 페이지를 표시해야 한다.

- REQ-NOTIF-002.1: 설정 항목:
  - Web Push 알림 활성화/비활성화 토글
  - 이메일 알림 활성화/비활성화 토글
  - 이메일 다이제스트 주기 (즉시, 일간, 주간)
  - 알림 유형별 설정 (신규 정책 매칭, 마감 임박 알림)
- REQ-NOTIF-002.2: **WHEN** 사용자가 Web Push를 활성화하면, **THEN** 시스템은 브라우저 Push 권한을 요청하고, 구독 정보를 서버에 저장해야 한다
- REQ-NOTIF-002.3: **IF** 브라우저가 Push API를 지원하지 않거나 사용자가 권한을 거부하면, **THEN** 시스템은 이메일 알림만 가능하다는 안내를 표시해야 한다

### REQ-NOTIF-003: 백그라운드 매칭 엔진

시스템은 **항상** 새로운 정책 데이터가 동기화된 후 사용자 조건과 매칭을 수행해야 한다.

- REQ-NOTIF-003.1: **WHEN** 데이터 동기화 Cron Job이 성공적으로 완료되면, **THEN** 매칭 엔진 Cron Job이 실행되어 활성 사용자 프로필과 신규/갱신 정책을 비교해야 한다
- REQ-NOTIF-003.2: 매칭 기준:
  - 지역 일치 (사용자 regionId vs 정책 regionId)
  - 연령 범위 일치 (사용자 birthYear vs 정책 eligibilityCriteria.ageRange)
  - 직업 일치 (사용자 occupation vs 정책 eligibilityCriteria.occupation)
  - 소득 수준 일치 (사용자 incomeLevel vs 정책 eligibilityCriteria.incomeLevel)
  - 가구 상황 일치 (가족 상태, 자녀 여부 등)
  - 특수 조건 일치 (장애, 보훈 등)
- REQ-NOTIF-003.3: **WHEN** 매칭 결과가 발견되면, **THEN** 시스템은 사용자의 알림 설정에 따라 알림을 생성해야 한다
- REQ-NOTIF-003.4: 시스템은 동일한 사용자-정책 조합에 대해 중복 알림을 전송**하지 않아야 한다**

### REQ-NOTIF-004: Web Push 알림 전달

**WHEN** 매칭 엔진이 새로운 매칭을 발견하고 사용자가 Push 알림을 활성화한 경우, **THEN** 시스템은 Web Push 알림을 전송해야 한다.

- REQ-NOTIF-004.1: Push 알림 페이로드: 정책 제목, 간략 설명, 정책 상세 페이지 링크
- REQ-NOTIF-004.2: **IF** Push 전송이 실패하면 (구독 만료 등), **THEN** 시스템은 해당 구독을 비활성화하고 NotificationLog에 실패 상태를 기록해야 한다
- REQ-NOTIF-004.3: Service Worker는 Push 이벤트를 수신하여 시스템 알림을 표시하고, 클릭 시 정책 상세 페이지로 이동해야 한다

### REQ-NOTIF-005: 이메일 알림 전달

**WHEN** 매칭 엔진이 새로운 매칭을 발견하고 사용자가 이메일 알림을 활성화한 경우, **THEN** 시스템은 설정된 다이제스트 주기에 따라 이메일을 전송해야 한다.

- REQ-NOTIF-005.1: 즉시 전송: 매칭 발견 즉시 개별 이메일 발송
- REQ-NOTIF-005.2: 일간 다이제스트: 매일 오전 9시 (KST) 전일 매칭 결과 요약 이메일
- REQ-NOTIF-005.3: 주간 다이제스트: 매주 월요일 오전 9시 (KST) 주간 매칭 결과 요약 이메일
- REQ-NOTIF-005.4: **IF** Resend API 호출이 실패하면, **THEN** 시스템은 최대 3회 재시도 후 NotificationLog에 실패 상태를 기록해야 한다
- REQ-NOTIF-005.5: 이메일 본문에는 매칭된 정책 목록, 각 정책의 핵심 정보(제목, 혜택, 마감일), 정책 상세 페이지 링크가 포함되어야 한다

### REQ-NOTIF-006: 알림 히스토리 페이지

**WHEN** 로그인된 사용자가 `/notifications` 경로에 접근하면, **THEN** 시스템은 알림 히스토리 목록을 표시해야 한다.

- REQ-NOTIF-006.1: 알림 목록은 최신순으로 정렬되며, 무한 스크롤 또는 페이지네이션을 지원해야 한다
- REQ-NOTIF-006.2: 각 알림은 읽음/안읽음 상태를 시각적으로 구분해야 한다
- REQ-NOTIF-006.3: **WHEN** 사용자가 알림을 클릭하면, **THEN** 시스템은 해당 알림을 읽음으로 표시하고 관련 정책 상세 페이지로 이동해야 한다
- REQ-NOTIF-006.4: **WHEN** 사용자가 "모두 읽음" 버튼을 클릭하면, **THEN** 시스템은 모든 안읽은 알림을 읽음으로 일괄 변경해야 한다
- REQ-NOTIF-006.5: **WHILE** 안읽은 알림이 존재하면, 시스템은 글로벌 네비게이션에 안읽은 알림 수 배지를 표시해야 한다

### REQ-NOTIF-007: 마감 임박 알림

시스템은 **항상** 사용자가 저장한 정책 또는 매칭된 정책의 마감일을 추적해야 한다.

- REQ-NOTIF-007.1: **WHEN** 정책 마감일이 7일 이내로 남으면, **THEN** 시스템은 "마감 7일 전" 알림을 생성해야 한다
- REQ-NOTIF-007.2: **WHEN** 정책 마감일이 1일 이내로 남으면, **THEN** 시스템은 "마감 1일 전" 긴급 알림을 생성해야 한다
- REQ-NOTIF-007.3: 마감 알림은 매일 Cron Job으로 체크하며, 동일 정책에 대해 같은 유형의 마감 알림은 1회만 전송해야 한다

## 5. Exclusions (What NOT to Build)

- **Shall NOT** support SMS 문자 알림을 구현하지 않는다 (이유: 비용 효율성, Web Push + 이메일로 충분)
- **Shall NOT** implement AI/ML 기반 고급 매칭 알고리즘을 구현하지 않는다 (이유: MVP 범위 초과, 규칙 기반 매칭으로 시작)
- **Shall NOT** support 실시간 WebSocket 기반 인앱 알림을 구현하지 않는다 (이유: Vercel serverless 환경 제약, Cron 기반 배치 처리)
- **Shall NOT** implement 카카오톡/네이버 메시지 등 서드파티 메신저 알림을 구현하지 않는다 (이유: API 비용, MVP 범위 초과)
- **Will NOT** be optimized for 수만 명 이상의 동시 사용자 매칭 최적화 (이유: 초기 서비스 규모 고려, 스케일업은 이후 SPEC)

## 6. Affected Files

### [DELTA] Database Schema

- `[MODIFY]` prisma/schema.prisma - NotificationPreference, PushSubscription, MatchingResult 모델 추가
- `[NEW]` prisma/migrations/ - 마이그레이션 파일 자동 생성

### [DELTA] Environment Configuration

- `[MODIFY]` .env.example - VAPID 키, RESEND_FROM_EMAIL 환경변수 추가

### [NEW] Notification Feature Module

- `[NEW]` src/features/notifications/types/index.ts
- `[NEW]` src/features/notifications/actions/notification.actions.ts
- `[NEW]` src/features/notifications/actions/notification.queries.ts
- `[NEW]` src/features/notifications/components/NotificationList.tsx
- `[NEW]` src/features/notifications/components/NotificationItem.tsx
- `[NEW]` src/features/notifications/components/NotificationBadge.tsx
- `[NEW]` src/features/notifications/components/NotificationEmptyState.tsx
- `[NEW]` src/features/notifications/hooks/use-notifications.ts

### [NEW] User Profile Feature Module

- `[NEW]` src/features/user/types/index.ts
- `[NEW]` src/features/user/actions/profile.actions.ts
- `[NEW]` src/features/user/components/ProfileWizard.tsx
- `[NEW]` src/features/user/components/wizard/StepBasicInfo.tsx
- `[NEW]` src/features/user/components/wizard/StepOccupation.tsx
- `[NEW]` src/features/user/components/wizard/StepRegion.tsx
- `[NEW]` src/features/user/components/wizard/StepFamily.tsx
- `[NEW]` src/features/user/components/wizard/StepSpecialConditions.tsx
- `[NEW]` src/features/user/components/wizard/StepConfirmation.tsx
- `[NEW]` src/features/user/components/wizard/WizardProgress.tsx
- `[NEW]` src/features/user/components/NotificationPreferences.tsx
- `[NEW]` src/features/user/hooks/use-profile-wizard.ts

### [NEW] Page Routes

- `[NEW]` src/app/(main)/profile/page.tsx
- `[NEW]` src/app/(main)/profile/setup/page.tsx
- `[NEW]` src/app/(main)/profile/notifications/page.tsx
- `[NEW]` src/app/(main)/notifications/page.tsx

### [NEW] API Routes (Cron Jobs)

- `[NEW]` src/app/api/cron/match-policies/route.ts
- `[NEW]` src/app/api/cron/send-digest/route.ts
- `[NEW]` src/app/api/cron/deadline-reminder/route.ts

### [NEW] API Routes (Push Subscription)

- `[NEW]` src/app/api/push/subscribe/route.ts
- `[NEW]` src/app/api/push/unsubscribe/route.ts

### [NEW] Services

- `[NEW]` src/services/notification/push.service.ts
- `[NEW]` src/services/notification/email.service.ts
- `[NEW]` src/services/notification/matching.service.ts

### [NEW] Service Worker

- `[NEW]` public/sw.js

### [NEW] Zod Schemas

- `[NEW]` src/features/user/schemas/profile.ts
- `[NEW]` src/features/notifications/schemas/preferences.ts

### [DELTA] Layout & Navigation

- `[MODIFY]` src/app/(main)/layout.tsx - NotificationBadge 컴포넌트 추가

### [NEW] Vercel Cron Configuration

- `[MODIFY]` vercel.json - Cron Job 스케줄 추가

## 7. Traceability

| 요구사항 | 관련 파일 | 테스트 시나리오 |
|----------|----------|---------------|
| REQ-NOTIF-001 | ProfileWizard, profile.actions.ts | AC-001-* |
| REQ-NOTIF-002 | NotificationPreferences, push/subscribe | AC-002-* |
| REQ-NOTIF-003 | matching.service.ts, match-policies/route.ts | AC-003-* |
| REQ-NOTIF-004 | push.service.ts, sw.js | AC-004-* |
| REQ-NOTIF-005 | email.service.ts, send-digest/route.ts | AC-005-* |
| REQ-NOTIF-006 | NotificationList, notification.queries.ts | AC-006-* |
| REQ-NOTIF-007 | deadline-reminder/route.ts | AC-007-* |
