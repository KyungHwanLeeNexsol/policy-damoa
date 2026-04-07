---
id: SPEC-DEPLOY-001
type: plan
---

# Implementation Plan: SPEC-DEPLOY-001

## Goal

MVP가 완성된 Policy-Damoa를 30분 이내에 Vercel production에 배포 가능한 상태로 만든다.

## Milestones

### Primary Goal: 환경변수 및 시크릿 준비

- M1.1: 시크릿 값 생성
  - `NEXTAUTH_SECRET`: `openssl rand -base64 32`
  - `CRON_SECRET`: `openssl rand -hex 32`
  - VAPID 키쌍: `npx web-push generate-vapid-keys`
- M1.2: 외부 서비스 자격증명 수집
  - Neon production `DATABASE_URL` (pooled connection)
  - Upstash Redis REST URL/Token
  - OAuth 클라이언트 ID/Secret (Kakao, Naver, Google)
  - `GEMINI_API_KEY`, `RESEND_API_KEY`, `PUBLIC_DATA_PORTAL_API_KEY`, `BOJO24_API_KEY`
- M1.3: SPEC의 환경변수 매트릭스(S2)에 따라 표 작성

### Secondary Goal: Vercel 프로젝트 구성

- M2.1: Vercel 프로젝트가 GitHub `main` 브랜치에 연결되었는지 확인
- M2.2: Build & Development Settings 검증
  - Framework Preset: Next.js
  - Build Command: `pnpm build`
  - Install Command: `pnpm install`
  - Output Directory: `.next` (기본값)
- M2.3: Settings → Environment Variables 에 모든 변수를 환경별로 등록
- M2.4: `vercel.json`의 Cron `maxDuration: 900` 사용을 위해 Pro 플랜 활성화 확인

### Tertiary Goal: OAuth 콜백 등록

- M3.1: Production 도메인 결정 (`*.vercel.app` 또는 커스텀)
- M3.2: 카카오 디벨로퍼스 → Redirect URI 추가
- M3.3: 네이버 개발자센터 → Callback URL 추가
- M3.4: Google Cloud Console → OAuth 2.0 Authorized redirect URIs 추가

### Final Goal: 배포 및 검증

- M4.1: `main` 브랜치에 push (또는 Vercel 대시보드에서 Deploy 트리거)
- M4.2: 빌드 로그에서 `pnpm build` 성공 확인
- M4.3: Production URL에서 Prisma 스키마 동기화: `DATABASE_URL=... pnpm prisma db push` (로컬에서 1회 실행)
- M4.4: Smoke 테스트 (acceptance.md 시나리오 참조)
- M4.5: Vercel Cron 대시보드에서 5개 Cron 등록 확인

### Optional Goal: 운영 강화

- O1: 커스텀 도메인 연결 후 `NEXTAUTH_URL` 갱신
- O2: Vercel Analytics / Speed Insights 활성화
- O3: 모니터링 (Sentry, Log Drain) 구성

## Technical Approach

### 배포 모델

Policy-Damoa는 **단일 Next.js 모노레포**로 구성되어 별도의 백엔드가 없다. Vercel은 다음을 자동으로 처리한다:

- Pages (`src/app/**/page.tsx`) → Edge 또는 Static
- API Routes (`src/app/api/**/route.ts`) → Serverless Functions
- Server Actions → Serverless Functions
- Cron Jobs → `vercel.json`의 정의에 따라 Vercel Cron이 호출

### 환경 분리 전략

- **Production**: `main` 브랜치, production DB 사용, 모든 시크릿 등록
- **Preview**: PR 브랜치, production DB와 동일 또는 별도 Neon branch 사용 가능, OAuth는 production 사용 자제
- **Development**: 로컬 `.env.local` 사용, Vercel 대시보드에는 등록하지 않음

### Prisma 처리

- `package.json`의 `postinstall` 또는 `build` 단계에서 `prisma generate`가 실행되어야 한다 (이미 구성됨으로 가정)
- 스키마 동기화는 수동으로 1회 (`prisma db push`) — 향후 별도 SPEC에서 마이그레이션화

### Cron 보안

5개 Cron 라우트는 모두 `CRON_SECRET` Bearer 인증을 사용한다. Vercel Cron은 `Authorization` 헤더를 자동 주입하므로 추가 클라이언트 작업은 불필요.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Vercel Hobby 플랜에서 Cron `maxDuration: 900` 미지원 | High | Pro 플랜 확인 또는 작업 분할 |
| OAuth 콜백 URL 미스매치로 로그인 실패 | High | 배포 후 즉시 OAuth 테스트, 도메인 변경 시 재등록 |
| `prisma db push` 미실행으로 런타임 DB 에러 | High | 배포 직후 수동 실행, 응답 검증 |
| `NEXTAUTH_SECRET` 누락으로 세션 발급 실패 | High | 환경변수 등록 체크리스트 확인 |
| Neon connection 풀 고갈 | Medium | Pooled connection string 사용 (기본) |
| Cron 라우트 외부 노출 | Medium | `CRON_SECRET` 검증 로직 단위 테스트 |
| `.env*` 실수 커밋 | Medium | `.gitignore` 사전 확인 |

## Dependencies

- SPEC-INFRA-001: Next.js + Prisma + NextAuth 부트스트랩 (구현 완료)
- SPEC-API-001: Cron 라우트 및 Upstash 캐싱 (구현 완료)
- SPEC-NOTIF-001: VAPID 키 / Resend 발신 (구현 완료)
- SPEC-AI-001: Gemini API 클라이언트 (구현 완료)

## Out of Scope

본 SPEC은 **구성 작업**만 수행하며, 코드 변경은 다음으로 제한된다:

- `vercel.json` 함수 메모리/타임아웃 미세 조정 (필요 시)
- 그 외 모든 애플리케이션 코드는 변경하지 않음
