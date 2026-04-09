# SPEC-API-002: Implementation Progress

Status: **Planned**
Created: 2026-04-09

## Phase Tracking

### Plan Phase
- [x] Create spec.md with EARS requirements
- [x] Create research.md with existing architecture analysis
- [x] Create plan.md with file list and milestones
- [x] Create acceptance.md with Given-When-Then scenarios
- [x] Create progress.md (this file)

### Run Phase (Pending /moai:2-run SPEC-API-002)
- [ ] Extend `SyncSource` type in `src/types/sync.ts`
- [ ] Add 3 raw Zod schemas in `types.ts`
- [ ] Extend `NormalizedPolicySchema.sourceSystem` enum
- [ ] Add 3 normalizer cases in `normalizer.ts`
- [ ] Implement `bokjiro.service.ts`
- [ ] Implement `work24.service.ts`
- [ ] Implement `smba.service.ts`
- [ ] Implement `registry.ts`
- [ ] Implement `sync-all-sources/route.ts`
- [ ] Update `vercel.json`
- [ ] Update `.env.example`
- [ ] Write 3 service test files
- [ ] Write unified cron route test file
- [ ] Verify 356 existing tests still pass
- [ ] Verify typecheck + lint clean

### Sync Phase (Pending /moai:3-sync SPEC-API-002)
- [ ] Update API documentation
- [ ] Update architecture diagram if applicable
- [ ] Commit with SPEC-API-002 reference

## Notes

- Housing (주거 지원) source is explicitly deferred to a follow-up SPEC.
- Existing per-source cron routes (`sync-public-data`, `sync-bojo24`) are intentionally preserved for backward compatibility.
- Real API rate limits for BOKJIRO/WORK24/SMBA need confirmation during implementation; defaults are 500/hour.
- DataSyncLog Prisma enum extension may require a migration; to be verified at start of Run phase.
