---
id: SPEC-API-001
title: '데이터 파이프라인 - 공공 API 연동 및 캐싱'
version: '1.0.0'
status: completed
created: '2026-04-06'
updated: '2026-04-06'
author: zuge3
priority: P0
issue_number: 0
dependencies:
  - SPEC-INFRA-001
---

## HISTORY

- 2026-04-06: Initial draft created

---

# SPEC-API-001: 데이터 파이프라인 - 공공 API 연동 및 캐싱

## 개요

정책다모아 서비스의 핵심 데이터 공급원인 공공데이터포털(data.go.kr)과 보조금24 외부 API를 연동하여 정책 데이터를 주기적으로 수집·정규화·저장하는 데이터 파이프라인을 구축한다.

수집된 데이터는 Prisma ORM을 통해 PostgreSQL에 upsert되며, Upstash Redis를 활용한 캐싱 레이어로 외부 API 호출 빈도를 최소화한다. Vercel Cron Jobs를 통한 자동 갱신 스케줄과 개발 환경용 시드 스크립트도 포함한다.

본 SPEC은 SPEC-INFRA-001(기반 인프라)이 완료된 이후 구현되며, 이후 SPEC-UI-001(검색/필터링), SPEC-AI-001(AI 추천), SPEC-NOTIF-001(알림)의 선행 의존성이다.

---

## 기술 제약사항

- **Prisma 7.x**: `prisma.config.ts` 기반 datasource 설정 (`schema.prisma`에 url 직접 삽입 불가)
- **Next.js 16 Route Handlers**: `vercel.json`에 `maxDuration` 설정 필요
- **Upstash Redis**: HTTP 기반 serverless 호환 클라이언트 (`ioredis` 사용 불가)
- **Zod 4.x**: 이미 설치됨 — 외부 API 응답 런타임 검증에 활용
- **Vercel Cron**: `maxDuration` 최대 900초, `CRON_SECRET`으로 인증
- **TypeScript strict mode**: `noUncheckedIndexedAccess` 포함
- **Korean full-text search**: `pg_trgm` 확장 필요 (SPEC-UI-001에서 처리)
- **data.go.kr**: `serviceKey` 파라미터로 인증, JSON/XML 응답 지원

---

## 환경 변수

| 변수명 | 설명 |
|--------|------|
| `PUBLIC_DATA_PORTAL_API_KEY` | data.go.kr 서비스키 |
| `BOJO24_API_KEY` | 보조금24 API 키 |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST 토큰 |
| `CRON_SECRET` | Vercel Cron Job 인증 시크릿 |

---

## 요구사항

### REQ-API-001: 공공데이터포털(data.go.kr) API 클라이언트

시스템은 **항상** 공공데이터포털 REST API를 통해 복지·지원 정책 데이터를 수집할 수 있어야 한다.

- `serviceKey` 쿼리 파라미터로 API 키 인증
- offset 기반 페이지네이션 (`pageNo`, `numOfRows`) 지원
- JSON 응답 파싱 (XML fallback 선택적)
- Zod 스키마로 API 응답 구조 런타임 검증
- 일일 요청 한도(~1,000~3,000건) 내 동작하도록 배치 크기 제한
- 지수 백오프(exponential backoff)를 포함한 최대 3회 재시도
- 각 요청 결과를 `DataSyncLog`에 기록

**EARS - Ubiquitous:**
시스템은 공공데이터포털 API 클라이언트를 통해 항상 `pageNo`와 `numOfRows` 파라미터 기반 페이지네이션으로 전체 정책 목록을 순회할 수 있어야 한다.

**EARS - Event-Driven:**
공공데이터포털 API 호출이 HTTP 4xx/5xx 오류를 반환하는 경우, 시스템은 지수 백오프 전략으로 최대 3회 재시도하고 모든 시도 실패 시 `DataSyncLog.status`를 `FAILED`로 기록해야 한다.

**EARS - Unwanted Behaviour:**
API 응답이 Zod 스키마 검증에 실패하는 경우, 시스템은 해당 레코드를 건너뛰고(`skipCount` 증가) 오류 상세를 로그에 기록하되 전체 동기화를 중단하지 않아야 한다.

---

### REQ-API-002: 보조금24 API 클라이언트

시스템은 **항상** 보조금24 API를 통해 보조금·지원사업 정책 데이터를 수집할 수 있어야 한다.

- API 키 헤더 또는 쿼리 파라미터 인증
- 보조금24 고유 응답 스키마에 맞는 Zod 검증
- 보조금24 응답 필드를 내부 `RawPolicy` 타입으로 변환
- 보조금24 전용 rate limit 준수 (시간당 500건 이하)
- `sourceSystem: 'BOJO24'` 식별자로 data.go.kr 데이터와 구분
- 동기화 결과를 `DataSyncLog`에 별도 기록

