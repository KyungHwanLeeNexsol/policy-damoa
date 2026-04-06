# SPEC-NOTIF-001: 인수 기준

## AC-001: 프로필 설정 위자드 (REQ-NOTIF-001)

### AC-001-1: 위자드 첫 진입

```gherkin
Given 로그인된 사용자가 프로필을 설정하지 않은 상태에서
When /profile/setup 페이지에 접근하면
Then 6단계 위자드의 첫 번째 단계(기본 정보)가 표시된다
And 진행률 표시기가 1/6 단계를 보여준다
And 모든 입력 필드가 비어있다
```

### AC-001-2: 기존 프로필이 있는 경우

```gherkin
Given 이미 프로필을 설정한 사용자가
When /profile/setup 페이지에 접근하면
Then 각 단계의 입력 필드에 기존 프로필 데이터가 미리 채워진다
And 사용자는 기존 값을 수정할 수 있다
```

### AC-001-3: 위자드 완료

```gherkin
Given 사용자가 모든 단계를 입력하고 6단계 확인 화면에서
When "완료" 버튼을 클릭하면
Then UserProfile이 데이터베이스에 생성(또는 업데이트)된다
And 알림 설정 페이지(/profile/notifications)로 리다이렉트된다
And 성공 메시지가 표시된다
```

### AC-001-4: 단계별 유효성 검증

```gherkin
Given 사용자가 위자드 2단계(직업 및 소득)에서
When 필수 항목인 직업 분류를 선택하지 않고 "다음" 버튼을 클릭하면
Then 유효성 검증 오류 메시지가 표시된다
And 다음 단계로 진행되지 않는다
```

## AC-002: 알림 환경설정 (REQ-NOTIF-002)

### AC-002-1: 환경설정 페이지 표시

```gherkin
Given 로그인된 사용자가
When /profile/notifications 페이지에 접근하면
Then Web Push 알림 토글, 이메일 알림 토글, 다이제스트 주기 선택이 표시된다
And 현재 저장된 설정값이 반영되어 있다
```

### AC-002-2: Web Push 활성화

```gherkin
Given Web Push가 비활성화된 상태에서
When 사용자가 Web Push 토글을 켜면
Then 브라우저 Push 알림 권한 요청 다이얼로그가 표시된다
And 사용자가 "허용"을 선택하면 Push 구독이 서버에 저장된다
And 토글이 활성화 상태로 유지된다
```

### AC-002-3: Push 권한 거부

```gherkin
Given Web Push 활성화를 시도할 때
When 사용자가 브라우저 Push 권한을 거부하면
Then "Push 알림이 차단되었습니다. 이메일 알림만 이용 가능합니다." 안내가 표시된다
And Web Push 토글이 비활성화 상태로 돌아간다
```

### AC-002-4: Push 미지원 브라우저

```gherkin
Given Push API를 지원하지 않는 브라우저에서
When 알림 환경설정 페이지에 접근하면
Then Web Push 토글이 비활성화(disabled) 상태로 표시된다
And "현재 브라우저는 Push 알림을 지원하지 않습니다" 안내가 표시된다
```

## AC-003: 매칭 엔진 (REQ-NOTIF-003)

### AC-003-1: 신규 정책 매칭

```gherkin
Given 서울 거주, 20대, 대학생 프로필의 사용자가 존재하고
And 서울 지역 대학생 대상 신규 정책이 동기화되었을 때
When 매칭 엔진 Cron Job이 실행되면
Then 해당 사용자와 정책이 매칭 결과로 기록된다
And 사용자의 알림 설정에 따라 Push 또는 이메일 알림이 생성된다
```

### AC-003-2: 중복 알림 방지

```gherkin
Given 사용자 A에게 정책 X에 대한 매칭 알림이 이미 전송된 상태에서
When 매칭 엔진이 다시 실행되면
Then 동일한 사용자 A-정책 X 조합에 대한 알림이 재생성되지 않는다
```

### AC-003-3: 조건 불일치

```gherkin
Given 부산 거주 사용자 프로필이 존재하고
And 서울 지역 한정 정책이 동기화되었을 때
When 매칭 엔진이 실행되면
Then 해당 사용자-정책 조합은 매칭 결과에 포함되지 않는다
```

## AC-004: Web Push 전달 (REQ-NOTIF-004)

### AC-004-1: 성공적 Push 전송

```gherkin
Given Push 알림이 활성화된 사용자에게 매칭 결과가 생성되었을 때
When Push 알림 전송이 실행되면
Then 사용자의 브라우저에 정책 제목과 간략 설명이 포함된 시스템 알림이 표시된다
And NotificationLog에 type='push', status='sent' 레코드가 생성된다
```

### AC-004-2: Push 전송 실패 (구독 만료)

