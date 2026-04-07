---
id: SPEC-DEPLOY-001
title: Vercel 배포 설정 및 환경변수 구성
status: Planned
priority: High
lifecycle: spec-first
created: 2026-04-07
domain: deployment
related: [SPEC-INFRA-001, SPEC-API-001, SPEC-UI-001, SPEC-NOTIF-001, SPEC-AI-001]
---

# SPEC-DEPLOY-001: Vercel 배포 설정 및 환경변수 구성

## Environment

- **Platform**: Vercel (Serverless + Edge + Cron)
- **Runtime**: Next.js 16.2.2 App Router on Node.js
- **Database**: Neon PostgreSQL (serverless, cloud-hosted)
- **Cache**: Upstash Redis (serverless, cloud-hosted)
- **Package Manager**: pnpm
- **Repository**: GitHub (main branch → production)

이 SPEC은 신규 기능 개발이 아닌 **배포 환경 구성** 작업입니다. MVP 5종 SPEC이 모두 구현 완료된 상태에서 Vercel 프로덕션 배포를 활성화하는 것이 목적입니다.

## Assumptions

- A1: Vercel 계정 및 프로젝트가 이미 생성되어 GitHub 저장소와 연결되어 있다
- A2: Neon PostgreSQL production 데이터베이스가 프로비저닝되어 있다
- A3: Upstash Redis production 인스턴스가 프로비저닝되어 있다
- A4: 카카오/네이버/구글 OAuth 애플리케이션이 등록되어 있다
- A5: data.go.kr 및 보조금24 API 키가 발급되어 있다
- A6: Resend 계정과 발신 도메인이 인증되어 있다
- A7: Gemini API 키가 Google AI Studio에서 발급되어 있다
- A8: `pnpm build`가 로컬 및 CI에서 성공한다 (현재 검증됨)

## Requirements

### Ubiquitous Requirements

- U1: 시스템은 항상 환경변수를 통해서만 시크릿을 접근해야 한다 (하드코딩 금지)
- U2: 시스템은 항상 production / preview / development 환경을 분리해서 변수를 관리해야 한다
- U3: Cron 라우트는 항상 `CRON_SECRET` Bearer 토큰으로 인증되어야 한다

### Event-Driven Requirements

- E1: WHEN main 브랜치에 push가 발생하면 THEN Vercel은 production 빌드를 자동 트리거해야 한다
- E2: WHEN 풀 리퀘스트가 열리면 THEN Vercel은 preview 배포를 생성해야 한다
- E3: WHEN Vercel Cron이 스케줄된 시간에 도달하면 THEN 해당 라우트는 `Authorization: Bearer ${CRON_SECRET}` 헤더와 함께 호출되어야 한다
- E4: WHEN 사용자가 OAuth 로그인을 시도하면 THEN 콜백은 production 도메인의 `/api/auth/callback/{provider}`로 리다이렉트되어야 한다

### State-Driven Requirements

- S1: IF `VERCEL_ENV === "production"` THEN `NEXTAUTH_URL`은 production 도메인을 사용해야 한다
- S2: IF `VERCEL_ENV === "preview"` THEN `NEXTAUTH_URL`은 `https://${VERCEL_URL}` 동적 값을 사용해야 한다
- S3: IF Cron 라우트가 `CRON_SECRET` 없이 호출되면 THEN 401 Unauthorized 응답을 반환해야 한다

### Unwanted Behavior Requirements

- N1: 시스템은 `.env*` 파일을 Git에 커밋해서는 안 된다 (`.env.example` 제외)
- N2: 시스템은 클라이언트 번들에 `NEXT_PUBLIC_` 접두사가 없는 시크릿을 노출해서는 안 된다
- N3: 시스템은 production 빌드에서 `prisma migrate dev`를 실행해서는 안 된다 (`db push` 또는 `migrate deploy` 사용)
- N4: 시스템은 인증되지 않은 외부 요청자에게 Cron 엔드포인트 접근을 허용해서는 안 된다

### Optional Requirements

- O1: 가능하면 Vercel Analytics 및 Speed Insights를 활성화한다
- O2: 가능하면 production 도메인을 커스텀 도메인으로 설정한다
- O3: 가능하면 Sentry 또는 Vercel Log Drain을 통한 에러 모니터링을 구성한다

## Specifications

### S1: vercel.json 함수 구성

현재 `vercel.json`은 5개 Cron 라우트와 각각의 `maxDuration: 900` (15분)을 정의하고 있다. 추가로 다음을 명시한다:

- 모든 Cron 함수는 Node.js 런타임에서 실행 (Edge 아님)
- `maxDuration` 검증: Vercel Pro 플랜 이상 필요 (Hobby는 60초 제한)
- 메모리 설정은 기본값(1024 MB) 유지

