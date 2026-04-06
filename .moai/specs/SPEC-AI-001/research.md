# SPEC-AI-001: Research & Codebase Analysis

@SPEC:AI-001

## Existing Codebase Findings

### Prior SPECs (all completed)
- **SPEC-INFRA-001**: Prisma models (`User`, `Policy`, `UserSavedPolicy`, `PolicyCategory`, `NotificationLog`, `DataSyncLog`) are in place. NextAuth v5 session layer is usable via `auth()` server helper.
- **SPEC-API-001**: `src/lib/redis.ts` exists with Upstash client + graceful degradation pattern. `CACHE_TTL` enum is the conventional place to add new keys. Cron pattern established in `/api/cron/*` routes.
- **SPEC-UI-001**: Policy list/detail/search pages provide integration points. Policy detail page is the target for `<SimilarPolicies />` injection. Homepage is the target for `<RecommendationFeed />`.
- **SPEC-NOTIF-001**: `UserProfile` schema (age, region, income, employment, interests) + matching engine. The matching engine is the direct source for the rule-based fallback scorer.

### Key Conventions Observed
1. **Service layer pattern**: `src/services/{domain}/` with `.service.ts` suffix
2. **Feature module pattern**: `src/features/{name}/` with `components/`, `hooks/`, `actions/`, `types.ts`
3. **API route pattern**: Next.js App Router `route.ts` handlers with `auth()` session check
4. **Cache pattern**: Redis-first with DB fallback; TTL constants in `CACHE_TTL` enum
5. **TDD pattern**: `*.test.ts` colocated; Vitest config with `describe`/`it`/`expect`
6. **Server action pattern**: `actions/*.action.ts` with `'use server'` directive
7. **TanStack Query pattern**: `use-*` hooks with queryKey arrays; mutations use `onMutate` for optimistic updates

### Integration Points
- `src/app/(main)/page.tsx` — add `<RecommendationFeed />` (server component with auth check)
- `src/app/(main)/policies/[id]/page.tsx` — add `<SimilarPolicies policyId={id} />` and call `trackPolicyView`
- `src/app/(main)/policies/page.tsx` (search) — call `trackSearch` in search action
- `src/lib/redis.ts` — extend `CACHE_TTL` object
- `prisma/schema.prisma` — add 4 new models + update User/Policy relations

## External Research

### Gemini Structured Output (gemini-2.0-flash via Gemini API-compatible endpoint)
- `response_format: { type: 'json_schema', json_schema: { name, strict: true, schema } }` enforces schema compliance at the model level
- Strict mode (`strict: true`) guarantees valid JSON matching schema, eliminating most parsing errors
- GPT-4o-mini supports structured output as of late 2024
- Cost: ~$0.15/1M input, $0.60/1M output — approx $0.0002 per recommendation request (500 input + 200 output tokens)
- 200 users × nightly regeneration ≈ $0.04/day, $1.20/month — well within acceptable range

### Zod + Gemini API Pattern
Use `zod-to-json-schema` package to convert Zod schema to Gemini API-compatible JSON schema, then validate responses with the same Zod schema. Provides single source of truth for types.

### Rate Limiting Considerations
- Gemini API Tier 1: 500 RPM for gpt-4o-mini (sufficient for user-facing cache-miss path)
- Cron batch of 50 users with 1s spacing = 50 RPM, well under limit
- Exponential backoff: 1s → 2s → 4s with max 3 retries

## Risk Mitigation Analysis

### Risk: Prompt Injection via Profile/Policy Data
Policies are admin-curated (from data.go.kr), profile is user-entered but field-constrained. Low injection risk. Still, wrap all user content in clear delimiters in the prompt.

### Risk: Inconsistent Recommendations
Temperature 0.3 + structured output + cache minimizes variance. Feedback loop allows correction over time.

### Risk: Cold Start Latency
Nightly pre-computation + 1h cache means most requests hit warm cache. Cold path (~2-5s) is acceptable for low-frequency edge cases. UI shows skeleton during generation.

## Open Questions (deferred to implementation)
1. Should recommendation score be surfaced in UI? → Decision: no, only ranking visible
2. How to handle policies that expire between generation and display? → Filter on read, mark expired
3. Should similar policies include the source policy itself? → No, exclude via `id != sourceId`
4. Pagination for `/recommendations` page? → Yes, 20 per page using cursor pagination

## References
- Gemini API Structured Outputs: https://platform.openai.com/docs/guides/structured-outputs
- Zod: https://zod.dev/
- TanStack Query Mutations: https://tanstack.com/query/latest/docs/framework/react/guides/mutations
- Next.js 15 App Router: https://nextjs.org/docs/app

## Conclusion
All prerequisites from prior SPECs are in place. Patterns are well-established. Risk profile is low. Implementation can proceed directly with TDD.
