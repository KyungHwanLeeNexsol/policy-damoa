# SPEC-NOTIF-001 Compact Reference

## Requirements (EARS Format)

### REQ-NOTIF-001: 프로필 설정 위자드

**WHEN** 로그인된 사용자가 `/profile/setup` 경로에 접근하면, **THEN** 시스템은 단계별 조건 설문 위자드를 표시해야 한다.

- REQ-NOTIF-001.1: 6단계 구성 (기본 정보 > 직업/소득 > 지역 > 가구 > 특수 조건 > 확인)
- REQ-NOTIF-001.2: **WHILE** 위자드 진행 중, 진행률을 시각적으로 표시해야 한다
- REQ-NOTIF-001.3: **WHEN** 완료하면, **THEN** UserProfile 생성/업데이트 후 알림 설정 페이지로 안내
- REQ-NOTIF-001.4: **WHEN** 기존 프로필 존재 시, **THEN** 기존 값을 미리 채움

### REQ-NOTIF-002: 알림 환경설정

**WHEN** 로그인된 사용자가 `/profile/notifications`에 접근하면, **THEN** 알림 환경설정 페이지 표시.

- REQ-NOTIF-002.1: Push 토글, 이메일 토글, 다이제스트 주기(즉시/일간/주간), 유형별 설정
- REQ-NOTIF-002.2: **WHEN** Push 활성화, **THEN** 브라우저 권한 요청 + 구독 저장
- REQ-NOTIF-002.3: **IF** Push 미지원/거부, **THEN** 이메일 전용 안내 표시

### REQ-NOTIF-003: 매칭 엔진

시스템은 **항상** 새 정책 동기화 후 사용자 조건 매칭을 수행해야 한다.

- REQ-NOTIF-003.1: **WHEN** 동기화 완료, **THEN** 활성 프로필 vs 신규/갱신 정책 비교
- REQ-NOTIF-003.2: 매칭 기준: 지역, 연령, 직업, 소득, 가구, 특수 조건
- REQ-NOTIF-003.3: **WHEN** 매칭 발견, **THEN** 알림 설정에 따라 알림 생성
- REQ-NOTIF-003.4: 동일 사용자-정책 중복 알림 **금지**

### REQ-NOTIF-004: Web Push 전달

**WHEN** 매칭 발견 + Push 활성화, **THEN** Web Push 알림 전송.

- REQ-NOTIF-004.1: 페이로드: 정책 제목, 설명, 상세 링크
- REQ-NOTIF-004.2: **IF** 전송 실패, **THEN** 구독 비활성화 + 실패 기록
- REQ-NOTIF-004.3: SW 클릭 시 정책 상세 페이지 이동

### REQ-NOTIF-005: 이메일 전달

**WHEN** 매칭 발견 + 이메일 활성화, **THEN** 다이제스트 주기별 이메일 전송.

- REQ-NOTIF-005.1: 즉시: 매칭 즉시 발송
- REQ-NOTIF-005.2: 일간: 매일 KST 09:00 요약
- REQ-NOTIF-005.3: 주간: 매주 월요일 KST 09:00 요약
- REQ-NOTIF-005.4: **IF** 실패, **THEN** 3회 재시도 후 실패 기록
- REQ-NOTIF-005.5: 본문: 매칭 정책 목록 + 핵심 정보 + 링크

### REQ-NOTIF-006: 알림 히스토리

**WHEN** `/notifications` 접근, **THEN** 알림 히스토리 목록 표시.

- REQ-NOTIF-006.1: 최신순, 페이지네이션 지원
- REQ-NOTIF-006.2: 읽음/안읽음 시각 구분
- REQ-NOTIF-006.3: **WHEN** 클릭, **THEN** 읽음 처리 + 정책 상세 이동
- REQ-NOTIF-006.4: **WHEN** "모두 읽음", **THEN** 일괄 읽음 처리
- REQ-NOTIF-006.5: **WHILE** 안읽은 알림 존재, 네비게이션 배지 표시

### REQ-NOTIF-007: 마감 임박 알림

시스템은 **항상** 마감일을 추적해야 한다.

- REQ-NOTIF-007.1: **WHEN** 마감 7일 전, **THEN** 알림 생성
- REQ-NOTIF-007.2: **WHEN** 마감 1일 전, **THEN** 긴급 알림 생성
- REQ-NOTIF-007.3: 같은 유형 마감 알림 1회만 전송

---

## Acceptance Criteria (Given/When/Then)

### AC-001: 프로필 위자드