### S2: 환경변수 매트릭스

다음 변수를 Vercel 프로젝트 Settings → Environment Variables에 등록한다. 모두 **Production** 환경에 등록하며, 시크릿이 아닌 변수만 Preview/Development에도 추가한다.

| 변수명 | 환경 | 비고 |
|---|---|---|
| `DATABASE_URL` | Production, Preview | Neon connection string (pooled) |
| `NEXTAUTH_SECRET` | All | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Production only | 커스텀 도메인 또는 `*.vercel.app` |
| `AUTH_KAKAO_ID` / `AUTH_KAKAO_SECRET` | Production | 카카오 디벨로퍼스 |
| `AUTH_NAVER_ID` / `AUTH_NAVER_SECRET` | Production | 네이버 개발자센터 |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Production | Google Cloud Console |
| `GEMINI_API_KEY` | All | Google AI Studio |
| `CRON_SECRET` | Production | `openssl rand -hex 32` |
| `UPSTASH_REDIS_REST_URL` | All | Upstash 콘솔 |
| `UPSTASH_REDIS_REST_TOKEN` | All | Upstash 콘솔 |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | All | `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | Production | 동일 명령으로 생성된 private 키 |
| `VAPID_SUBJECT` | All | `mailto:admin@yourdomain.com` |
| `RESEND_API_KEY` | Production | Resend 대시보드 |
| `RESEND_FROM_EMAIL` | All | 인증된 발신 주소 |
| `PUBLIC_DATA_PORTAL_API_KEY` | All | data.go.kr |
| `BOJO24_API_KEY` | All | 보조금24 |

> 참고: 코드베이스는 NextAuth v5 컨벤션인 `AUTH_*` 접두사를 사용한다 (`KAKAO_CLIENT_ID`가 아님).

### S3: NEXTAUTH_URL 동적 처리

NextAuth v5는 `NEXTAUTH_URL` 미설정 시 Vercel에서 `VERCEL_URL`을 자동으로 사용한다. Production 환경에서는 명시적 도메인을 권장한다:

- Production: `NEXTAUTH_URL=https://policy-damoa.vercel.app` (또는 커스텀 도메인)
- Preview: 환경변수 미설정 → NextAuth가 `VERCEL_URL`을 자동 활용

### S4: OAuth 리다이렉트 URI 등록

각 OAuth 공급자 콘솔에 다음 콜백 URL을 등록한다:

- Kakao: `https://{production-domain}/api/auth/callback/kakao`
- Naver: `https://{production-domain}/api/auth/callback/naver`
- Google: `https://{production-domain}/api/auth/callback/google`

Preview 배포에서 OAuth 테스트가 필요한 경우 Vercel Preview URL 패턴도 추가한다.

### S5: 데이터베이스 스키마 동기화

첫 production 배포 후 또는 schema 변경 시 다음 명령을 1회 실행한다:

```bash
DATABASE_URL="<production-url>" pnpm prisma db push
```

> 향후 마이그레이션 워크플로 도입 시 `prisma migrate deploy`로 전환한다 (별도 SPEC).

### S6: Cron 인증 검증

각 Cron 라우트(`/api/cron/*`)는 다음 패턴을 따라야 한다:

- `Authorization` 헤더에서 `Bearer ${CRON_SECRET}` 검증
- 일치하지 않으면 401 응답
- Vercel Cron은 자동으로 해당 헤더를 주입

## Exclusions (What NOT to Build)

- 별도의 백엔드 서버 배포는 제외 (모든 것이 Next.js 풀스택 모노레포로 Vercel에 배포됨)
- Docker / Kubernetes / 자체 호스팅 인프라 구성은 제외
- Prisma `migrate dev` / `migrate deploy` 마이그레이션 워크플로는 본 SPEC 범위 외 (현재는 `db push` 사용)
- CDN, 이미지 최적화 커스터마이징, Edge Function 마이그레이션은 제외
- 멀티 리전 배포 및 데이터베이스 read replica 구성은 제외
- 부하 테스트 및 성능 튜닝은 제외 (별도 SPEC 필요)
- Sentry / DataDog 등 외부 APM 통합은 Optional 처리

## Traceability

- @SPEC:DEPLOY-001 → vercel.json, .env.example, src/app/api/cron/**, src/auth.ts
- 의존 SPEC: SPEC-INFRA-001 (Next.js 부트스트랩), SPEC-API-001 (Cron 라우트), SPEC-NOTIF-001 (VAPID/Resend), SPEC-AI-001 (Gemini)
