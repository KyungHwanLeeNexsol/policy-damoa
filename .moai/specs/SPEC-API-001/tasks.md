---
id: SPEC-API-001
title: '데이터 파이프라인 - Task Decomposition'
generated: '2026-04-06'
total_tasks: 23
methodology: TDD
---

# SPEC-API-001: Task Decomposition (23 Tasks)

## 마일스톤 M1: DataSyncLog 스키마 + 환경 변수

### T-001: DataSyncLog Prisma 모델 추가
- **File**: `prisma/schema.prisma`
- **Action**: DataSyncLog 모델 추가, `@@index([source, startedAt])` 포함
- **MX**: 없음 (스키마 파일)
- **AC**: AC-001 (부분)

### T-002: sync.ts 타입 정의
- **File**: `src/types/sync.ts` (신규)
- **Action**: `SyncSource`, `SyncStatus`, `DataSyncLogResult` 타입 정의
- **MX**: 없음 (type-only)
- **AC**: AC-001, AC-006

### T-003: 의존성 설치 및 환경 변수
- **Action**: `pnpm add @upstash/redis`
- **File**: `.env.example` — 5개 환경 변수 추가
- **MX**: 없음
- **AC**: AC-007 (부분)

---

## 마일스톤 M2: data.go.kr 서비스 + 정규화

### T-004: data-collection types 정의
- **File**: `src/services/data-collection/types.ts` (신규)
- **Action**: `RawPublicDataPolicy`, `RawBojo24Policy`, `NormalizedPolicy` 인터페이스 정의
- **MX**: 없음
- **AC**: AC-001, AC-002

### T-005: normalizer.ts + 테스트 (RED-GREEN-REFACTOR)
- **File**: `src/services/data-collection/normalizer.ts` (신규, @MX:ANCHOR)
- **Test**: `src/services/data-collection/__tests__/normalizer.test.ts`
- **Action**: `normalize(source, raw) → NormalizedPolicy` 함수 구현
  - data.go.kr 필드 매핑: `bizId → externalId`, `polyBizSjNm → title` 등
  - `externalId` 형식: `PUBLIC_DATA_PORTAL:{bizId}`
  - Zod 스키마 검증 포함
  - 검증 실패 시 skipCount 증가 (throw 대신 null 반환)
- **MX**: `@MX:ANCHOR` — normalize()는 M2+M3+M4 fan_in >= 3
- **AC**: AC-002, AC-004 (부분)

### T-006: deduplicator.ts 구현
- **File**: `src/services/data-collection/deduplicator.ts` (신규)
- **Action**: `upsertPolicy(normalized: NormalizedPolicy): Promise<'created'|'updated'>` 구현
  - `prisma.policy.upsert({ where: { externalId }, ... })`
  - upsertCount 반환
- **AC**: AC-002

### T-007: withRetry 유틸리티 (RED-GREEN-REFACTOR)
- **File**: `src/services/data-collection/utils.ts` (신규)
- **Action**: `withRetry<T>(fn, { maxRetries: 3, baseDelay: 1000 }): Promise<T>`
  - 지수 백오프: 1s, 2s, 4s
  - 4xx/5xx 구분 없이 재시도 (AuthError는 별도 처리)
  - `class AuthError extends Error` 정의
- **AC**: AC-004, AC-006

### T-008: publicDataPortal.service.ts (RED-GREEN-REFACTOR)
- **File**: `src/services/data-collection/publicDataPortal.service.ts` (신규)
- **Test**: (normalizer.test.ts로 통합 또는 별도)
- **Action**:
  - `fetchPage(pageNo, numOfRows): Promise<RawPublicDataPolicy[]>` — Redis 캐시 우선
  - `syncAll(): Promise<DataSyncLogResult>` — 전체 페이지 순회, DataSyncLog RUNNING→SUCCESS/FAILED
  - 캐시 키: `api:public-data-portal:page:{page}`
- **AC**: AC-001, AC-003, AC-004

### T-009: data-collection/index.ts 배럴
- **File**: `src/services/data-collection/index.ts` (신규)
- **Action**: 모든 서비스 re-export
- **MX**: 없음
- **AC**: 없음 (조직)

---

## 마일스톤 M3: 보조금24 서비스

### T-010: Zod 스키마 — 보조금24 응답
- **File**: `src/services/data-collection/types.ts` (수정)
- **Action**: `Bojo24ApiResponse` Zod 스키마 추가, `RawBojo24Policy` 확장
- **AC**: AC-006

### T-011: bojo24.service.ts (RED-GREEN-REFACTOR)
- **File**: `src/services/data-collection/bojo24.service.ts` (신규)
- **Test**: `src/services/data-collection/__tests__/bojo24.service.test.ts`
- **Action**:
  - 401/403 → `throw new AuthError(...)` (재시도 없음)
  - rate limit 500건/시간 추적 (인스턴스 변수)
  - `sourceSystem: 'BOJO24'` 포함
  - `syncAll(): Promise<DataSyncLogResult>`
- **MX**: 없음
- **AC**: AC-006

### T-012: normalizer.ts 보조금24 필드 매핑 확장
- **File**: `src/services/data-collection/normalizer.ts` (수정)
- **Action**: `normalize('BOJO24', raw)` 케이스 추가
  - `externalId` 형식: `BOJO24:{serviceId}`
- **AC**: AC-002

### T-013: data-collection/index.ts bojo24 추가
- **File**: `src/services/data-collection/index.ts` (수정)
- **Action**: bojo24Service export 추가
- **AC**: 없음

---

## 마일스톤 M4: Redis 캐싱 레이어