**EARS - Ubiquitous:**
시스템은 보조금24 API 클라이언트를 통해 항상 `sourceSystem: 'BOJO24'` 식별자를 포함하여 수집 데이터의 출처를 추적할 수 있어야 한다.

**EARS - State-Driven:**
보조금24 API 시간당 요청 횟수가 500건에 도달한 상태에서는, 시스템은 추가 요청을 중단하고 다음 실행 주기로 동기화를 연기해야 한다.

**EARS - Unwanted Behaviour:**
보조금24 API 인증 오류(401/403)가 발생하는 경우, 시스템은 재시도 없이 즉시 중단하고 `DataSyncLog.status`를 `AUTH_FAILED`로 기록해야 한다.

---

### REQ-API-003: 데이터 정규화 및 중복 제거

시스템은 **항상** 외부 API의 이기종 응답 데이터를 내부 `Policy` 스키마로 정규화하고, `externalId` 기반 upsert로 중복을 제거해야 한다.

- `RawPolicy` 타입을 공통 `NormalizedPolicy` 타입으로 변환하는 `normalizer.ts` 구현 (`@MX:ANCHOR`)
- 각 외부 소스별 필드 매핑 규칙 정의 (data.go.kr ↔ 보조금24 ↔ 내부 스키마)
- `externalId`가 동일한 경우 `prisma.policy.upsert()` 적용 (INSERT 또는 UPDATE)
- `eligibilityCriteria`, `additionalConditions` JSONB 필드에 구조화된 데이터 저장
- `applicationDeadline`이 불명확한 경우 `null` 처리
- 정규화 실패 시 해당 레코드만 skip하고 `skipCount` 증가

**EARS - Ubiquitous:**
시스템은 항상 `normalizer.ts`의 `normalize()` 함수를 통해 data.go.kr 및 보조금24의 원본 응답을 동일한 `NormalizedPolicy` 인터페이스로 변환해야 한다.

**EARS - Event-Driven:**
`externalId`가 동일한 정책 데이터가 수신되는 경우, 시스템은 기존 레코드를 새 데이터로 업데이트하고 `upsertCount`를 증가시켜야 한다.

**EARS - Optional Feature:**
`additionalConditions` JSONB 필드가 원본 데이터에 구조화된 자격 조건을 포함하는 경우, 시스템은 해당 데이터를 파싱하여 키-값 구조로 저장해야 한다.

---

### REQ-API-004: Redis 캐싱 레이어

시스템은 **항상** Upstash Redis를 통해 외부 API 응답과 정책 쿼리 결과를 캐시하여 불필요한 외부 호출을 최소화해야 한다.

- `src/lib/redis.ts`에 Upstash Redis 클라이언트 싱글톤 구현
- `src/services/cache/policy.cache.ts`에 캐시 읽기/쓰기/무효화 로직 구현 (`@MX:NOTE`)
- 캐시 키 네임스페이스 전략:
  - API 응답 캐시: `api:{source}:page:{page}` — TTL 6시간
  - 정책 목록 쿼리: `policy:list:filter:{hash}` — TTL 15분
  - 정책 상세: `policy:detail:{id}` — TTL 30분
- 캐시 미스(cache miss) 시 원본 소스에서 데이터 조회 후 캐시에 저장
- 동기화 완료 후 관련 캐시 키 일괄 무효화

**EARS - Ubiquitous:**
시스템은 항상 외부 API 응답을 Upstash Redis에 TTL 6시간으로 캐시하여 동일 페이지에 대한 중복 외부 요청을 방지해야 한다.

**EARS - Event-Driven:**
캐시 키에 대한 조회 요청이 발생하는 경우, 시스템은 Redis에서 캐시 히트 여부를 확인하고, 히트 시 캐시된 데이터를 반환하고, 미스 시 원본 소스에서 조회 후 캐시에 저장해야 한다.

**EARS - State-Driven:**
Cron Job이 데이터 동기화를 완료한 상태에서는, 시스템은 영향받은 정책 관련 캐시 키를 무효화하여 다음 요청에서 최신 데이터를 반환할 수 있어야 한다.

**EARS - Unwanted Behaviour:**
Upstash Redis 연결이 실패하는 경우, 시스템은 캐시를 우회하여 원본 데이터 소스에서 직접 응답하고 오류를 로그에 기록해야 한다 (캐시 실패가 서비스 중단을 유발하지 않음).

---

### REQ-API-005: Vercel Cron 기반 데이터 갱신 및 시드 스크립트

시스템은 **항상** Vercel Cron Jobs를 통해 외부 API 데이터를 주기적으로 동기화하고, 개발 환경에서는 시드 스크립트로 샘플 데이터를 초기화할 수 있어야 한다.

