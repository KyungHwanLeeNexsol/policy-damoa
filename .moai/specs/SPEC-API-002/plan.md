# SPEC-API-002: Implementation Plan

## Technical Approach

Follow the existing two-source pattern exactly. Introduce a lightweight registry + unified cron route to accommodate three new sources without exceeding Vercel Hobby cron quotas. Preserve backward compatibility with existing cron routes and tests.

## Milestones

### Primary Goal — Type System & Normalizer Foundation

- Extend `src/types/sync.ts` `SyncSource` union: add `'BOKJIRO' | 'WORK24' | 'SMBA'`.
- Extend `src/services/data-collection/types.ts`:
  - Add `RawBokjiroPolicySchema` + `RawBokjiroPolicy` type.
  - Add `RawWork24PolicySchema` + `RawWork24Policy` type.
  - Add `RawSmbaPolicySchema` + `RawSmbaPolicy` type.
  - Extend `NormalizedPolicySchema.sourceSystem` enum to include the three new values.
- Extend `src/services/data-collection/normalizer.ts`:
  - Add three `case` branches in the `normalize()` switch.
  - Add `normalizeBokjiro`, `normalizeWork24`, `normalizeSmba` private functions.
  - Update `@MX:ANCHOR` sub-line `@MX:REASON` to mention new callers (5 services).

### Secondary Goal — Service Implementations

Create three new service files mirroring `bojo24.service.ts`:

- `src/services/data-collection/bokjiro.service.ts` — `SOURCE = 'BOKJIRO'`, env `BOKJIRO_API_KEY`, 500/hour default.
- `src/services/data-collection/work24.service.ts` — `SOURCE = 'WORK24'`, env `WORK24_API_KEY`, 500/hour default.
- `src/services/data-collection/smba.service.ts` — `SOURCE = 'SMBA'`, env `SMBA_API_KEY`, 500/hour default.

Each service exports `syncAll()` and `resetRateLimit()` following the bojo24 pattern.

### Tertiary Goal — Registry & Unified Cron

- Create `src/services/data-collection/registry.ts`:
  - Export `SourceDefinition` interface: `{ source: SyncSource; envKey: string; syncAll: () => Promise<void>; timeBudgetMs: number }`.
  - Export `SOURCE_REGISTRY: SourceDefinition[]` containing entries for the three new sources (and optionally BOJO24 + PUBLIC_DATA_PORTAL for future consolidation — gated behind a comment, not activated in this SPEC).

- Create `src/app/api/cron/sync-all-sources/route.ts`:
  - `GET` handler with `CRON_SECRET` bearer token check (match existing cron pattern).
  - Iterate `SOURCE_REGISTRY` sequentially.
  - For each entry: skip with warning log if `process.env[envKey]` missing; otherwise invoke `syncAll()` inside try/catch.
  - Track cumulative elapsed ms; stop iteration if remaining budget < next entry's `timeBudgetMs`.
  - Return a JSON summary: `{ ok: true, results: [{ source, status, durationMs }] }`.

- Update `vercel.json`:
  - Add cron entry: `{ "path": "/api/cron/sync-all-sources", "schedule": "45 2 * * *" }`.
  - Add function entry: `"src/app/api/cron/sync-all-sources/route.ts": { "maxDuration": 60 }`.

### Final Goal — Tests & Documentation

- Create unit test files in `src/services/data-collection/__tests__/`:
  - `bokjiro.service.test.ts`
  - `work24.service.test.ts`
  - `smba.service.test.ts`
- Create `src/app/api/cron/sync-all-sources/route.test.ts` covering:
  - Missing env var skip path.
  - Time-budget abort path.
  - Error isolation between sources.
  - Auth header validation.
- Update `.env.example` with `BOKJIRO_API_KEY`, `WORK24_API_KEY`, `SMBA_API_KEY` placeholders.
- Verify all 356 existing tests still pass.

## File List

### New Files

| Path | Purpose |
|------|---------|
| `src/services/data-collection/bokjiro.service.ts` | 복지로 client + syncAll |
| `src/services/data-collection/work24.service.ts` | 고용24 client + syncAll |
| `src/services/data-collection/smba.service.ts` | 중소기업 client + syncAll |
| `src/services/data-collection/registry.ts` | Source registry |
| `src/app/api/cron/sync-all-sources/route.ts` | Unified cron handler |
| `src/services/data-collection/__tests__/bokjiro.service.test.ts` | BOKJIRO unit tests |
| `src/services/data-collection/__tests__/work24.service.test.ts` | WORK24 unit tests |
| `src/services/data-collection/__tests__/smba.service.test.ts` | SMBA unit tests |
| `src/app/api/cron/sync-all-sources/route.test.ts` | Cron route tests |

### Modified Files

| Path | Change |
|------|--------|
| `src/types/sync.ts` | Extend `SyncSource` union with 3 new values |
| `src/services/data-collection/types.ts` | Add 3 raw schemas + extend `sourceSystem` enum |
| `src/services/data-collection/normalizer.ts` | Add 3 switch cases + 3 normalize functions; update `@MX:REASON` |
| `src/services/data-collection/index.ts` | Re-export new services from barrel |
| `vercel.json` | Add unified cron entry + function config |
| `.env.example` | Add 3 new API key placeholders |

### Not Modified

- `src/services/data-collection/deduplicator.ts` — no changes required.
- `src/services/data-collection/utils.ts` — no changes required.
- `src/services/data-collection/publicDataPortal.service.ts` — no changes required.
- `src/services/data-collection/bojo24.service.ts` — no changes required.
- `src/app/api/cron/sync-public-data/route.ts` — retained for backward compatibility.
- `src/app/api/cron/sync-bojo24/route.ts` — retained for backward compatibility.

## Cron Strategy Decision

**Decision: Unified cron route with registry pattern.**

**Rationale**:
- Vercel Hobby plan limits cron count; adding 3 more separate crons risks exceeding quota.
- A single `/api/cron/sync-all-sources` route with sequential source dispatch consumes only one cron slot.
- Registry pattern keeps source list extensible with minimal cron-layer changes.
- Existing `sync-public-data` and `sync-bojo24` routes are retained to avoid disrupting current production schedules; their migration into the unified cron is a follow-up SPEC.
- Per-source time budget (15 seconds default × 3 sources = 45 seconds, leaving ~15 seconds overhead) fits within Vercel Hobby's 60-second `maxDuration`.

**Alternative considered**: Per-source cron routes (rejected due to Hobby plan cron quota risk and infrastructure duplication).

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| One source's failure stalls the whole unified run | Each source wrapped in isolated try/catch; failures logged to `DataSyncLog`, iteration continues |
| Time budget overrun breaks other crons | Hard time budget check before invoking each source; abort with PARTIAL status |
| API field structure unknown pre-implementation | Raw Zod schemas start permissive (most fields optional); tighten after first real API response captured |
| `DataSyncLog` Prisma enum does not include new sources | Verify during implementation; create Prisma migration if required |
| Rate limit miscalibration | Default 500/hour; tune after monitoring first production runs |

## Quality Gates

- All new service files reach ≥85% line and branch coverage.
- All 356 existing tests pass without modification.
- `pnpm typecheck` passes with zero errors.
- `pnpm lint` passes with zero warnings in new files.
- No `any` types in new code; all Zod schemas explicit.
- All new exported functions have explicit return types.
