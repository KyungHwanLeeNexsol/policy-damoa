---
id: SPEC-API-002
title: Expand Policy Data Collection Sources (Welfare, Employment, SME, Housing)
status: Planned
priority: High
created: 2026-04-09
lifecycle: spec-anchored
related: [SPEC-API-001]
---

# SPEC-API-002: Expand Policy Data Collection Sources

## Environment

Policy-Damoa is a Korean government policy aggregation platform built on Next.js 15 (App Router), TypeScript strict mode, Prisma/PostgreSQL, and deployed to Vercel Hobby plan. The platform currently aggregates policies from two sources:

- `PUBLIC_DATA_PORTAL` — youthcenter.go.kr (youth policies only)
- `BOJO24` — api.odcloud.kr/api/gov24/v3/serviceList (general subsidies)

The existing data collection architecture uses a well-defined pattern:
1. Source-specific service file: `src/services/data-collection/{source}.service.ts`
2. Source-specific Cron route: `src/app/api/cron/sync-{source}/route.ts`
3. Shared infrastructure: `normalizer.ts`, `deduplicator.ts`, `utils.ts`, `types.ts`
4. Cache layer: `getCachedApiResponse` / `setCachedApiResponse`
5. Retry and auth error handling: `withRetry`, `AuthError`

## Assumptions

- All three new government APIs are accessible via `data.go.kr` (공공데이터포털) with standard service key authentication.
- API keys for each source can be obtained and stored as Vercel environment variables.
- Each source's raw data can be mapped into the existing `NormalizedPolicy` schema without schema changes beyond extending the `sourceSystem` enum.
- Vercel Hobby plan limits: maximum cron functions subject to plan quota, 60-second `maxDuration` per invocation.
- The project already has 5 cron jobs defined in `vercel.json`. Adding 3 more separate crons risks exceeding plan limits and duplicating infrastructure. A unified cron strategy is therefore preferred.
- Prisma `DataSyncLog` model supports the existing source enum values and can accept new values via a schema migration (or stores source as a string field — to be confirmed during implementation).

## Requirements

### Functional Requirements (EARS format)

#### Ubiquitous Requirements

- The system shall always record each source sync attempt in `DataSyncLog` with source-specific metadata (totalCount, upsertCount, skipCount, errorCount, durationMs, status).
- The system shall always normalize raw policy data from any source into the common `NormalizedPolicy` schema before deduplication.
- The system shall always enforce per-source rate limits to avoid API quota violations.
- The system shall always isolate source-level failures: a failure in one source shall not prevent execution of other sources in the same run.

#### Event-Driven Requirements

- WHEN the unified sync cron route is invoked by Vercel scheduler, THEN the system shall sequentially execute all registered source sync handlers.
- WHEN a new policy is fetched from 복지로 API, THEN the system shall normalize it via `normalizeBokjiro()` and upsert via `upsertPolicies()`.
- WHEN a new policy is fetched from 고용24 API, THEN the system shall normalize it via `normalizeWork24()` and upsert via `upsertPolicies()`.
- WHEN a new policy is fetched from 중소기업 API, THEN the system shall normalize it via `normalizeSmba()` and upsert via `upsertPolicies()`.
- WHEN any source encounters an `AuthError` (HTTP 401/403), THEN the system shall immediately mark that source's `DataSyncLog` as `AUTH_FAILED` and proceed to the next source.
- WHEN a source exceeds its per-source time budget within a unified cron run, THEN the system shall record `PARTIAL` status and skip remaining sources to stay within the 60-second `maxDuration`.

#### State-Driven Requirements

- IF a source's rate limit is reached during a sync run, THEN the system shall record `PARTIAL` status and resume from the next unsynced page in the following cron invocation.
- IF a source's API key environment variable is missing, THEN the system shall skip that source, log a warning, and continue with remaining sources.
- IF the cached API response exists for a given source and page, THEN the system shall use the cached value instead of invoking the external API.

#### Unwanted Requirements

- The system shall not retry requests that return HTTP 401 or 403 (AuthError).
- The system shall not block execution of remaining sources when one source fails.
- The system shall not exceed Vercel Hobby plan's 60-second `maxDuration` per cron invocation.
- The system shall not introduce breaking changes to the `NormalizedPolicy` schema beyond extending the `sourceSystem` enum.
- The system shall not store plaintext API keys in source code or committed configuration files.

#### Optional Requirements

- Where possible, the system shall expose a per-source Cron route (e.g., `/api/cron/sync-bokjiro`) as an alternative manual-trigger path for debugging and targeted re-syncs, even when the primary scheduled cron is unified.

### Non-Functional Requirements

- **Performance**: Each source sync shall complete within a configurable per-source time budget (default 15 seconds) to allow 3 new sources plus overhead within the 60-second cron limit.
- **Reliability**: The system shall tolerate transient API failures via `withRetry` (existing shared utility with exponential backoff).
- **Rate Limiting**: Each source shall enforce per-source hourly quotas analogous to BOJO24's 500/hour pattern; exact limits defined per API documentation.
- **Caching**: Reuse existing `getCachedApiResponse` / `setCachedApiResponse` cache keys keyed by source and page.
- **Test Coverage**: New service files shall maintain at least 85% line and branch coverage.
- **Backward Compatibility**: All 356 existing tests shall continue to pass after implementation.
- **Security**: API keys stored only as Vercel environment variables; never logged, never committed.
- **Observability**: Each source run records structured logs in `DataSyncLog` with actionable error messages.

