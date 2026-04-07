---
id: SPEC-DEPLOY-001
type: acceptance
---

# Acceptance Criteria: SPEC-DEPLOY-001

## Definition of Done

- [ ] 모든 환경변수가 Vercel Production 환경에 등록되었다
- [ ] `main` 브랜치 push로 production 배포가 성공한다
- [ ] OAuth 3종(카카오/네이버/구글) 로그인이 production에서 동작한다
- [ ] Prisma 스키마가 production DB에 동기화되었다
- [ ] 5개 Vercel Cron이 대시보드에 등록되어 있다
- [ ] Cron 라우트는 `CRON_SECRET` 없이 호출 시 401을 반환한다
- [ ] AI 추천, Web Push, Resend 이메일이 production에서 동작한다

## Test Scenarios

### Scenario 1: Production 빌드 성공

- **Given** 모든 환경변수가 Vercel에 등록되어 있고
- **When** `main` 브랜치에 커밋이 push 되면
- **Then** Vercel Build Logs에서 `pnpm build`가 에러 없이 완료되어야 한다
- **And** Deployment Status가 "Ready"가 되어야 한다

### Scenario 2: OAuth 로그인 (카카오)

- **Given** Production URL이 카카오 디벨로퍼스 Redirect URI에 등록되어 있고
- **When** 사용자가 production 사이트에서 카카오 로그인을 시도하면
- **Then** 카카오 동의 화면이 표시되고
- **And** 동의 후 사이트로 리다이렉트되어 세션이 생성되어야 한다

### Scenario 3: OAuth 로그인 (네이버)

- **Given** Production URL이 네이버 Callback URL에 등록되어 있고
- **When** 사용자가 네이버 로그인을 시도하면
- **Then** 정상적으로 세션이 발급되어야 한다

### Scenario 4: OAuth 로그인 (구글)

- **Given** Production URL이 Google OAuth Authorized redirect URIs에 등록되어 있고
- **When** 사용자가 구글 로그인을 시도하면
- **Then** 정상적으로 세션이 발급되어야 한다

### Scenario 5: Cron 인증 실패

- **Given** `/api/cron/sync-public-data` 엔드포인트가 배포되어 있고
- **When** `Authorization` 헤더 없이 GET 요청을 보내면
- **Then** 401 Unauthorized 응답을 반환해야 한다

### Scenario 6: Cron 인증 성공

- **Given** `CRON_SECRET`이 production에 등록되어 있고
- **When** Vercel Cron이 스케줄된 시간에 라우트를 호출하면
- **Then** 200 응답이 반환되고
- **And** 데이터 수집 작업이 완료되어 DB에 반영되어야 한다

### Scenario 7: Prisma DB 동기화

- **Given** Neon production DB가 비어있고
- **When** 로컬에서 `DATABASE_URL=<production> pnpm prisma db push`를 실행하면
- **Then** 모든 테이블이 생성되어야 한다
- **And** production 사이트에서 데이터 조회 API가 빈 결과를 200으로 반환해야 한다

### Scenario 8: AI 추천 동작

- **Given** 사용자가 로그인하여 프로필을 등록했고
- **And** `GEMINI_API_KEY`가 production에 등록되어 있고
- **When** 사용자가 추천 정책 조회를 요청하면
- **Then** Gemini API 호출이 성공하고
- **And** 추천 결과가 화면에 표시되어야 한다

### Scenario 9: Web Push 발송

- **Given** VAPID 키쌍이 production에 등록되어 있고
- **When** 사용자가 알림 구독 후 Cron이 알림 작업을 트리거하면
- **Then** 브라우저에 푸시 알림이 도착해야 한다

### Scenario 10: Resend 이메일 발송

- **Given** `RESEND_API_KEY`가 등록되어 있고
- **And** 발신 도메인이 인증되어 있고
- **When** Daily Digest Cron(`/api/cron/send-digest`)이 실행되면
- **Then** Resend 대시보드에서 발송 이력을 확인할 수 있어야 한다

### Scenario 11: 환경변수 누락 감지

- **Given** 임의의 필수 환경변수가 누락되어 있고
- **When** 빌드가 실행되면
- **Then** 빌드가 실패하거나 런타임에 명확한 에러 메시지가 노출되어야 한다

### Scenario 12: Cron 스케줄 등록 확인

- **Given** 배포가 완료되었고
- **When** Vercel 대시보드의 Cron Jobs 탭을 열면
- **Then** 5개의 Cron이 다음 스케줄로 등록되어 있어야 한다:
  - `/api/cron/sync-public-data` — `0 */6 * * *`
  - `/api/cron/sync-bojo24` — `30 */6 * * *`
  - `/api/cron/match-policies` — `0 * * * *`
  - `/api/cron/send-digest` — `0 8 * * *`
  - `/api/cron/deadline-reminder` — `0 9 * * *`

## Quality Gates

- 빌드: `pnpm build` exit code 0
- 타입체크: `tsc --noEmit` 통과 (CI에서 검증됨)
- Lint: `pnpm lint` 경고 없음
- 보안: 클라이언트 번들에 시크릿 미노출 (Vercel 빌드 검증)
- Git: `.env*` 파일이 커밋되지 않음

## Verification Method

1. Vercel 대시보드: Deployments, Environment Variables, Cron Jobs 탭 시각 확인
2. 브라우저: production URL에서 로그인 / 검색 / 추천 수동 테스트
3. cURL: Cron 엔드포인트 인증 동작 확인
   ```bash
   curl -i https://<domain>/api/cron/sync-public-data
   # 기대: 401
   curl -i -H "Authorization: Bearer <CRON_SECRET>" https://<domain>/api/cron/sync-public-data
   # 기대: 200
   ```
4. Resend / Upstash / Neon 콘솔에서 트래픽 이벤트 관측
