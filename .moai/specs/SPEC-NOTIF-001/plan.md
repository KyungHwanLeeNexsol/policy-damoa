# SPEC-NOTIF-001: 구현 계획

## 1. 기술 접근 방식

### 1.1 프로필 설정 위자드 (REQ-NOTIF-001)

**접근 방식:** Next.js Server Actions + 클라이언트 상태 관리

- 위자드 상태는 클라이언트 React 상태로 관리 (step index, form data)
- 각 단계는 개별 클라이언트 컴포넌트 (`StepBasicInfo`, `StepOccupation` 등)
- 최종 제출 시 Server Action으로 UserProfile upsert
- Zod 스키마로 각 단계별 + 전체 유효성 검증
- 지역 선택: Region 테이블에서 시도(level=1) 로드 후, 선택 시 시군구(level=2) 동적 로드

### 1.2 알림 환경설정 (REQ-NOTIF-002)

**접근 방식:** Server Actions + Web Push API 통합

- NotificationPreference 모델로 사용자별 설정 저장
- Web Push 활성화 시:
  1. 클라이언트에서 `navigator.serviceWorker.register('/sw.js')`
  2. `PushManager.subscribe()` 호출하여 구독 객체 획득
  3. API Route (`/api/push/subscribe`)로 구독 정보 전송
  4. PushSubscription 모델에 저장
- 비활성화 시 PushSubscription soft-delete 처리

### 1.3 매칭 엔진 (REQ-NOTIF-003)

**접근 방식:** Vercel Cron Job + 규칙 기반 매칭

- Cron 스케줄: 데이터 동기화 완료 후 1시간 간격 (또는 독립 스케줄 매 6시간)
- 매칭 로직:
  1. 최근 동기화된 정책 조회 (updatedAt > lastMatchRun)
  2. 활성 UserProfile 전체 조회
  3. 정책별 eligibilityCriteria JSON과 UserProfile 필드 비교
  4. 매칭 점수 계산 (각 조건별 가중치 합산)
  5. 임계값 이상인 경우 MatchingResult 생성
  6. 중복 확인: 기존 NotificationLog에 동일 userId+policyId 조합 없는 경우만 알림 생성
- 대량 처리: 사용자 100명 단위 배치 + Prisma `createMany`로 벌크 삽입

### 1.4 Web Push 알림 (REQ-NOTIF-004)

**접근 방식:** `web-push` 라이브러리 + Service Worker

- 서버 사이드: `web-push` 라이브러리로 VAPID 서명된 Push 메시지 전송
- 클라이언트: `public/sw.js` Service Worker가 push 이벤트 수신, notification 표시
- 실패 처리: 410 Gone 응답 시 구독 자동 삭제

### 1.5 이메일 알림 (REQ-NOTIF-005)

**접근 방식:** Resend SDK + Cron 기반 다이제스트

- 즉시 전송: 매칭 엔진에서 직접 호출
- 일간/주간 다이제스트: 별도 Cron Job (`/api/cron/send-digest`)
  - 일간: 매일 00:00 UTC (KST 09:00)
  - 주간: 매주 월요일 00:00 UTC
- HTML 이메일 템플릿: React 컴포넌트로 작성 (Resend React 이메일 지원)
- 재시도: 실패 시 exponential backoff (1초, 2초, 4초) 최대 3회

### 1.6 알림 히스토리 (REQ-NOTIF-006)

**접근 방식:** Server Components + Cursor 기반 페이지네이션

- NotificationLog 테이블 기반 조회
- Cursor 기반 무한 스크롤 (sentAt 기준)
- 읽음 처리: Server Action으로 readAt 업데이트
- 배지 카운트: 레이아웃 수준에서 안읽은 알림 수 조회 (Redis 캐싱)

### 1.7 마감 임박 알림 (REQ-NOTIF-007)

**접근 방식:** Cron Job + 날짜 기반 필터링

- Cron 스케줄: 매일 00:00 UTC (KST 09:00)
- 쿼리: `applicationDeadline BETWEEN now AND now+7days` / `now+1day`
- 중복 방지: NotificationLog에서 동일 policyId + type('deadline_7d' 또는 'deadline_1d') 조합 확인

## 2. 라이브러리 선정

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| `web-push` | `>=3.6.7` | VAPID 기반 Web Push 알림 전송 |
| `@types/web-push` | `>=3.6.4` | TypeScript 타입 정의 |
| `resend` | `>=4.5.0` | 이메일 발송 (React 이메일 템플릿 지원) |

## 3. Prisma 스키마 추가

