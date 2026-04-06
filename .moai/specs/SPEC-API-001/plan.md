---
id: SPEC-API-001
title: '데이터 파이프라인 - Implementation Plan'
spec_ref: SPEC-API-001/spec.md
version: '1.0.0'
---

# SPEC-API-001: Implementation Plan

## 기술 결정 사항 (Technology Decisions)

| 항목 | 결정 | 근거 |
|------|------|------|
| HTTP 클라이언트 | Native `fetch()` (Node.js 20+) | 추가 의존성 없음 |
| 스키마 검증 | Zod 4.3.6 (기설치) | TypeScript 타입 추론 연동 |
| Redis 클라이언트 | `@upstash/redis` | Serverless HTTP 기반, Vercel 호환 |
| 날짜 처리 | `date-fns` | 경량, tree-shaking 지원 |
| 크롤링 | 본 SPEC 제외 → SPEC-API-002 | HTML 파싱 복잡도 분리 |
| 테스트 | Vitest + `vi.mock()` | 기존 패턴 유지 |

## 신규 의존성 설치 목록

```bash
pnpm add @upstash/redis date-fns
```

## 환경 변수 추가 목록

`.env.local` 및 `.env.example`에 추가:

```bash
PUBLIC_DATA_PORTAL_API_KEY=   # data.go.kr 서비스키
BOJO24_API_KEY=               # 보조금24 API 키
UPSTASH_REDIS_REST_URL=       # Upstash Redis REST URL
UPSTASH_REDIS_REST_TOKEN=     # Upstash Redis REST 토큰
CRON_SECRET=                  # Vercel Cron Job 인증 시크릿
DATA_COLLECTION_BATCH_SIZE=100
DATA_COLLECTION_RETRY_MAX=3
DATA_COLLECTION_RETRY_DELAY_MS=1000
```

---

## 마일스톤 분해

### M1: DataSyncLog 스키마 마이그레이션 + 의존성 설치

**목표**: 데이터 파이프라인 실행의 감사 추적 기반 확립

**작업 목록**:

1. `prisma/schema.prisma`에 `DataSyncLog` 모델 추가
   - 필드: `id`, `source`, `status`, `totalCount`, `upsertCount`, `skipCount`, `errorCount`, `errorMessage`, `startedAt`, `completedAt`, `durationMs`
   - 인덱스: `@@index([source, startedAt])`
   - `@@map("data_sync_logs")`
2. `pnpm prisma migrate dev --name add_data_sync_log` 실행
3. `@upstash/redis`, `date-fns` 패키지 설치
4. `.env.example` 신규 환경 변수 추가
5. `src/types/sync.ts` — `DataSyncStatus`, `DataSource` 유니온 타입 정의

**완료 기준**: `prisma generate` 성공, `DataSyncLog` 타입 사용 가능

---

### M2: 공공데이터포털(data.go.kr) API 서비스 + 정규화 파이프라인

**목표**: data.go.kr 연동 및 내부 스키마 정규화

**작업 목록**:

1. `src/services/data-collection/types.ts` 생성
   - `RawPublicDataPolicy` — data.go.kr 원본 응답 타입
   - `RawBojo24Policy` — 보조금24 원본 응답 타입
   - `NormalizedPolicy` — 공통 정규화 타입
   - `SyncResult` — 동기화 결과 집계 타입

2. `src/services/data-collection/normalizer.ts` 생성 (`@MX:ANCHOR`)
   - `normalizePublicDataPolicy(raw: RawPublicDataPolicy): NormalizedPolicy | null`
   - `normalizeBojo24Policy(raw: RawBojo24Policy): NormalizedPolicy | null`
   - Zod 스키마로 입력 검증 후 변환
   - 변환 실패 시 `null` 반환 (호출자가 skip 처리)

3. `src/services/data-collection/deduplicator.ts` 생성
   - `upsertPolicy(normalized: NormalizedPolicy): Promise<'created' | 'updated'>`
   - `prisma.policy.upsert()` 기반 구현
   - `externalId` 기준 중복 감지

4. `src/services/data-collection/publicDataPortal.service.ts` 생성
   - `fetchPage(pageNo: number, numOfRows: number): Promise<RawPublicDataPolicy[]>`
   - `syncAll(): Promise<SyncResult>` — 전체 페이지 순회
   - Zod 응답 스키마 정의 및 검증
   - 지수 백오프 재시도 유틸리티 (`withRetry`)
   - DataSyncLog 생성·업데이트 연동

5. 단위 테스트: `src/services/data-collection/__tests__/normalizer.test.ts`
   - data.go.kr 응답 fixture 기반 정규화 검증
   - 필드 누락 케이스 처리 검증

**완료 기준**: `syncAll()` 호출 시 data.go.kr 데이터가 DB에 upsert됨

---

### M3: 보조금24 API 서비스 + 정규화 파이프라인

**목표**: 보조금24 연동 및 소스 구분 처리

**작업 목록**:

