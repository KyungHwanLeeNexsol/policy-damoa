---
id: SPEC-API-001
title: '데이터 파이프라인 - Compact Reference'
spec_ref: SPEC-API-001/spec.md
version: '1.0.0'
---

# SPEC-API-001: Compact Reference

빠른 구현 참조용 압축 문서. 전체 상세 내용은 `spec.md`, `plan.md`, `acceptance.md` 참조.

---

## 요구사항 (EARS Format)

### REQ-API-001: 공공데이터포털 API 클라이언트

- **[Ubiquitous]** 시스템은 항상 `pageNo`/`numOfRows` 기반 페이지네이션으로 data.go.kr 전체 정책 목록을 순회할 수 있어야 한다.
- **[Event-Driven]** data.go.kr API가 HTTP 4xx/5xx를 반환하는 경우, 시스템은 지수 백오프로 최대 3회 재시도하고 모든 실패 시 `DataSyncLog.status = 'FAILED'`를 기록해야 한다.
- **[Unwanted]** API 응답이 Zod 검증에 실패하는 경우, 시스템은 해당 레코드를 건너뛰고 `skipCount`를 증가시키되 전체 동기화를 중단하지 않아야 한다.

### REQ-API-002: 보조금24 API 클라이언트

- **[Ubiquitous]** 시스템은 항상 `sourceSystem: 'BOJO24'` 식별자를 포함하여 보조금24 수집 데이터의 출처를 추적할 수 있어야 한다.
- **[State-Driven]** 보조금24 시간당 요청 횟수가 500건에 도달한 상태에서는, 시스템은 추가 요청을 중단하고 다음 실행 주기로 동기화를 연기해야 한다.
- **[Unwanted]** 보조금24 인증 오류(401/403) 발생 시, 시스템은 재시도 없이 즉시 중단하고 `DataSyncLog.status = 'AUTH_FAILED'`를 기록해야 한다.

### REQ-API-003: 데이터 정규화 및 중복 제거

- **[Ubiquitous]** 시스템은 항상 `normalizer.ts`의 `normalize()` 함수를 통해 data.go.kr 및 보조금24 응답을 동일한 `NormalizedPolicy` 인터페이스로 변환해야 한다.
- **[Event-Driven]** `externalId`가 동일한 정책 데이터가 수신되는 경우, 시스템은 기존 레코드를 업데이트하고 `upsertCount`를 증가시켜야 한다.
- **[Optional]** `additionalConditions` JSONB 필드가 원본에 구조화된 조건을 포함하는 경우, 시스템은 이를 파싱하여 키-값 구조로 저장해야 한다.

### REQ-API-004: Redis 캐싱 레이어

- **[Ubiquitous]** 시스템은 항상 외부 API 응답을 Upstash Redis에 TTL 6시간으로 캐시하여 중복 외부 요청을 방지해야 한다.
- **[Event-Driven]** 캐시 키 조회 요청 발생 시, 시스템은 히트면 캐시 데이터를, 미스면 원본 조회 후 캐시 저장하여 반환해야 한다.
- **[State-Driven]** Cron Job이 동기화를 완료한 상태에서는, 시스템은 영향받은 정책 캐시 키를 무효화해야 한다.
- **[Unwanted]** Redis 연결 실패 시, 시스템은 캐시를 우회하여 원본에서 직접 응답하고 오류를 로그에 기록해야 한다.

### REQ-API-005: Vercel Cron 기반 데이터 갱신 및 시드 스크립트

- **[Event-Driven]** Vercel Cron이 Route Handler를 호출하는 경우, 시스템은 `Authorization: Bearer {CRON_SECRET}` 헤더를 검증하고 유효하지 않으면 HTTP 401을 반환해야 한다.
- **[State-Driven]** Cron Route Handler 실행 중에는, 시스템은 `DataSyncLog.startedAt`을 기록하고 완료 시 `completedAt`, `durationMs`, `status`를 업데이트해야 한다.
- **[Unwanted]** Cron 실행 시간이 900초를 초과할 위험이 있는 경우, 시스템은 페이지네이션 커서를 Redis에 저장하고 안전하게 종료한 뒤 다음 주기에 이어서 처리해야 한다.
- **[Optional]** `NODE_ENV=development`에서 `pnpm prisma db seed` 실행 시, 시스템은 샘플 정책 20건 이상을 DB에 삽입해야 한다.