- `CRON_SECRET` Bearer 토큰으로 Cron Route Handler 인증 (`@MX:WARN` — Vercel 900s timeout 제약)
- `src/app/api/cron/sync-public-data/route.ts` — data.go.kr 동기화 (6시간마다)
- `src/app/api/cron/sync-bojo24/route.ts` — 보조금24 동기화 (6시간마다)
- `vercel.json`에 Cron Jobs 스케줄 설정 (`maxDuration: 900`)
- `prisma/seed.ts` — 개발용 샘플 정책 20건 이상 삽입
- 각 Cron 실행 시작/종료 시 `DataSyncLog` 생성·업데이트 (`@MX:NOTE` — 감사 추적)

**EARS - Event-Driven:**
Vercel Cron Job이 스케줄에 의해 Route Handler를 호출하는 경우, 시스템은 `Authorization: Bearer {CRON_SECRET}` 헤더를 검증하고, 유효하지 않으면 HTTP 401을 반환해야 한다.

**EARS - State-Driven:**
Cron Route Handler가 실행 중인 상태에서는, 시스템은 `DataSyncLog.startedAt`을 기록하고 완료 시 `completedAt`, `durationMs`, `status`를 업데이트해야 한다.

**EARS - Unwanted Behaviour:**
Cron Job 실행 시간이 900초를 초과할 위험이 있는 경우, 시스템은 페이지네이션 커서를 Redis에 저장하고 현재 실행을 안전하게 종료한 뒤 다음 Cron 주기에서 이어서 처리해야 한다.

**EARS - Optional Feature:**
개발 환경(`NODE_ENV=development`)에서 `pnpm prisma db seed`를 실행하는 경우, 시스템은 샘플 정책 데이터 20건 이상을 데이터베이스에 삽입하여 UI 개발을 지원해야 한다.

---

## 제외 범위 (Exclusions)

본 SPEC의 범위에서 명시적으로 제외되는 항목:

| 항목 | 이유 | 담당 SPEC |
|------|------|-----------|
| 지역 자치단체 사이트 크롤링 (로컬 HTML 파싱) | 50+ 사이트 구조 상이, Cheerio/Playwright 별도 필요 | SPEC-API-002 |
| AI 추천 기반 정책 매칭 | 임베딩 모델, 유사도 검색 별도 설계 필요 | SPEC-AI-001 |
| 사용자 알림 발송 | 이메일/푸시 채널 설계 별도 필요 | SPEC-NOTIF-001 |
| 정책 검색 UI 및 필터링 | pg_trgm, 검색 컴포넌트 별도 설계 필요 | SPEC-UI-001 |
| 사용자 북마크/저장 기능 | UserSavedPolicy CRUD 별도 설계 필요 | SPEC-USER-001 |

---

## 관련 모델 참조

### DataSyncLog (신규 추가 필요)

```prisma
model DataSyncLog {
  id           String    @id @default(cuid())
  source       String    // 'PUBLIC_DATA_PORTAL' | 'BOJO24'
  status       String    // 'RUNNING' | 'SUCCESS' | 'FAILED' | 'AUTH_FAILED' | 'PARTIAL'
  totalCount   Int       @default(0)
  upsertCount  Int       @default(0)
  skipCount    Int       @default(0)
  errorCount   Int       @default(0)
  errorMessage String?
  startedAt    DateTime  @default(now())
  completedAt  DateTime?
  durationMs   Int?

  @@index([source, startedAt])
  @@map("data_sync_logs")
}
```

### Policy 기존 필드 (참조)

- `externalId`: String? @unique — 중복 제거 핵심 키
- `eligibilityCriteria`: Json? — 자격 조건 JSONB
- `additionalConditions`: Json? — 추가 조건 JSONB
- `sourceAgency`: String? — 출처 기관명
- `sourceUrl`: String? — 원본 URL

---

## 구현 노트 (Implementation Notes)

- 구현 완료일: 2026-04-06
- 개발 방법론: TDD (RED-GREEN-REFACTOR)
- 총 테스트: 156개 통과
- 실제 구현 파일: 15개 신규, 3개 수정, 6개 테스트 파일

### 기술 결정사항 (실제 구현 기준)
- `withRetry` 위치: `src/services/data-collection/utils.ts` (lib/ 오염 방지)
- TTL 상수: 기존 `src/lib/constants.ts` CACHE_TTL 객체 확장
- Redis 초기화: try-catch → null 반환 (Proxy 불사용)
- `date-fns` 미사용: `Date.now() - startedAt.getTime()` 으로 durationMs 계산
- `externalId` 형식: `{SOURCE}:{originalId}` (예: `PUBLIC_DATA_PORTAL:POL-12345`)

### 알려진 제한사항
- 보조금24 rate limit 카운터: 인스턴스 변수 (Serverless cold start 시 리셋)
- Cron 900s 커서 재시작: @MX:TODO로 표시 (미구현)
