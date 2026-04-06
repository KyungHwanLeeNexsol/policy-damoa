# Task Decomposition
SPEC: SPEC-NOTIF-001

| Task ID | Description | Requirement | Dependencies | Planned Files | Status |
|---------|-------------|-------------|--------------|---------------|--------|
| T-001 | Prisma 스키마 확장 (3개 신규 모델) | REQ-NOTIF-002,003,004 | - | prisma/schema.prisma | pending |
| T-002 | User feature 타입 정의 | REQ-NOTIF-001 | T-001 | src/features/user/types/index.ts | pending |
| T-003 | Notification feature 타입 정의 | REQ-NOTIF-002,006 | T-001 | src/features/notifications/types/index.ts | pending |
| T-004 | 프로필 Zod 스키마 (6단계별) | REQ-NOTIF-001 | T-002 | src/features/user/schemas/profile.ts | pending |
| T-005 | 알림 설정 Zod 스키마 | REQ-NOTIF-002 | T-003 | src/features/notifications/schemas/preferences.ts | pending |
| T-006 | 매칭 엔진 서비스 | REQ-NOTIF-003 | T-001,T-002 | src/services/notification/matching.service.ts | pending |
| T-007 | Web Push 서비스 | REQ-NOTIF-004 | T-001 | src/services/notification/push.service.ts | pending |
| T-008 | 이메일 서비스 | REQ-NOTIF-005 | T-001 | src/services/notification/email.service.ts | pending |
| T-009 | 정책 매칭 Cron Route | REQ-NOTIF-003 | T-006,T-007,T-008 | src/app/api/cron/match-policies/route.ts | pending |
| T-010 | 다이제스트 발송 Cron Route | REQ-NOTIF-005 | T-008 | src/app/api/cron/send-digest/route.ts | pending |
| T-011 | 마감 임박 Cron Route | REQ-NOTIF-007 | T-006,T-007,T-008 | src/app/api/cron/deadline-reminder/route.ts | pending |
| T-012 | Push 구독 API Route | REQ-NOTIF-002 | T-001 | src/app/api/push/subscribe/route.ts | pending |
| T-013 | Push 구독 해지 API Route | REQ-NOTIF-002 | T-001 | src/app/api/push/unsubscribe/route.ts | pending |
| T-014 | vercel.json + .env.example 업데이트 | REQ-NOTIF-003,005,007 | T-009,T-010,T-011 | vercel.json, .env.example | pending |
| T-015 | 프로필 Server Actions | REQ-NOTIF-001 | T-004 | src/features/user/actions/profile.actions.ts | pending |
| T-016 | 프로필 위자드 Hook | REQ-NOTIF-001 | T-004 | src/features/user/hooks/use-profile-wizard.ts | pending |
| T-017 | 위자드 진행률 컴포넌트 | REQ-NOTIF-001 | T-016 | src/features/user/components/wizard/WizardProgress.tsx | pending |
| T-018 | 위자드 Step 컴포넌트 (6개) | REQ-NOTIF-001 | T-016 | src/features/user/components/wizard/Step*.tsx | pending |
| T-019 | ProfileWizard 컨테이너 | REQ-NOTIF-001 | T-015,T-017,T-018 | src/features/user/components/ProfileWizard.tsx | pending |
| T-020 | 알림 환경설정 컴포넌트 | REQ-NOTIF-002 | T-005,T-012 | src/features/user/components/NotificationPreferences.tsx | pending |
| T-021 | 알림 Server Actions + 쿼리 | REQ-NOTIF-006 | T-003 | src/features/notifications/actions/notification.actions.ts, notification.queries.ts | pending |
| T-022 | 알림 Hook | REQ-NOTIF-006 | T-021 | src/features/notifications/hooks/use-notifications.ts | pending |
| T-023 | 알림 UI 컴포넌트 (4개) | REQ-NOTIF-006 | T-021,T-022 | src/features/notifications/components/*.tsx | pending |
| T-024 | 프로필 대시보드 페이지 | REQ-NOTIF-001 | T-019 | src/app/(main)/profile/page.tsx | pending |
| T-025 | 프로필 설정 위자드 페이지 | REQ-NOTIF-001 | T-019 | src/app/(main)/profile/setup/page.tsx | pending |
| T-026 | 알림 환경설정 페이지 | REQ-NOTIF-002 | T-020 | src/app/(main)/profile/notifications/page.tsx | pending |
| T-027 | 알림 히스토리 페이지 | REQ-NOTIF-006 | T-023 | src/app/(main)/notifications/page.tsx | pending |
| T-028 | 레이아웃 NotificationBadge 통합 | REQ-NOTIF-006 | T-023 | src/app/(main)/layout.tsx | pending |
| T-029 | Service Worker | REQ-NOTIF-004 | T-007 | public/sw.js | pending |
