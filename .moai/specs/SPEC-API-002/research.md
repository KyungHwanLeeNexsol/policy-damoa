# SPEC-API-002: Research — Existing Data Collection Architecture

Purpose: Document the current data collection architecture so the implementation agent can replicate the pattern precisely when adding BOKJIRO, WORK24, and SMBA sources.

## 1. Directory Layout

```
src/services/data-collection/
├── __tests__/                    # Vitest test suites (mirror service files)
├── bojo24.service.ts             # BOJO24 (보조금24) client with rate limiting
├── publicDataPortal.service.ts   # 청년센터 API client
├── normalizer.ts                 # @MX:ANCHOR — shared raw → NormalizedPolicy converter
├── deduplicator.ts               # Shared upsertPolicies()
├── types.ts                      # Zod raw schemas + NormalizedPolicySchema
├── utils.ts                      # withRetry, AuthError
└── index.ts                      # Barrel exports
```

Cron routes: `src/app/api/cron/sync-{source}/route.ts`
Type definitions: `src/types/sync.ts`
Vercel config: `vercel.json` (5 existing crons, `maxDuration: 60`)

## 2. Canonical Service File Pattern (from bojo24.service.ts)

Every source service follows this exact sequence:

1. **Imports**: `prisma`, cache helpers, `SyncSource`, shared `upsertPolicies`, shared `normalize`, raw type, `AuthError`, `withRetry`.
2. **Constants**: `SOURCE` (enum value), `PAGE_SIZE`, `RATE_LIMIT_PER_HOUR`, `API_BASE_URL`.
3. **Rate limiter state**: Module-scoped `requestCount` and `requestHourStart`; `checkRateLimit()` function; `resetRateLimit()` exported for tests.
4. **Response shape**: `interface {Source}ApiResponse` typing the external API payload.
5. **`fetchPage(page)` function**:
   - Check cache via `getCachedApiResponse(SOURCE, page)` — return immediately on hit.
   - Enforce rate limit via `checkRateLimit()` — throw on exceeded.
   - Read API key from `process.env.{SOURCE}_API_KEY`.
   - Build URL with query string.
   - Wrap `fetch` in `withRetry`:
     - Detect 401/403 → throw `AuthError` (skipped by `withRetry`).
     - Detect other non-OK → throw `Error` (retried).
     - Parse JSON, return `{ items, totalCount }`.
   - Write to cache via `setCachedApiResponse(SOURCE, page, result)`.
6. **`syncAll()` exported function**:
   - Create `DataSyncLog` row with `status: 'RUNNING'`, `startedAt: new Date()`.
   - Track counters: `totalCount`, `upsertCount`, `skipCount`, `errorCount`.
   - Fetch first page → determine `totalPages = Math.ceil(totalCount / PAGE_SIZE)`.
   - Process first page: map items through `normalize(SOURCE, item)`, pass array to `upsertPolicies()`, accumulate counters from result.
   - Loop pages 2..totalPages sequentially with rate-limit check; break on limit with PARTIAL.
   - On success: update `DataSyncLog` with `status: 'SUCCESS'` or `'PARTIAL'` (if errorCount > 0), `completedAt`, `durationMs`.
   - On catch: distinguish `AuthError` → `'AUTH_FAILED'`, else `'FAILED'`. Record `errorMessage`, re-throw (so outer caller knows).

## 3. Normalizer Contract

`normalize(source, raw)` is marked with `@MX:ANCHOR` in `normalizer.ts` because it has fan_in ≥ 3 (called by every service plus deduplicator in tests).

**Invariant**: Always returns `NormalizedPolicy | null`; never throws. Zod `safeParse` failure → `null`.

**Dispatch**: `switch (source)` with one case per `SyncSource` enum value. Each case delegates to a private `normalize{Source}` function.

**Private normalization function shape**:
```
function normalize{Source}(raw: unknown): NormalizedPolicy | null {
  const parsed = Raw{Source}PolicySchema.safeParse(raw);
  if (!parsed.success) return null;
  const d = parsed.data;
  return {
    externalId: `{SOURCE}:${d.{idField}}`,
    title: d.{titleField},
    // ... map all NormalizedPolicy fields, default to null
    sourceSystem: '{SOURCE}',
    status: 'active',
  };
}
```