### NotificationPreference (신규)
```
model NotificationPreference {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(...)
  pushEnabled     Boolean  @default(false)
  emailEnabled    Boolean  @default(true)
  digestFrequency String   @default("daily") // immediate, daily, weekly
  newPolicyMatch  Boolean  @default(true)
  deadlineReminder Boolean @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### PushSubscription (신규)
```
model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(...)
  endpoint  String   @unique
  p256dh    String
  auth      String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### MatchingResult (신규)
```
model MatchingResult {
  id          String   @id @default(cuid())
  userId      String
  policyId    String
  matchScore  Float
  matchedCriteria Json? // 어떤 조건이 매칭되었는지 기록
  notified    Boolean  @default(false)
  matchedAt   DateTime @default(now())

  @@unique([userId, policyId])
  @@index([userId, notified])
}
```

## 4. API Routes

### Cron Jobs

| Route | 스케줄 | 설명 |
|-------|--------|------|
| `/api/cron/match-policies` | `0 */6 * * *` (6시간마다) | 신규 정책-사용자 매칭 |
| `/api/cron/send-digest` | `0 0 * * *` (매일 00:00 UTC) | 일간/주간 다이제스트 발송 |
| `/api/cron/deadline-reminder` | `0 0 * * *` (매일 00:00 UTC) | 마감 임박 알림 생성 |

### REST API

| Route | Method | 설명 |
|-------|--------|------|
| `/api/push/subscribe` | POST | Web Push 구독 등록 |
| `/api/push/unsubscribe` | POST | Web Push 구독 해지 |

## 5. 페이지 라우트

| Route | 유형 | 설명 |
|-------|------|------|
| `/profile` | 서버 컴포넌트 | 프로필 대시보드 (현재 프로필 요약) |
| `/profile/setup` | 클라이언트 컴포넌트 | 프로필 설정 위자드 |
| `/profile/notifications` | 서버 + 클라이언트 | 알림 환경설정 |
| `/notifications` | 서버 컴포넌트 | 알림 히스토리 |

## 6. 리스크 분석

| 리스크 | 영향도 | 대응 방안 |
|--------|--------|----------|
| iOS Safari Web Push 제한적 지원 | 중 | 이메일 알림을 기본 폴백으로 제공, 비지원 안내 UI |
| Resend 무료 플랜 일일 한도 (100건) | 고 | 다이제스트 모드 기본 활성화, 배치 발송으로 건수 최소화 |
| Vercel Cron 900초 타임아웃 | 중 | 사용자 배치 처리 (100명 단위), 마지막 처리 위치 기록 |
| 매칭 엔진 정확도 | 중 | eligibilityCriteria JSON 표준화, 단계적 매칭 규칙 개선 |
| Push 구독 만료/변경 | 저 | 410 응답 시 자동 정리, 주기적 구독 상태 검증 |
| VAPID 키 관리 | 저 | 환경변수로 관리, 키 생성 스크립트 제공 |

## 7. MX Tag 계획

| 대상 | Tag 유형 | 이유 |
|------|---------|------|
| `matching.service.ts` matchPoliciesForUsers() | @MX:ANCHOR | 매칭 엔진 핵심 함수, 다수 호출자 예상 (fan_in >= 3) |
| `push.service.ts` sendPushNotification() | @MX:ANCHOR | Push 전송 핵심 함수, 여러 서비스에서 호출 |
| `email.service.ts` sendEmail() | @MX:ANCHOR | 이메일 전송 핵심 함수, 여러 서비스에서 호출 |
| `/api/cron/match-policies` route handler | @MX:WARN | Cron 900초 타임아웃 주의, 대량 처리 위험 |
| `public/sw.js` | @MX:NOTE | Service Worker 업데이트 시 캐시 버전 관리 필요 |

## 8. 마일스톤 (우선순위 기반)

### Primary Goal: 프로필 및 기본 알림

1. Prisma 스키마 확장 (NotificationPreference, PushSubscription, MatchingResult)
2. 프로필 설정 위자드 구현 (REQ-NOTIF-001)
3. 알림 환경설정 페이지 구현 (REQ-NOTIF-002)
4. 알림 히스토리 페이지 구현 (REQ-NOTIF-006)

### Secondary Goal: 매칭 및 Push 알림

5. 매칭 엔진 서비스 구현 (REQ-NOTIF-003)
6. Web Push 서비스 구현 (REQ-NOTIF-004)
7. Service Worker 구현

### Final Goal: 이메일 및 마감 알림

8. 이메일 서비스 구현 (REQ-NOTIF-005)
9. 다이제스트 Cron Job 구현
10. 마감 임박 알림 Cron Job 구현 (REQ-NOTIF-007)

### Optional Goal: 품질 개선

11. NotificationBadge 글로벌 네비게이션 통합
12. Redis 캐싱 최적화 (안읽은 알림 수)
13. E2E 테스트 작성