```gherkin
Given Push 구독이 만료된 사용자에게
When Push 알림 전송을 시도하면
Then 서버가 410 Gone 응답을 수신하고
And 해당 PushSubscription의 isActive가 false로 변경된다
And NotificationLog에 status='failed' 레코드가 생성된다
```

### AC-004-3: Push 알림 클릭

```gherkin
Given 사용자가 시스템 Push 알림을 수신했을 때
When 알림을 클릭하면
Then 해당 정책의 상세 페이지(/policies/{id})가 새 탭 또는 기존 탭에서 열린다
```

## AC-005: 이메일 알림 전달 (REQ-NOTIF-005)

### AC-005-1: 즉시 전송 이메일

```gherkin
Given 이메일 알림이 활성화되고 다이제스트가 "즉시"로 설정된 사용자에게
When 매칭 결과가 생성되면
Then Resend API를 통해 매칭 정책 정보가 포함된 이메일이 즉시 발송된다
And NotificationLog에 type='email', status='sent' 레코드가 생성된다
```

### AC-005-2: 일간 다이제스트

```gherkin
Given 다이제스트가 "일간"으로 설정된 사용자에게 전일 매칭 결과가 3건 있을 때
When 다이제스트 Cron Job이 실행되면
Then 3건의 매칭 정책을 요약한 이메일 1통이 발송된다
And 각 정책의 제목, 혜택, 마감일, 상세 링크가 포함된다
```

### AC-005-3: 이메일 전송 실패 및 재시도

```gherkin
Given Resend API 호출이 일시적으로 실패할 때
When 이메일 전송을 시도하면
Then 시스템은 최대 3회 재시도한다 (1초, 2초, 4초 간격)
And 3회 모두 실패하면 NotificationLog에 status='failed'가 기록된다
```

## AC-006: 알림 히스토리 (REQ-NOTIF-006)

### AC-006-1: 히스토리 목록 표시

```gherkin
Given 알림 10건이 존재하는 사용자가
When /notifications 페이지에 접근하면
Then 최신순으로 알림 목록이 표시된다
And 안읽은 알림은 시각적으로 강조(볼드, 배경색 등)된다
```

### AC-006-2: 알림 읽음 처리

```gherkin
Given 안읽은 알림이 목록에 표시된 상태에서
When 사용자가 해당 알림을 클릭하면
Then 알림의 readAt이 현재 시각으로 업데이트된다
And 관련 정책 상세 페이지로 이동한다
And 안읽은 알림 배지 수가 1 감소한다
```

### AC-006-3: 모두 읽음

```gherkin
Given 안읽은 알림이 5건 있는 상태에서
When "모두 읽음" 버튼을 클릭하면
Then 5건 모두의 readAt이 현재 시각으로 업데이트된다
And 네비게이션의 안읽은 알림 배지가 사라진다
```

### AC-006-4: 빈 상태

```gherkin
Given 알림이 0건인 사용자가
When /notifications 페이지에 접근하면
Then "아직 알림이 없습니다" 빈 상태 안내가 표시된다
And 프로필 설정 또는 정책 탐색으로의 안내 링크가 포함된다
```

## AC-007: 마감 임박 알림 (REQ-NOTIF-007)

### AC-007-1: 7일 전 알림

```gherkin
Given 사용자가 저장한 정책의 마감일이 7일 후인 경우
When 마감 알림 Cron Job이 실행되면
Then "마감 7일 전" 알림이 생성된다
And 사용자의 알림 설정(Push/이메일)에 따라 전달된다
```

### AC-007-2: 1일 전 긴급 알림

```gherkin
Given 매칭된 정책의 마감일이 내일인 경우
When 마감 알림 Cron Job이 실행되면
Then "마감 1일 전" 긴급 알림이 생성된다
And 알림 우선순위가 일반 알림보다 높게 표시된다
```

### AC-007-3: 마감 알림 중복 방지

```gherkin
Given 정책 X에 대한 "마감 7일 전" 알림이 이미 전송된 상태에서
When 다음 날 마감 알림 Cron Job이 실행되면
Then 정책 X에 대한 "마감 7일 전" 알림이 재생성되지 않는다
And 마감일이 1일 이내가 되면 별도의 "마감 1일 전" 알림은 생성된다
```

## Definition of Done

- [ ] 모든 인수 기준 시나리오의 자동화 테스트 통과
- [ ] Prisma 마이그레이션 성공적 적용
- [ ] Web Push Service Worker 등록 및 알림 표시 확인
- [ ] Resend 이메일 전송 성공 확인
- [ ] Vercel Cron Job 스케줄 등록 확인
- [ ] 미들웨어 보호 라우트 정상 동작 확인
- [ ] 안읽은 알림 배지 실시간 반영 확인
- [ ] 코드 커버리지 85% 이상
- [ ] ESLint + Prettier 오류 0건