1. `src/services/data-collection/bojo24.service.ts` 생성
   - `fetchPage(pageNo: number, pageSize: number): Promise<RawBojo24Policy[]>`
   - `syncAll(): Promise<SyncResult>`
   - 보조금24 전용 Zod 응답 스키마
   - `sourceSystem: 'BOJO24'` 식별자 주입
   - 인증 오류(401/403) 즉시 중단 로직

2. `normalizeBojo24Policy()` 구현 완성

3. `src/services/data-collection/index.ts` 생성
   - 두 서비스의 통합 진입점 export

4. 단위 테스트: `src/services/data-collection/__tests__/bojo24.service.test.ts`
   - 보조금24 응답 fixture 기반 테스트
   - 인증 오류 처리 테스트
   - rate limit 도달 시 중단 테스트

**완료 기준**: `syncAll()` 호출 시 보조금24 데이터가 `sourceSystem: 'BOJO24'`로 DB에 저장됨

---

### M4: Redis 캐싱 레이어 (Upstash)

**목표**: 외부 API 응답 캐싱으로 불필요한 요청 최소화

**작업 목록**:

1. `src/lib/redis.ts` 생성
   - Upstash Redis 클라이언트 싱글톤 패턴
   - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` 환경 변수 사용
   - 연결 실패 시 graceful degradation (null 반환)

2. `src/services/cache/policy.cache.ts` 생성 (`@MX:NOTE` — TTL 전략과 캐시 무효화)
   - `getCachedApiResponse<T>(key: string): Promise<T | null>`
   - `setCachedApiResponse<T>(key: string, data: T, ttl: number): Promise<void>`
   - `invalidatePolicyCaches(): Promise<void>` — 동기화 후 무효화
   - TTL 상수: `API_CACHE_TTL = 6 * 60 * 60`, `LIST_CACHE_TTL = 15 * 60`, `DETAIL_CACHE_TTL = 30 * 60`

3. `publicDataPortal.service.ts`, `bojo24.service.ts`에 캐시 레이어 연동

4. 단위 테스트: `src/services/cache/__tests__/policy.cache.test.ts`
   - Redis mock으로 캐시 히트/미스 시나리오 테스트
   - Redis 연결 실패 시 fallback 동작 테스트

**완료 기준**: 동일 요청 2회 호출 시 두 번째는 캐시에서 반환됨

---

### M5: Vercel Cron Route Handlers + vercel.json 설정

**목표**: 자동 데이터 갱신 Cron Job 구성

**작업 목록**:

1. `src/app/api/cron/sync-public-data/route.ts` 생성 (`@MX:WARN` — Vercel 900s timeout)
   - `export const maxDuration = 900`
   - Bearer 토큰 인증 (`CRON_SECRET` 검증)
   - `publicDataPortalService.syncAll()` 호출
   - 동기화 완료 후 캐시 무효화
   - 결과 JSON 응답 반환

2. `src/app/api/cron/sync-bojo24/route.ts` 생성 (`@MX:WARN`)
   - 동일 구조, `bojo24Service.syncAll()` 호출

3. `vercel.json` 생성
   - Cron 스케줄: 6시간마다 (`0 */6 * * *`)
   - `maxDuration: 900` 설정

4. 통합 테스트: `src/app/api/cron/__tests__/sync-public-data.test.ts`
   - 유효한 `CRON_SECRET`으로 요청 시 200 반환
   - 잘못된 토큰으로 요청 시 401 반환
   - 서비스 실패 시 500 반환

**완료 기준**: Route Handler가 CRON_SECRET 인증을 통과하고 syncAll()을 실행함

---

### M6: 개발용 시드 스크립트 + 통합 테스트

**목표**: 개발 환경 데이터 초기화 및 전체 파이프라인 검증

**작업 목록**:

1. `prisma/seed.ts` 생성
   - Region 시드 데이터 (17개 시도)
   - PolicyCategory 시드 (주요 복지 카테고리)
   - 샘플 Policy 20건 이상 (`externalId` 포함)
   - `DataSyncLog` 샘플 레코드 2건

2. `package.json` prisma seed 스크립트 확인/추가

3. 통합 테스트: `tests/integration/data-pipeline.test.ts`
   - 전체 파이프라인 (fetch → normalize → upsert) mock 기반 검증
   - `DataSyncLog` 생성/업데이트 검증
   - 중복 데이터 upsert 검증

**완료 기준**: `pnpm prisma db seed` 실행 후 DB에 샘플 데이터 확인, 전체 테스트 통과

---

## 파일 생성/수정 목록

### 신규 생성

| 파일 경로 | 담당 마일스톤 | MX 태그 |
|-----------|--------------|---------|
| `prisma/schema.prisma` (DataSyncLog 추가) | M1 | — |
| `src/lib/redis.ts` | M4 | — |
| `src/types/sync.ts` | M1 | — |
| `src/services/data-collection/types.ts` | M2 | — |
| `src/services/data-collection/normalizer.ts` | M2 | `@MX:ANCHOR` |
| `src/services/data-collection/deduplicator.ts` | M2 | — |
| `src/services/data-collection/publicDataPortal.service.ts` | M2 | — |
| `src/services/data-collection/bojo24.service.ts` | M3 | — |
| `src/services/data-collection/index.ts` | M3 | — |
| `src/services/cache/policy.cache.ts` | M4 | `@MX:NOTE` |
| `src/app/api/cron/sync-public-data/route.ts` | M5 | `@MX:WARN` |
| `src/app/api/cron/sync-bojo24/route.ts` | M5 | `@MX:WARN` |
| `vercel.json` | M5 | — |
| `prisma/seed.ts` | M6 | — |

### 수정 대상

| 파일 경로 | 변경 내용 |
|-----------|-----------|
| `prisma/schema.prisma` | DataSyncLog 모델 추가 |
| `.env.example` | 5개 신규 환경 변수 추가 |

### 테스트 파일

| 파일 경로 | 담당 마일스톤 |
|-----------|--------------|
| `src/services/data-collection/__tests__/normalizer.test.ts` | M2 |
| `src/services/data-collection/__tests__/bojo24.service.test.ts` | M3 |
| `src/services/cache/__tests__/policy.cache.test.ts` | M4 |
| `src/app/api/cron/__tests__/sync-public-data.test.ts` | M5 |
| `tests/integration/data-pipeline.test.ts` | M6 |

---

## 서비스 레이어 아키텍처

```
외부 API (data.go.kr, 보조금24)
    │
    ▼
