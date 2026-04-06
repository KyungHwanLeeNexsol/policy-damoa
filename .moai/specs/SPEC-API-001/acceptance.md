---
id: SPEC-API-001
title: '데이터 파이프라인 - Acceptance Criteria'
spec_ref: SPEC-API-001/spec.md
version: '1.0.0'
---

# SPEC-API-001: Acceptance Criteria

---

## AC-001: 공공데이터포털 정책 동기화 성공

**Scenario**: data.go.kr API 정상 호출 및 데이터 저장

**Given** `PUBLIC_DATA_PORTAL_API_KEY` 환경 변수가 유효한 서비스키로 설정되어 있고
**And** data.go.kr API가 정상 응답 상태이며
**And** `DataSyncLog` 테이블이 존재하는 경우

**When** `publicDataPortalService.syncAll()`이 호출되면

**Then** data.go.kr API에서 전체 정책 목록을 페이지 단위로 조회한다
**And** 각 페이지의 응답이 Zod 스키마 검증을 통과한다
**And** 검증된 정책 데이터가 `NormalizedPolicy` 형식으로 변환된다
**And** `prisma.policy.upsert()`가 각 정책에 대해 호출된다
**And** `DataSyncLog` 레코드가 `status: 'SUCCESS'`로 저장된다
**And** `DataSyncLog.totalCount`가 수집된 전체 정책 수와 일치한다
**And** `DataSyncLog.completedAt`과 `durationMs`가 기록된다

---

## AC-002: 중복 정책 데이터 처리 (externalId 기반 upsert)

**Scenario**: 동일한 externalId를 가진 정책 재수집 시 중복 없이 업데이트

**Given** `externalId: 'PUBLIC_DATA_PORTAL:POL-12345'`를 가진 정책이 이미 DB에 존재하고
**And** 해당 정책의 `title`이 "기존 정책명"으로 저장된 경우

**When** 동일한 `externalId`를 가지지만 `title`이 "수정된 정책명"인 데이터가 수집되면

**Then** DB에 중복 정책 레코드가 생성되지 않는다
**And** 기존 레코드의 `title`이 "수정된 정책명"으로 업데이트된다
**And** `DataSyncLog.upsertCount`가 1 증가한다
**And** `DataSyncLog.skipCount`는 증가하지 않는다
**And** Policy 테이블의 전체 레코드 수가 동기화 전과 동일하다

---

## AC-003: Redis 캐시 히트/미스 처리

**Scenario**: 동일한 API 페이지 요청 시 두 번째부터 캐시에서 반환

**Given** Upstash Redis가 정상 연결된 상태이고
**And** `api:public-data-portal:page:1` 캐시 키가 존재하지 않는 경우

**When** `fetchPage(1, 100)`이 첫 번째로 호출되면

**Then** Redis에 캐시 키 없음을 확인한다 (cache miss)
**And** data.go.kr API를 실제 호출하여 응답을 수신한다
**And** 응답 데이터를 `api:public-data-portal:page:1` 키로 TTL 6시간과 함께 Redis에 저장한다

**When** 동일한 `fetchPage(1, 100)`이 두 번째로 호출되면

**Then** Redis에서 캐시 히트를 확인한다
**And** data.go.kr API를 호출하지 않는다
**And** 캐시된 데이터를 반환한다
**And** 반환된 데이터가 첫 번째 호출 결과와 동일하다

---

## AC-004: API 실패 시 에러 처리 및 DataSyncLog 기록

**Scenario**: 외부 API 지속적 실패 시 감사 로그 기록 및 서비스 계속

**Given** data.go.kr API가 HTTP 503 오류를 반환하고 있으며
**And** 재시도 설정이 최대 3회, 초기 딜레이 1초인 경우

**When** `fetchPage(1, 100)`이 호출되면

**Then** 지수 백오프로 3회 재시도한다 (1초, 2초, 4초 간격)
**And** 3회 모두 실패하면 예외를 상위로 전파한다
**And** `DataSyncLog.errorCount`가 1 증가한다
**And** `DataSyncLog.errorMessage`에 오류 상세가 기록된다
**And** 해당 페이지를 건너뛰고 다음 처리를 계속한다 (전체 중단 없음)
**And** 최종적으로 `DataSyncLog.status`가 `'PARTIAL'` 또는 `'FAILED'`로 기록된다

