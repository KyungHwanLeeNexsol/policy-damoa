# SPEC-NOTIF-001 Research Findings

## 1. 아키텍처 분석

### 1.1 기존 데이터베이스 스키마 (prisma/schema.prisma)

**이미 존재하는 모델:**
- `User` - NextAuth.js 호환 사용자 모델. `profile`, `notifications` 관계 이미 정의됨
- `UserProfile` - 사용자 조건 프로필 (birthYear, gender, occupation, incomeLevel, regionId, familyStatus, isPregnant, hasChildren, childrenCount, isDisabled, isVeteran, additionalInfo)
- `NotificationLog` - 알림 로그 (type, title, body, policyId, sentAt, readAt, status)
- `Policy` - 정책 모델 (eligibilityCriteria JSON, applicationDeadline, status 등)

**누락된 모델 (신규 생성 필요):**
- `NotificationPreference` - 사용자별 알림 설정 (pushEnabled, emailEnabled, digestFrequency 등)
- `PushSubscription` - Web Push 구독 정보 (endpoint, p256dh, auth keys)
- `MatchingResult` - 매칭 엔진 결과 로그 (userId, policyId, matchScore, matchedAt)

### 1.2 인증 시스템 (src/lib/auth.ts)

- NextAuth v5 (beta.30) + Prisma Adapter
- JWT 세션 전략 사용
- 3개 OAuth 프로바이더: Kakao, Naver, Google
- `session.user.id`로 사용자 ID 접근 가능
- 미들웨어에서 `/profile/:path*`, `/notifications/:path*` 라우트 보호 중

### 1.3 기존 Cron Job 패턴 (src/app/api/cron/)

- `sync-bojo24/route.ts` - Bearer 토큰 인증 (CRON_SECRET)
- `sync-public-data/route.ts` - 동일 패턴
- `maxDuration = 900` (Vercel 15분 제한)
- 에러 처리: try/catch + 상태별 HTTP 응답
- 성공 시 캐시 무효화 패턴 (`invalidatePolicyCaches`)

### 1.4 Feature 모듈 구조 (src/features/)

```
src/features/
  notifications/    (빈 구조 - actions/, components/, hooks/, types/)
  policies/         (완전 구현 - actions, components, schemas, types, utils)
  recommendations/  (빈 구조)
  user/             (빈 구조)
```

- 각 feature는 `actions/`, `components/`, `hooks/`, `types/` 하위 디렉토리 패턴
- policies 모듈이 참조 구현 (server actions, Zod 스키마, 컴포넌트 테스트 포함)

### 1.5 페이지 라우트 (src/app/)

- `(main)/` 그룹: 메인 레이아웃 (policies 페이지 존재)
- `(auth)/` 그룹: 로그인 페이지
- `/profile`, `/notifications` 경로는 미들웨어에서 보호 중이나, 실제 페이지 미구현

### 1.6 서비스 레이어 (src/services/)

- `cache/` - Redis 캐시 서비스
- `data-collection/` - 데이터 수집 서비스 (bojo24, public-data)

### 1.7 환경 변수 (.env.example)

**이미 정의된 알림 관련 변수:**
- `FCM_SERVER_KEY` - 현재 FCM으로 정의됨 (Web Push로 변경 필요)
- `RESEND_API_KEY` - Resend 이메일 서비스 키
- `CRON_SECRET` - Cron Job 인증

**추가 필요한 환경 변수:**
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - Web Push VAPID 공개키
- `VAPID_PRIVATE_KEY` - Web Push VAPID 비밀키
- `VAPID_SUBJECT` - VAPID 발신자 식별 (mailto: URL)
- `RESEND_FROM_EMAIL` - 발신 이메일 주소

## 2. 기술적 제약 사항

### 2.1 Vercel 플랫폼 제약
- Cron Job 최대 실행 시간: 900초 (Pro plan)
- Serverless Function 메모리: 1024MB 기본
- 동시 실행 제한 존재
- Web Push Service Worker는 정적 파일로 제공 필요 (`public/sw.js`)

### 2.2 브라우저 호환성
- Web Push API: Chrome, Firefox, Edge 지원. Safari 16.4+ 부분 지원
- Service Worker: 대부분의 모던 브라우저 지원
- iOS Safari: Web Push 16.4+ 지원이나 제한적

### 2.3 이메일 전달
- Resend 무료 플랜: 일 100건, 월 3,000건 제한
- 대량 발송 시 배치 처리 및 속도 제한 필요

## 3. 필요한 신규 의존성

| 패키지 | 용도 | 비고 |
|--------|------|------|
| `web-push` | VAPID 기반 Web Push 알림 | FCM 대체 |
| `@types/web-push` | TypeScript 타입 | devDependency |
| `resend` | 이메일 발송 서비스 SDK | .env.example에 키 이미 존재 |

## 4. 기존 코드에서 발견된 참조 패턴

### Server Actions 패턴 (policies/actions/policy.actions.ts)
- `'use server'` 지시어 사용
- Zod 스키마 유효성 검증
- Prisma 클라이언트 직접 사용
- 에러 처리 + 타입 안전 반환

### 캐시 패턴 (services/cache/)
- Upstash Redis 기반
- TTL 기반 캐시 무효화
- 키 패턴 네이밍 규칙

### 테스트 패턴
- Vitest + Testing Library
- `__tests__/` 디렉토리 컨벤션
- 컴포넌트 테스트 + actions 테스트 분리