---

## 인수 기준 요약

| AC ID | 시나리오 | 핵심 검증 항목 |
|-------|----------|---------------|
| AC-001 | data.go.kr 동기화 성공 | upsert 실행, DataSyncLog SUCCESS 기록 |
| AC-002 | 중복 externalId 처리 | 레코드 수 불변, 내용 업데이트, upsertCount 증가 |
| AC-003 | Redis 캐시 히트/미스 | 미스→API 호출→저장, 히트→API 미호출 |
| AC-004 | API 실패 처리 | 3회 재시도, skipCount 증가, 전체 중단 없음 |
| AC-005 | CRON_SECRET 검증 | 유효→200 실행, 무효→401 미실행 |
| AC-006 | 보조금24 인증 오류 | 재시도 없음, AUTH_FAILED 기록 |
| AC-007 | Redis graceful degradation | 캐시 우회, 서비스 중단 없음 |
| AC-008 | 개발용 시드 실행 | 20건 이상 삽입, externalId 포함 |

---

## 수정/생성 파일 목록

### 신규 생성 파일

```
src/lib/redis.ts
src/types/sync.ts
src/services/data-collection/types.ts
src/services/data-collection/normalizer.ts          ← @MX:ANCHOR
src/services/data-collection/deduplicator.ts
src/services/data-collection/publicDataPortal.service.ts
src/services/data-collection/bojo24.service.ts
src/services/data-collection/index.ts
src/services/cache/policy.cache.ts                  ← @MX:NOTE
src/app/api/cron/sync-public-data/route.ts          ← @MX:WARN
src/app/api/cron/sync-bojo24/route.ts               ← @MX:WARN
vercel.json
prisma/seed.ts
```

### 기존 수정 파일

```
prisma/schema.prisma    ← DataSyncLog 모델 추가
.env.example            ← 5개 환경 변수 추가
```

### 테스트 파일

```
src/services/data-collection/__tests__/normalizer.test.ts
src/services/data-collection/__tests__/bojo24.service.test.ts
src/services/cache/__tests__/policy.cache.test.ts
src/app/api/cron/__tests__/sync-public-data.test.ts
tests/integration/data-pipeline.test.ts
```

---

## 제외 범위

| 항목 | 담당 SPEC |
|------|-----------|
| 지역 자치단체 사이트 크롤링 (로컬 HTML 파싱) | SPEC-API-002 |
| AI 추천 기반 정책 매칭 | SPEC-AI-001 |
| 사용자 알림 발송 | SPEC-NOTIF-001 |
| 정책 검색 UI | SPEC-UI-001 |
| 사용자 북마크/저장 기능 | SPEC-USER-001 |

---

## 환경 변수 체크리스트

- [ ] `PUBLIC_DATA_PORTAL_API_KEY` — data.go.kr 서비스키
- [ ] `BOJO24_API_KEY` — 보조금24 API 키
- [ ] `UPSTASH_REDIS_REST_URL` — Upstash Redis REST URL
- [ ] `UPSTASH_REDIS_REST_TOKEN` — Upstash Redis REST 토큰
- [ ] `CRON_SECRET` — Vercel Cron Job 인증 시크릿

---

## 마일스톤 순서

```
M1 (DataSyncLog 마이그레이션)
  → M2 (data.go.kr 서비스 + 정규화)
  → M3 (보조금24 서비스)
  → M4 (Redis 캐싱)
  → M5 (Vercel Cron Route Handlers)
  → M6 (시드 + 통합 테스트)
```