[API Client Layer]
  publicDataPortal.service.ts   bojo24.service.ts
    │   (Zod 검증, 재시도)          │   (Zod 검증, auth 처리)
    │                               │
    ▼ 캐시 미스                     ▼ 캐시 미스
[Cache Layer] ─────────────────────────────
  policy.cache.ts (Upstash Redis @MX:NOTE)
    │  캐시 히트 → 즉시 반환
    ▼ 캐시 미스
[Normalization Layer]
  normalizer.ts (@MX:ANCHOR)
    │  RawPolicy → NormalizedPolicy
    ▼
[Deduplication Layer]
  deduplicator.ts
    │  externalId 기반 upsert
    ▼
[Database Layer]
  Prisma (PostgreSQL)
    │
    ▼
[Audit Layer]
  DataSyncLog (@MX:NOTE)
```

---

## MX 태그 계획

| 파일 | 태그 | 설명 |
|------|------|------|
| `normalizer.ts` | `@MX:ANCHOR` | 두 서비스에서 모두 호출하는 정규화 함수 핵심 진입점 — 변경 시 양쪽 서비스에 영향 |
| `policy.cache.ts` | `@MX:NOTE` | TTL 전략(6h/15m/30m)과 캐시 무효화 로직 — 비즈니스 결정 변경 시 여기서 조정 |
| `sync-public-data/route.ts` | `@MX:WARN` | Vercel 900s maxDuration 제약 — timeout 위험, 커서 기반 이어하기 구현 필요 |
| `sync-bojo24/route.ts` | `@MX:WARN` | 동일한 Vercel 900s 제약 적용 |
| DataSyncLog upsert 코드 | `@MX:NOTE` | 감사 추적(audit trail) 로직 — 정확성 보장 필요 |

---

## 리스크 분석

| 리스크 | 가능성 | 영향도 | 완화 전략 |
|--------|--------|--------|-----------|
| data.go.kr API 스펙 변경 | 중간 | 높음 | Zod 스키마 검증으로 즉시 감지, DataSyncLog에 오류 기록 |
| 보조금24 API 문서 부재 | 높음 | 중간 | 실제 응답 샘플 수집 후 Zod 스키마 역설계 |
| Vercel Cron 900s 초과 | 중간 | 높음 | Redis 커서 기반 페이지네이션, 청크 단위 처리 |
| Upstash Redis 비용 초과 | 낮음 | 중간 | TTL 적절히 설정, 캐시 키 수 최소화 |
| 일일 API 한도 소진 | 중간 | 높음 | 배치 크기 제한, 증분 동기화, 캐시 우선 활용 |
| DataSyncLog 마이그레이션 실패 | 낮음 | 높음 | 로컬 Docker에서 사전 검증 후 프로덕션 적용 |
| externalId 충돌 (소스 간) | 낮음 | 중간 | `{SOURCE}:{originalId}` 복합 키 형식 사용 |

---

## 구현 순서 의존성

```
M1 (스키마 마이그레이션)
  → M2 (data.go.kr 서비스 + 정규화)
    → M3 (보조금24 서비스)
      → M4 (Redis 캐싱)
        → M5 (Vercel Cron Route Handlers)
          → M6 (시드 + 통합 테스트)
```

M1 완료 없이 M2 시작 불가 (DataSyncLog 타입 의존)
M4 완료 없이 M5 시작 불가 (캐시 무효화 연동)