- AC-001-1: Given 프로필 미설정 사용자 / When /profile/setup 접근 / Then 1단계 표시, 진행률 1/6
- AC-001-2: Given 프로필 존재 / When /profile/setup 접근 / Then 기존 값 미리 채움
- AC-001-3: Given 6단계 확인 / When "완료" 클릭 / Then DB 저장 + 알림설정 리다이렉트
- AC-001-4: Given 2단계 / When 필수항목 미입력 + "다음" / Then 유효성 오류, 진행 불가

### AC-002: 알림 환경설정

- AC-002-1: Given 로그인 / When /profile/notifications 접근 / Then 설정 UI + 현재값 반영
- AC-002-2: Given Push 비활성 / When 토글 ON / Then 권한 요청, 허용 시 구독 저장
- AC-002-3: Given Push 활성화 시도 / When 권한 거부 / Then 이메일 전용 안내
- AC-002-4: Given Push 미지원 브라우저 / When 접근 / Then 토글 disabled + 안내

### AC-003: 매칭 엔진

- AC-003-1: Given 서울 20대 대학생 프로필 + 서울 대학생 정책 / When Cron 실행 / Then 매칭 + 알림
- AC-003-2: Given 이미 알림 전송된 조합 / When Cron 재실행 / Then 중복 알림 없음
- AC-003-3: Given 부산 사용자 + 서울 정책 / When Cron 실행 / Then 매칭 안됨

### AC-004: Web Push

- AC-004-1: Given Push 활성 + 매칭 / When 전송 / Then 브라우저 알림 + Log 생성
- AC-004-2: Given 구독 만료 / When 전송 시도 / Then 구독 비활성화 + 실패 기록
- AC-004-3: Given Push 알림 수신 / When 클릭 / Then 정책 상세 페이지 이동

### AC-005: 이메일

- AC-005-1: Given 즉시 모드 + 매칭 / When 발생 / Then 즉시 이메일 발송
- AC-005-2: Given 일간 모드 + 전일 매칭 3건 / When Cron / Then 요약 이메일 1통
- AC-005-3: Given API 실패 / When 전송 / Then 3회 재시도, 모두 실패 시 failed 기록

### AC-006: 히스토리

- AC-006-1: Given 알림 10건 / When /notifications / Then 최신순 + 읽음/안읽음 구분
- AC-006-2: Given 안읽은 알림 / When 클릭 / Then readAt 업데이트 + 정책 이동 + 배지 감소
- AC-006-3: Given 안읽은 5건 / When "모두 읽음" / Then 전체 readAt 업데이트 + 배지 제거
- AC-006-4: Given 알림 0건 / When 접근 / Then 빈 상태 안내

### AC-007: 마감 임박

- AC-007-1: Given 저장 정책 마감 7일 후 / When Cron / Then "마감 7일 전" 알림
- AC-007-2: Given 매칭 정책 마감 내일 / When Cron / Then "마감 1일 전" 긴급 알림
- AC-007-3: Given 이미 7일 알림 전송 / When Cron / Then 7일 알림 재생성 안됨, 1일 알림은 별도 생성

---

## Files to Modify

### [MODIFY]
- `prisma/schema.prisma` - NotificationPreference, PushSubscription, MatchingResult 추가
- `.env.example` - VAPID 키, RESEND_FROM_EMAIL 추가
- `src/app/(main)/layout.tsx` - NotificationBadge 추가
- `vercel.json` - Cron 스케줄 추가

### [NEW]
- `src/features/notifications/` - actions, components, hooks, types, schemas
- `src/features/user/` - actions, components (위자드), hooks, schemas
- `src/app/(main)/profile/` - page.tsx, setup/page.tsx, notifications/page.tsx
- `src/app/(main)/notifications/page.tsx`
- `src/app/api/cron/match-policies/route.ts`
- `src/app/api/cron/send-digest/route.ts`
- `src/app/api/cron/deadline-reminder/route.ts`
- `src/app/api/push/subscribe/route.ts`
- `src/app/api/push/unsubscribe/route.ts`
- `src/services/notification/push.service.ts`
- `src/services/notification/email.service.ts`
- `src/services/notification/matching.service.ts`
- `public/sw.js`

---

## Exclusions

- SMS 문자 알림 (비용 효율성)
- AI/ML 기반 매칭 (MVP 범위 초과)
- 실시간 WebSocket 인앱 알림 (Vercel serverless 제약)
- 카카오톡/네이버 메시지 알림 (API 비용, MVP 범위 초과)
- 수만 명 이상 동시 매칭 최적화 (초기 서비스 규모)