Field mapping strategy:
- `externalId` format: `{SOURCE_ENUM}:{originalId}` (e.g., `BOKJIRO:SVC-12345`).
- Any missing optional field in raw → `null` in normalized.
- Object fields (`eligibilityCriteria`, `additionalConditions`) become `{ key: string } | null`.
- `applicationDeadline` currently always `null` (date parsing is out of scope for this SPEC; follows existing pattern).

## 4. Types Module Pattern

`src/services/data-collection/types.ts` structure:
- One `Raw{Source}PolicySchema` Zod object per source with Korean field-name comments.
- Exported `Raw{Source}Policy = z.infer<typeof ...>`.
- Single shared `NormalizedPolicySchema` with `sourceSystem: z.enum([...])` — the enum array must include every `SyncSource` value.

Adding a new source requires:
1. New Zod schema + inferred type.
2. Adding the new enum value to `NormalizedPolicySchema.sourceSystem`.

## 5. Cron Route Pattern

Each `src/app/api/cron/sync-{source}/route.ts` typically:
- Exports a `GET` handler.
- Verifies the `Authorization` header contains `Bearer ${process.env.CRON_SECRET}` (see SPEC-DEPLOY-001).
- Calls the corresponding `syncAll()`.
- Returns `NextResponse.json({ ok: true })` or an error status.

## 6. Shared Utilities

- **`withRetry<T>(fn)`**: Exponential backoff, skips retries when `AuthError` is thrown.
- **`AuthError`**: Extends `Error`, carries HTTP status; used to signal 401/403 without triggering retries.
- **`upsertPolicies(normalized: (NormalizedPolicy | null)[])`**: Filters out nulls (counted as skipCount), upserts by `externalId`, returns `{ upsertCount, skipCount, errorCount }`.
- **`getCachedApiResponse(source, page) / setCachedApiResponse(source, page, value)`**: Cache keyed by source+page; any serializable value accepted.

## 7. Cron Slot Budget

`vercel.json` currently defines 5 crons (all `maxDuration: 60`):
1. `/api/cron/sync-public-data` — `0 2 * * *`
2. `/api/cron/sync-bojo24` — `30 2 * * *`
3. `/api/cron/match-policies` — `0 3 * * *`
4. `/api/cron/send-digest` — `0 8 * * *`
5. `/api/cron/deadline-reminder` — `0 9 * * *`

Vercel Hobby plans enforce cron count and execution limits. Adding 3 more separate cron slots is risky. **Unified cron strategy is recommended**: introduce `/api/cron/sync-all-sources` and register new sources there, leaving existing cron routes untouched for backward compatibility.

## 8. Rate Limiting Model

BOJO24 rate limiting is module-scoped (not per-request or per-user):
- `requestCount` and `requestHourStart` live as module globals.
- `checkRateLimit()` resets counters when an hour has passed since `requestHourStart`.
- Returns `false` when limit exceeded; caller decides to break loop or throw.

Replicate this pattern for each new source, with its own constants. Do not share state across sources.

## 9. Testing Pattern

`src/services/data-collection/__tests__/` mirrors service files. Each test suite typically:
- Mocks `fetch` via `vi.stubGlobal` or MSW.
- Mocks `@/lib/db` Prisma client.
- Mocks cache helpers to isolate API behavior.
- Tests: successful sync, Zod validation failure → skipCount, 401 → AuthError path, rate limit → PARTIAL, retry on transient 500.
- Calls `resetRateLimit()` in `beforeEach` to avoid cross-test state.

Coverage target per TRUST 5: ≥85% lines and branches.

## 10. Constraints for New Services

- **Never throw** in `normalize*` — always return null.
- **Always record DataSyncLog** — even on early failure.
- **Never retry AuthError** — rely on `withRetry` short-circuit.
- **Never read absolute file paths** — use `@/` aliases.
- **Follow `code_comments: ko`** — new service code comments in Korean, following existing style.
- **MX tags**: Mark the new `normalize{Source}` functions with `@MX:NOTE` if they contain non-obvious field mapping; `normalize()` dispatcher already carries `@MX:ANCHOR` — update its `@MX:REASON` to reflect new callers.