### T-014: redis.ts 싱글톤 클라이언트
- **File**: `src/lib/redis.ts` (신규)
- **Action**:
  - `@upstash/redis` Redis 클라이언트 초기화
  - try-catch로 실패 시 null 반환 (Proxy 불사용)
  - `getRedis(): Redis | null` 패턴
- **AC**: AC-007

### T-015: constants.ts CACHE_TTL 확장
- **File**: `src/lib/constants.ts` (수정)
- **Action**: 기존 CACHE_TTL 객체에 추가:
  - `API_RESPONSE: 6 * 60 * 60` (6시간)
  - `POLICY_LIST: 15 * 60` (기존 유지)
  - `POLICY_DETAIL: 30 * 60` (spec 기준, 기존 3600에서 변경)
- **AC**: AC-003

### T-016: policy.cache.ts 구현 (RED-GREEN-REFACTOR)
- **File**: `src/services/cache/policy.cache.ts` (신규, @MX:NOTE)
- **Test**: `src/services/cache/__tests__/policy.cache.test.ts`
- **Action**:
  - `getCachedApiResponse(key)`: 히트→반환, 미스→null
  - `setCachedApiResponse(key, data, ttl)`: Redis set + TTL
  - `getCachedPolicyList(filterHash)`, `setCachedPolicyList(...)`: 15분 TTL
  - `invalidatePolicyCaches()`: 동기화 후 일괄 무효화
  - Redis null 시 try-catch로 원본 반환 (graceful degradation)
- **MX**: `@MX:NOTE` — 캐시 레이어 모든 외부 API 응답 통과
- **AC**: AC-003, AC-007

### T-017: publicDataPortal.service.ts 캐시 통합
- **File**: `src/services/data-collection/publicDataPortal.service.ts` (수정)
- **Action**: `fetchPage`에서 policy.cache.ts 호출 추가 (캐시 우선)
- **AC**: AC-003

---

## 마일스톤 M5: Vercel Cron Route Handlers

### T-018: CRON_SECRET 공통 검증 함수
- **File**: 공통 헬퍼 (각 route.ts 내 inline function)
- **Action**: `validateCronSecret(request: Request): boolean`
  - `Authorization: Bearer {CRON_SECRET}` 헤더 검증
- **AC**: AC-005

### T-019: sync-public-data Route Handler (RED-GREEN-REFACTOR)
- **File**: `src/app/api/cron/sync-public-data/route.ts` (신규, @MX:WARN)
- **Test**: `src/app/api/cron/__tests__/sync-public-data.test.ts`
- **Action**:
  - GET handler: CRON_SECRET 검증 → 401 or syncAll()
  - DataSyncLog startedAt, completedAt, durationMs 기록
  - 성공: 200 `{ success: true, result }`, 실패: 500
- **MX**: `@MX:WARN` — Vercel 900s timeout 제약
- **AC**: AC-001, AC-005

### T-020: sync-bojo24 Route Handler
- **File**: `src/app/api/cron/sync-bojo24/route.ts` (신규, @MX:WARN)
- **Action**: T-019와 동일 패턴, bojo24Service.syncAll() 호출
- **MX**: `@MX:WARN` — Vercel 900s timeout 제약
- **AC**: AC-006

### T-021: vercel.json Cron 스케줄 설정
- **File**: `vercel.json` (신규)
- **Action**: 두 Cron Job 등록, `maxDuration: 900`
  - `/api/cron/sync-public-data`: 6시간마다 (`0 */6 * * *`)
  - `/api/cron/sync-bojo24`: 6시간마다 (오프셋: `30 */6 * * *`)
- **AC**: AC-005

---

## 마일스톤 M6: 시드 + 통합 테스트

### T-022: prisma/seed.ts 시드 스크립트
- **File**: `prisma/seed.ts` (신규)
- **Action**:
  - Region 17개 시도 삽입
  - PolicyCategory 주요 카테고리 삽입
  - Policy 20건 이상, 각 externalId 포함
- **AC**: AC-008

### T-023: 통합 테스트
- **File**: `tests/integration/data-pipeline.test.ts` (신규)
- **Action**: AC-001~AC-007 핵심 시나리오 통합 검증
  - MSW로 외부 API 모킹
  - Redis 연결 실패 시나리오 포함
- **AC**: AC-001~AC-007

---

## 의존성 그래프

```
T-001 (schema)
  → T-002 (types)
    → T-004 (dc-types)
      → T-005 (normalizer) ← T-010 (bojo24 types)
        → T-006 (deduplicator)
        → T-007 (withRetry)
          → T-008 (publicDataPortal.service)
            → T-009 (index)
            → T-011 (bojo24.service) ← T-012 (normalizer bojo24)
              → T-013 (index update)
T-003 (deps install)
  → T-014 (redis.ts)
    → T-015 (constants)
      → T-016 (policy.cache)
        → T-017 (service cache integration)
          → T-018 (cron secret)
            → T-019 (sync-public-data route)
            → T-020 (sync-bojo24 route)
              → T-021 (vercel.json)
                → T-022 (seed)
                  → T-023 (integration tests)
```

## 핵심 기술 결정사항

| 항목 | 결정 | 근거 |
|------|------|------|
| withRetry 위치 | `src/services/data-collection/utils.ts` | lib/ 오염 방지 |
| TTL 상수 | `src/lib/constants.ts` CACHE_TTL 확장 | 기존 코드 재사용 |
| Redis 초기화 | try-catch, null 반환 | Proxy 불필요, 단순성 |
| date-fns | 제외 | `Date.now()` 충분 |
| AuthError | `class AuthError extends Error` (inline) | 외부 패키지 불필요 |
| externalId 형식 | `{SOURCE}:{originalId}` | 소스 간 충돌 방지 |
| POLICY_DETAIL TTL | 30분 (spec 기준, constants.ts 60분 → 수정) | SPEC 우선 |
