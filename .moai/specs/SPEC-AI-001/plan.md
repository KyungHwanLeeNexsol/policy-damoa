# SPEC-AI-001: Implementation Plan

@SPEC:AI-001

## Technical Approach

Policy-Damoa AI recommendations follow a three-tier architecture:

1. **Behavior Layer** — Async event logging (PolicyView, SearchLog, UserSavedPolicy signals)
2. **AI Layer** — GPT-4o-mini with structured output + Redis cache + DB persistence
3. **Presentation Layer** — TanStack Query hooks, shadcn/ui cards, server actions for feedback

Development follows TDD (RED-GREEN-REFACTOR) per project quality.yaml.

## Milestones (Priority-Based)

### Primary Goal: Foundation + Behavior Tracking

**P1.1 — Prisma Schema Migration**
- Add `PolicyView`, `SearchLog`, `PolicyRecommendation`, `RecommendationFeedback` models
- Update `User` and `Policy` relations
- Run `prisma migrate dev --name ai_recommendations`
- Files: `prisma/schema.prisma`

**P1.2 — Gemini AI Client Setup**
- Implement `src/lib/openai.ts` singleton using `openai` package with Gemini's OpenAI-compatible endpoint
  - `baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'`
  - API key from `process.env.GEMINI_API_KEY`
- `GEMINI_API_KEY` already added to `.env.example`
- Tests: mock AI client, verify retry on 5xx

**P1.3 — Behavior Tracking Service**
- Implement `src/services/ai/behavior-tracking.service.ts`
- Functions: `trackPolicyView`, `trackSearch`, `getRecentBehavior(userId)`
- Fire-and-forget via `void` promises; use `waitUntil` in edge runtime
- Tests: RED failing test for async non-blocking behavior → GREEN implementation

**P1.4 — Update CACHE_TTL constants**
- Add `RECOMMENDATIONS: 3600`, `SIMILAR_POLICIES: 21600`, `BEHAVIOR_RECENT: 1800`
- Files: `src/lib/redis.ts`

### Secondary Goal: Recommendation Engine

**P2.1 — Prompt Templates & Schemas**
- Implement `src/services/ai/prompts/recommendation.prompt.ts`
- Implement Zod schema in `src/services/ai/prompts/schemas.ts`
- Define JSON schema for `response_format` (Gemini OpenAI-compatible)
- Tests: validate Zod schema against sample Gemini API responses

**P2.2 — Recommendation Service**
- Implement `src/services/ai/recommendation.service.ts`
- Core function: `generateRecommendations(userId, options)`
- Flow: cache check → candidate fetch → prompt build → Gemini API call → schema validation → Redis cache + DB persist
- Fallback: rule-based scoring on Gemini API failure
- Tests: RED tests for each branch (cache hit, cache miss, Gemini fail, profile missing) → GREEN

**P2.3 — Similar Policies Service**
- Implement `src/services/ai/similar-policies.service.ts`
- Pre-filter: category + region + active deadline
- Re-rank top-20 via GPT-4o-mini
- Cache key: `similar:policy:{policyId}`
- Tests: RED tests for filter correctness + re-rank stability

**P2.4 — API Routes**
- `GET /api/recommendations` → calls recommendation.service
- `POST /api/recommendations/feedback` → upsert RecommendationFeedback
- `GET /api/policies/[id]/similar` → calls similar-policies.service
- Tests: integration tests with mocked session + mocked Gemini API

### Tertiary Goal: UI Integration

**P3.1 — Feature Module Setup**
- Create `src/features/recommendations/` with types.ts
- Implement `use-recommendations` hook (TanStack Query)
- Implement `use-recommendation-feedback` mutation hook with optimistic updates

**P3.2 — UI Components**
- `recommendation-card.tsx` — shadcn Card + policy info + reason + feedback buttons
- `recommendation-feed.tsx` — Homepage section with skeleton loading state
- `similar-policies.tsx` — Detail page section
- `feedback-buttons.tsx` — Thumbs up/down with loading state
- Tests: Vitest + Testing Library component tests

**P3.3 — Homepage Integration**
- Mount `<RecommendationFeed />` on homepage for authenticated users
- Show profile-completion CTA if profile missing
- Navigate with `?source=recommendation` query param

**P3.4 — Detail Page Integration**
- Mount `<SimilarPolicies />` below policy detail content
- Track source via query param

**P3.5 — Full Recommendations Page**
- `/recommendations` route showing all personalized policies with pagination
- Server component with initial data fetch

### Final Goal: Automation & Feedback Loop

**P4.1 — Cron Job**
- Implement `POST /api/cron/generate-recommendations`
- Process active users (with profile) in batches of 50
- Exponential backoff on rate limits
- Log to `DataSyncLog`
- Vercel cron config: `0 2 * * *` (2 AM KST)

**P4.2 — Feedback Incorporation**
- Extend recommendation prompt with aggregated feedback summary
- Down-weight policies similar to DOWN-rated items
- Tests: verify prompt context includes feedback signals

**P4.3 — Behavior Tracking Hooks in Existing Pages**
- Update policy detail page to call `trackPolicyView`
- Update search action to call `trackSearch`
- Non-blocking integration

## Architecture Design Direction

**Data Flow (Cold Path):**
```
User Request → API Route → recommendation.service
  → Redis MISS → fetch top-50 candidates (Prisma)
  → build prompt (profile + behavior + candidates)
  → Gemini API gemini-2.0-flash (structured JSON)
  → Zod validate → persist PolicyRecommendation
  → cache in Redis (1h TTL) → return
```

**Data Flow (Hot Path):**
```
User Request → API Route → recommendation.service
  → Redis HIT → return (sub-50ms)
```

**Behavior Flow (Non-blocking):**
```
Page Interaction → trackPolicyView() fire-and-forget
  → async insert PolicyView → Redis append recent behavior
```

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Gemini API outage | Medium | High | Rule-based fallback from SPEC-NOTIF-001 matching engine |
| High Gemini cost | Low | Medium | Nightly pre-computation + 1h Redis cache; monitor via DataSyncLog |
| Hallucinated recommendation reasons | Low | High | Structured schema + Zod validation + explicit system prompt constraints |
| Prisma migration conflicts | Low | Medium | Coordinate with prior SPECs; test on dev DB first |
| Cold cache latency (>3s) | Medium | Medium | Pre-compute nightly; show skeleton loader during generation |
| Rate limiting under load | Medium | High | Batch cron job with exponential backoff; Redis cache absorbs traffic |
| User privacy in prompts | Low | High | Send only aggregated profile fields; never send PII like email |

## Dependencies

- `openai` npm package (^4.x) — used with Gemini's OpenAI-compatible endpoint
- Existing: `@prisma/client`, `@upstash/redis`, `zod`, `next-auth`, `@tanstack/react-query`
- Environment: `GEMINI_API_KEY`, `CRON_SECRET`

## Testing Strategy

- **Unit**: Services (recommendation, similar, behavior-tracking) with mocked Prisma + mocked Gemini client
- **Integration**: API routes with test DB + mocked Gemini client
- **Component**: UI components with Testing Library
- **E2E** (optional): Homepage recommendation feed rendering for logged-in user
- **Target Coverage**: 85%+ per TRUST 5

## Estimated File Count

~15 new files + ~5 modified files = 20 files total