## Specifications

### New Data Sources

1. **BOKJIRO (복지로 / Welfare Services)**
   - Domain: Elderly, disabled, families, children welfare services
   - Env var: `BOKJIRO_API_KEY`
   - Enum value: `'BOKJIRO'`
   - Target file: `src/services/data-collection/bokjiro.service.ts`

2. **WORK24 (고용24 / Employment Support)**
   - Domain: Job programs, training subsidies, employment support
   - Env var: `WORK24_API_KEY`
   - Enum value: `'WORK24'`
   - Target file: `src/services/data-collection/work24.service.ts`

3. **SMBA (중소벤처기업부 / SME & Startup Support)**
   - Domain: SME grants, startup programs
   - Env var: `SMBA_API_KEY`
   - Enum value: `'SMBA'`
   - Target file: `src/services/data-collection/smba.service.ts`

Housing (주거 지원) is deferred to a future SPEC pending identification of a stable data.go.kr endpoint — see Exclusions.

### Type System Changes

- Extend `SyncSource` union in `src/types/sync.ts`:
  ```
  'PUBLIC_DATA_PORTAL' | 'BOJO24' | 'BOKJIRO' | 'WORK24' | 'SMBA'
  ```
- Extend `NormalizedPolicySchema.sourceSystem` enum in `src/services/data-collection/types.ts` to include the three new values.
- Add three new raw schemas in `types.ts`:
  - `RawBokjiroPolicySchema`
  - `RawWork24PolicySchema`
  - `RawSmbaPolicySchema`

### Normalizer Changes

Extend `src/services/data-collection/normalizer.ts`:
- Add three new branches to the `switch (source)` statement.
- Add three private normalization functions: `normalizeBokjiro`, `normalizeWork24`, `normalizeSmba`.
- Preserve the `@MX:ANCHOR` contract: always return `NormalizedPolicy | null`, never throw.

### Unified Sync Architecture

Introduce a registry pattern:

- New file: `src/services/data-collection/registry.ts` exports an array of `SourceDefinition` entries, each with:
  - `source: SyncSource`
  - `envKey: string` (e.g., `'BOKJIRO_API_KEY'`)
  - `syncAll: () => Promise<void>`
  - `timeBudgetMs: number` (default 15000)

- New file: `src/app/api/cron/sync-all-sources/route.ts` iterates the registry:
  - For each source, check env var exists → run `syncAll()` wrapped in isolated try/catch.
  - Track cumulative elapsed time; abort remaining sources if budget would be exceeded.
  - Record each source's result independently in `DataSyncLog` (handled inside each `syncAll`).

- Update `vercel.json`:
  - Add `/api/cron/sync-all-sources` with `maxDuration: 60`.
  - Retain existing `sync-public-data` and `sync-bojo24` cron routes for backward compatibility and targeted manual triggers, or remove them if consolidation is approved during implementation review.

### Error Isolation Contract

- Each source's `syncAll()` must internally catch all recoverable errors and record the result to `DataSyncLog`.
- The unified cron handler only catches unrecoverable errors (e.g., thrown `Error` after internal handling failed) and continues to the next source.
- `AuthError` in one source does not short-circuit the unified loop.

### Caching Contract

Each new service shall use `getCachedApiResponse(SOURCE, page)` and `setCachedApiResponse(SOURCE, page, result)` following the BOJO24 reference implementation.

### Rate Limiting Contract

Each new service shall implement an in-module hourly rate limit counter analogous to BOJO24's `checkRateLimit()`. Limits per source:
- BOKJIRO: to be confirmed; default 500/hour
- WORK24: to be confirmed; default 500/hour
- SMBA: to be confirmed; default 500/hour

When rate limit is reached mid-run, the source records `PARTIAL` status and returns gracefully without throwing.

### DataSyncLog Contract

Each source run creates its own `DataSyncLog` row with `source` = the new enum value. No schema change required if `source` is stored as a string; if stored as a Prisma enum, a migration is required (to be verified during implementation).

## Exclusions (What NOT to Build)

- Shall NOT implement housing subsidy collection in this SPEC (reason: no stable `data.go.kr` endpoint identified; deferred to a follow-up SPEC).
- Shall NOT modify the `NormalizedPolicy` field shape beyond extending the `sourceSystem` enum (reason: preserves backward compatibility with existing consumers and tests).
- Shall NOT introduce parallel source execution within a single cron invocation (reason: sequential execution provides deterministic budget tracking and simpler error isolation).
- Shall NOT implement a generic "plug-and-play" source loader from external configuration (reason: over-engineering for three known sources; registry pattern is sufficient).
- Shall NOT delete existing `sync-public-data` or `sync-bojo24` cron routes during this SPEC (reason: risk of disrupting production scheduling; deprecation belongs in a separate follow-up SPEC once unified cron is proven).
- Shall NOT modify `deduplicator.ts` or `utils.ts` (reason: shared infrastructure already satisfies the new sources' needs).
- Shall NOT add UI changes or user-facing filters for new domains (reason: UI filter work is out of scope; covered by a separate frontend SPEC).

## Traceability

- spec.md — this document (EARS requirements)
- plan.md — implementation plan with file list
- acceptance.md — Given-When-Then acceptance criteria
- research.md — existing architecture analysis
- progress.md — implementation tracking
