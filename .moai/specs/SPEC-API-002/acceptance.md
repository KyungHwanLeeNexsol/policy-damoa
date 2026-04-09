# SPEC-API-002: Acceptance Criteria

## Definition of Done

- All new service files exist and export `syncAll()` and `resetRateLimit()`.
- `SyncSource` union includes `'BOKJIRO' | 'WORK24' | 'SMBA'`.
- `NormalizedPolicySchema.sourceSystem` enum includes all 5 values.
- `normalize()` dispatcher handles all 5 sources.
- Unified cron route `/api/cron/sync-all-sources` exists, is authenticated, and iterates the registry.
- `vercel.json` includes the new cron entry with `maxDuration: 60`.
- All new service files have ≥85% test coverage.
- All 356 pre-existing tests still pass.
- `pnpm typecheck` and `pnpm lint` pass cleanly.

## Acceptance Scenarios (Given-When-Then)

### Scenario 1: Type System Extension

**Given** the existing `SyncSource` type is `'PUBLIC_DATA_PORTAL' | 'BOJO24'`
**When** SPEC-API-002 implementation is complete
**Then** `SyncSource` equals `'PUBLIC_DATA_PORTAL' | 'BOJO24' | 'BOKJIRO' | 'WORK24' | 'SMBA'`
**And** TypeScript compilation succeeds with zero errors
**And** no existing consumer of `SyncSource` breaks

### Scenario 2: Normalizer Dispatch for BOKJIRO

**Given** a valid raw BOKJIRO API response object
**When** `normalize('BOKJIRO', raw)` is called
**Then** it returns a `NormalizedPolicy` with `sourceSystem === 'BOKJIRO'`
**And** `externalId` starts with `'BOKJIRO:'`
**And** the function never throws

### Scenario 3: Normalizer Dispatch for WORK24

**Given** a valid raw WORK24 API response object
**When** `normalize('WORK24', raw)` is called
**Then** it returns a `NormalizedPolicy` with `sourceSystem === 'WORK24'`

### Scenario 4: Normalizer Dispatch for SMBA

**Given** a valid raw SMBA API response object
**When** `normalize('SMBA', raw)` is called
**Then** it returns a `NormalizedPolicy` with `sourceSystem === 'SMBA'`

### Scenario 5: Invalid Raw Data Handling

**Given** a raw object that fails Zod validation for any new source schema
**When** `normalize(source, raw)` is called
**Then** it returns `null`
**And** no exception is thrown

### Scenario 6: Successful BOKJIRO Sync

**Given** `BOKJIRO_API_KEY` is set and the API returns 150 valid policies
**When** `syncAll()` is invoked on the BOKJIRO service
**Then** a `DataSyncLog` row is created with `source: 'BOKJIRO'` and `status: 'RUNNING'`
**And** after completion the row is updated to `status: 'SUCCESS'` with `upsertCount: 150`
**And** `durationMs` is populated
**And** `upsertPolicies()` was called with normalized items

### Scenario 7: AuthError Handling per Source

**Given** the WORK24 API returns HTTP 401 on first request
**When** `syncAll()` is invoked on the WORK24 service
**Then** `AuthError` is raised internally
**And** `DataSyncLog` records `status: 'AUTH_FAILED'` with `errorMessage` populated
**And** no retry is attempted (withRetry short-circuits)

### Scenario 8: Rate Limit PARTIAL Status

**Given** the SMBA service's hourly rate limit is reached mid-sync at page 6 of 10
**When** `syncAll()` continues to page 7
**Then** the service breaks the loop and records `status: 'PARTIAL'`
**And** `upsertCount` reflects only successfully processed pages

### Scenario 9: Unified Cron Authentication

**Given** a GET request to `/api/cron/sync-all-sources` without a valid `CRON_SECRET` bearer token
**When** the handler executes
**Then** it returns HTTP 401
**And** no source `syncAll()` is invoked

### Scenario 10: Unified Cron Error Isolation

**Given** the BOKJIRO service throws an unhandled error mid-run
**When** the unified cron handler processes the registry
**Then** the BOKJIRO error is caught at the cron level
**And** the WORK24 and SMBA services still execute
**And** the response summary lists BOKJIRO with an error status

### Scenario 11: Unified Cron Missing Env Var

**Given** `SMBA_API_KEY` is not set in the environment
**When** the unified cron handler reaches the SMBA registry entry
**Then** it logs a warning and skips the SMBA source
**And** it continues to any remaining sources
**And** the response summary marks SMBA as `skipped`

### Scenario 12: Unified Cron Time Budget

**Given** BOKJIRO takes 25 seconds, WORK24 takes 25 seconds
**When** SMBA entry is reached with < 15 seconds of budget remaining
**Then** the handler aborts before invoking SMBA
**And** SMBA is marked `budget_exceeded` in the response summary
**And** the total handler runtime stays under 60 seconds

### Scenario 13: Backward Compatibility of Existing Crons

**Given** the unified cron route is deployed
**When** Vercel triggers the existing `/api/cron/sync-bojo24` route
**Then** the route still executes the BOJO24 `syncAll()` as before
**And** no behavior change is observed in BOJO24 sync results

### Scenario 14: Existing Test Suite Stability

**Given** the full pre-existing test suite of 356 tests
**When** the SPEC-API-002 implementation is complete
**Then** all 356 tests still pass without modification
**And** total test count increases by the number of new tests added

### Scenario 15: New Service Test Coverage

**Given** the newly created `bokjiro.service.ts`, `work24.service.ts`, `smba.service.ts`
**When** coverage is measured on their respective test files
**Then** each file reports ≥85% line coverage and ≥85% branch coverage

### Scenario 16: vercel.json Valid Configuration

**Given** the updated `vercel.json`
**When** `vercel.json` is parsed
**Then** it contains a cron entry for `/api/cron/sync-all-sources`
**And** it contains a function config with `maxDuration: 60` for that path
**And** existing cron entries remain unchanged

## Test Strategy

### Unit Tests per New Service

Each of `bokjiro.service.test.ts`, `work24.service.test.ts`, `smba.service.test.ts` covers:
- Successful single-page sync with mocked fetch + mocked Prisma.
- Multi-page sync with pagination arithmetic.
- Zod validation failure increments `skipCount`.
- 401 response raises `AuthError` and records `AUTH_FAILED`.
- 500 response retries via `withRetry` and succeeds on second attempt.
- Rate limit exceeded records `PARTIAL`.
- Cache hit path skips fetch entirely.
- `resetRateLimit()` clears module state between tests.

### Unified Cron Route Tests

`src/app/api/cron/sync-all-sources/route.test.ts` covers:
- Missing/invalid `CRON_SECRET` header returns 401.
- All three sources execute sequentially on happy path.
- One source throwing does not stop remaining sources.
- Missing env var skips the source with warning.
- Time budget exceeded aborts remaining sources.

### Normalizer Tests

Extend existing normalizer test coverage to include the three new dispatch branches with valid and invalid raw inputs.

### Quality Verification Commands

- `pnpm typecheck` — zero errors.
- `pnpm lint` — zero warnings in modified and new files.
- `pnpm test` — 356 + new tests, all passing.
- `pnpm test --coverage` — new files at ≥85%.