**Scenario**: Zod 검증 실패 레코드 처리

**Given** data.go.kr API 응답의 일부 레코드가 필수 필드를 누락한 경우

**When** `normalizer.ts`가 해당 레코드를 처리하면

**Then** Zod 검증 실패가 발생한다
**And** 해당 레코드는 건너뛴다
**And** `DataSyncLog.skipCount`가 1 증가한다
**And** 오류 내용이 서버 로그에 기록된다
**And** 동기화 전체가 중단되지 않고 다음 레코드를 계속 처리한다

---

## AC-005: Cron 인증 (CRON_SECRET 검증)

**Scenario**: 유효한 CRON_SECRET으로 Cron Route Handler 호출

**Given** `CRON_SECRET=secret-token-123` 환경 변수가 설정된 경우

**When** GET `/api/cron/sync-public-data` 요청에 `Authorization: Bearer secret-token-123` 헤더가 포함되면

**Then** 인증이 성공한다
**And** `publicDataPortalService.syncAll()`이 실행된다
**And** HTTP 200과 함께 `{ success: true, result: { ... } }` 응답을 반환한다

**Scenario**: 잘못된 CRON_SECRET으로 Cron Route Handler 호출

**Given** `CRON_SECRET=secret-token-123` 환경 변수가 설정된 경우

**When** GET `/api/cron/sync-public-data` 요청에 `Authorization: Bearer wrong-token` 헤더가 포함되면

**Then** 인증이 실패한다
**And** `publicDataPortalService.syncAll()`이 실행되지 않는다
**And** HTTP 401과 함께 `{ error: 'Unauthorized' }` 응답을 반환한다
**And** `DataSyncLog` 레코드가 생성되지 않는다

**Scenario**: Authorization 헤더 없이 Cron Route Handler 호출

**Given** `CRON_SECRET` 환경 변수가 설정된 경우

**When** GET `/api/cron/sync-public-data` 요청에 Authorization 헤더가 없으면

**Then** HTTP 401을 반환한다
**And** 서비스 로직이 실행되지 않는다

---

## AC-006: 보조금24 인증 오류 즉시 중단

**Scenario**: 보조금24 API 인증 실패 시 재시도 없이 중단

**Given** `BOJO24_API_KEY`가 만료되거나 잘못 설정된 경우

**When** `bojo24Service.syncAll()`이 호출되면

**Then** 보조금24 API가 HTTP 401 또는 403을 반환한다
**And** 재시도를 수행하지 않는다
**And** `DataSyncLog.status`가 `'AUTH_FAILED'`로 즉시 기록된다
**And** 해당 오류가 서버 로그에 기록된다
**And** Cron Route Handler는 HTTP 500과 함께 오류 정보를 반환한다

---

## AC-007: Redis 연결 실패 시 Graceful Degradation

**Scenario**: Redis 연결 불가 시 서비스 중단 없이 원본에서 직접 응답

**Given** Upstash Redis가 연결 불가 상태인 경우 (잘못된 URL 또는 토큰)

**When** `getCachedApiResponse()` 또는 `getCachedPolicyList()`가 호출되면

**Then** Redis 연결 오류가 발생한다
**And** 시스템이 캐시를 우회하고 원본 API/DB에서 직접 데이터를 조회한다
**And** HTTP 503 또는 서비스 중단이 발생하지 않는다
**And** Redis 연결 오류가 서버 로그에 기록된다

---

## AC-008: 개발용 시드 스크립트 실행

**Scenario**: 개발 환경에서 시드 데이터 초기화

**Given** 로컬 PostgreSQL(Docker)이 실행 중이고
**And** `pnpm prisma migrate dev`가 완료된 경우

**When** `pnpm prisma db seed`를 실행하면

**Then** 명령이 오류 없이 완료된다
**And** `Region` 테이블에 17개 시도 데이터가 삽입된다
**And** `PolicyCategory` 테이블에 주요 카테고리가 삽입된다
**And** `Policy` 테이블에 20건 이상의 샘플 정책이 삽입된다
**And** 각 샘플 정책에 `externalId`가 포함되어 있다
**And** `pnpm prisma studio`에서 삽입된 데이터를 확인할 수 있다
