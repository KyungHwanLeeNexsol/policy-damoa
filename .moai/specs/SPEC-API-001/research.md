# Research: SPEC-API-001 Data Pipeline

**Generated**: 2026-04-06  
**Project**: Policy-Damoa  
**Status**: Research Phase Complete

## Executive Summary

Deep codebase analysis for SPEC-API-001 Data Pipeline implementation.

**Key Findings**:
- Prisma schema 90% complete but missing DataSyncLog model (CRITICAL)
- Zod already installed and ready
- Services directory empty - needs 3 modules
- Test framework established with Vitest
- External API specs need research
- Rate limiting utilities not yet implemented

## 1. Existing Schema Analysis

### Policy Model (/src/prisma/schema.prisma lines 69-93)

Well-designed with:
- externalId unique index for deduplication
- JSONB columns for flexible data
- Indexes on title, regionId, applicationDeadline
- sourceAgency for filtering

Missing: sourceSystem field to distinguish data sources

### Region Model

Supports Korean hierarchy: 시도 > 시군구 > 읍면동
Must seed table before first sync

### CRITICAL: DataSyncLog Model Missing

**Finding**: Structure.md references DataSyncLog audit model, but NOT in schema.prisma

**Required**: Add migration with source, status, totalCount, upsertCount, skipCount, errorCount, startedAt, completedAt, durationMs

## 2. Service Architecture Baseline

### Current Status

Directory `/src/services/` is EMPTY - only .gitkeep

### Must Implement

src/services/data-collection/
- publicDataPortal.service.ts
- bojo24.service.ts
- normalizer.ts
- index.ts
- types.ts

## 3. Dependency Gap Analysis

### Installed

- @prisma/client ^7.6.0
- zod 4.3.6

### Not Installed (Priority)

- @upstash/redis (P0 - CRITICAL)
- date-fns (P1)
- cheerio (P1 - optional)

Note: Node.js 20.19.6 has native fetch()

## 4. Test Pattern Reference

### Vitest Setup

- jsdom environment
- Setup file: ./tests/setup.ts  
- Coverage via v8

### Mocking

Use vi.mock() for external modules
vi.resetModules() for reimporting

### Structure

- describe() for suites
- One assertion per test
- beforeEach/afterEach for setup

## 5. Route Handler Patterns

### NextAuth Example

```typescript
import { handlers } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export const { GET, POST } = handlers;
```

### Cron Route Pattern

```typescript
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await fetchPublicDataPortalPolicies();
    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

## 6. External API Integration

### data.go.kr

- API Key authentication
- ~1,000-3,000 req/day rate
- JSON/XML response
- Offset-based pagination

### 보조금24

- API Key authentication
- Less documented
- Stricter rate limiting

### Local Government Sites

- HTML crawling approach
- Cheerio or Playwright
- 50+ different site structures
- HTML changes break parsers

### Rate Limiting Strategy

- Redis sliding window pattern
- data.go.kr: 500 req/hour
- 보조금24: 500 req/hour
- Local gov: 1 req/site/day
- Cache 6+ hours

## 7. Implementation Risks

1. **API Reliability**: Mitigation - exponential backoff, cache, DataSyncLog
2. **Rate Exhaustion**: Mitigation - queuing, Redis tracking, incremental sync
3. **Normalization Failures**: Mitigation - Zod validation, lenient skip, log
4. **Duplicate Detection**: Mitigation - externalId dedup, similarity hash
5. **Cron Timeout (900s)**: Mitigation - pagination with cursor, parallelize
6. **Missing DataSyncLog**: Mitigation - create migration immediately

## 8. Recommended Implementation Approach

### Service Layer

```
src/services/data-collection/
├── index.ts
├── publicDataPortal.service.ts
├── bojo24.service.ts
├── normalizer.ts
├── deduplicator.ts
└── types.ts
```

### Caching

- Layer 1: API Response Cache (6h) - `api:source:page:{page}`
- Layer 2: Query Cache (15m) - `policy:list:filter:{hash}`

### Normalization

Transform at boundary with Zod validation

### Testing

- Unit tests: Normalization
- Integration: Upsert patterns
- Mocked: API responses

### Vercel Cron (vercel.json)

```json
{
  "crons": [
    {"path": "/api/cron/sync-public-data", "schedule": "0 */6 * * *"},
    {"path": "/api/cron/sync-bojo24", "schedule": "0 */6 * * *"},
    {"path": "/api/cron/crawl-local-govs", "schedule": "0 3 * * *"}
  ]
}
```

## 9. File Structure

```
src/services/data-collection/
├── index.ts
├── publicDataPortal.service.ts
├── bojo24.service.ts
├── normalizer.ts
├── deduplicator.ts
├── types.ts
└── __tests__/

src/lib/
├── redis.ts (NEW)
└── constants.ts (extend)

src/app/api/cron/
├── sync-public-data/route.ts
├── sync-bojo24/route.ts
└── crawl-local-govs/route.ts

prisma/
├── migrations/[timestamp]_add_data_sync_log/
└── schema.prisma (update)
```

## 10. Environment Variables

```bash
PUBLIC_DATA_PORTAL_API_KEY=
BOJO24_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
CRON_SECRET=
DATA_COLLECTION_BATCH_SIZE=1000
DATA_COLLECTION_RETRY_MAX=3
DATA_COLLECTION_RETRY_DELAY_MS=1000
```

## 11. Summary

| Item | Status | Priority |
|------|--------|----------|
| Prisma Schema | 90% | P0 - Add DataSyncLog |
| Services Dir | Empty | P0 |
| Redis Client | Missing | P0 |
| Test Framework | Ready | N/A |
| External APIs | Research | P0 |
| Rate Limiting | Missing | P1 |
| Cron Config | Missing | P0 |

---

Research Complete - 2026-04-06

