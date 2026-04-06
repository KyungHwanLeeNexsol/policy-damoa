---
id: SPEC-AI-001
title: AI-Powered Policy Recommendations
status: completed
priority: P2
created: 2026-04-06
lifecycle: spec-anchored
dependencies: [SPEC-INFRA-001, SPEC-API-001, SPEC-UI-001, SPEC-NOTIF-001]
complexity: medium
estimated_files: 15
---

# SPEC-AI-001: AI-Powered Policy Recommendations

## 1. Environment

Policy-Damoa is a Korean government policy aggregation platform. This SPEC introduces AI-powered personalized recommendations using Google Gemini API (gemini-2.0-flash) to match policies with user profiles based on observed behavior and explicit eligibility criteria.

**Tech Stack Context:**
- Next.js 16.2.2 (App Router), React 19, TypeScript 5.9
- Prisma 7.x + PostgreSQL (Neon)
- Upstash Redis (serverless, graceful degradation)
- TanStack Query v5
- shadcn/ui + Tailwind CSS v4
- Vitest 4.x (TDD: RED-GREEN-REFACTOR)
- Google Gemini API (gemini-2.0-flash, via OpenAI-compatible endpoint)

**Preconditions (from completed SPECs):**
- User authentication via NextAuth v5 (SPEC-INFRA-001)
- Policy data pipeline and Redis cache layer (SPEC-API-001)
- Policy list/detail/search UI (SPEC-UI-001)
- UserProfile with matching criteria (SPEC-NOTIF-001)

## 2. Assumptions

- A1: Users have a completed `UserProfile` (age, region, income bracket, employment status, interests). SPECs without profiles see a fallback prompt.
- A2: Google Gemini gemini-2.0-flash provides sufficient reasoning quality at low cost (~$0.10/1M input tokens).
- A3: Structured JSON output from Gemini is reliable enough (with schema validation) for production use.
- A4: Nightly batch pre-computation is acceptable for primary recommendations; on-demand generation is reserved for cache misses.
- A5: Redis is the primary cache; graceful degradation falls back to database-stored `PolicyRecommendation`.
- A6: User behavior events (views, saves, searches) are logged asynchronously and do not block request paths.
- A7: Similar policies use hybrid approach: category/region filters + AI re-ranking on top-N candidates.

## 3. Requirements (EARS Format)

### 3.1 Behavior Tracking (REQ-AI-001 ~ REQ-AI-005)

**REQ-AI-001** (Event-Driven): WHEN an authenticated user views a policy detail page, THE SYSTEM SHALL record a `PolicyView` event containing `userId`, `policyId`, `viewedAt`, and `source` (list, search, recommendation, similar).

**REQ-AI-002** (Event-Driven): WHEN an authenticated user saves or unsaves a policy, THE SYSTEM SHALL record the action in the existing `UserSavedPolicy` table and emit an internal behavior signal for recommendation re-computation.

**REQ-AI-003** (Event-Driven): WHEN an authenticated user performs a search, THE SYSTEM SHALL persist the search query, filters applied, and `searchedAt` timestamp for recommendation personalization.

**REQ-AI-004** (Ubiquitous): THE SYSTEM SHALL write behavior events asynchronously (fire-and-forget) so they never block the user request path.

**REQ-AI-005** (Unwanted): THE SYSTEM SHALL NOT record behavior events for unauthenticated visitors or bot traffic.

### 3.2 AI Recommendation Engine (REQ-AI-006 ~ REQ-AI-012)

**REQ-AI-006** (Event-Driven): WHEN a logged-in user requests recommendations, THE SYSTEM SHALL return up to 10 personalized policies ranked by AI relevance score.

**REQ-AI-007** (State-Driven): IF a user's recommendations exist in Redis with key `recommendations:user:{userId}` and TTL not expired, THE SYSTEM SHALL return cached recommendations without invoking Gemini API.

**REQ-AI-008** (State-Driven): IF cached recommendations are missing or stale, THE SYSTEM SHALL fetch top-50 eligible candidate policies filtered by region, category interests, and deadline, then invoke GPT-4o-mini with structured output schema to produce the ranked list.

**REQ-AI-009** (Ubiquitous): THE SYSTEM SHALL use structured JSON output (`response_format: { type: "json_schema" }` via Gemini OpenAI-compatible endpoint) and validate the response with a Zod schema before persisting.

**REQ-AI-010** (Event-Driven): WHEN Gemini API returns a recommendation, THE SYSTEM SHALL include a short natural-language explanation (≤200 chars, Korean) for each recommended policy.

**REQ-AI-011** (Event-Driven): WHEN Gemini API invocation fails (timeout, rate limit, 5xx), THE SYSTEM SHALL fall back to a rule-based ranking using profile matching scores from SPEC-NOTIF-001.

**REQ-AI-012** (Ubiquitous): THE SYSTEM SHALL cache recommendation results in Redis with 1-hour TTL (`CACHE_TTL.RECOMMENDATIONS = 3600`) and persist them to `PolicyRecommendation` table for durable storage.

### 3.3 Personalized Feed (REQ-AI-013 ~ REQ-AI-016)

**REQ-AI-013** (Event-Driven): WHEN a logged-in user visits the homepage, THE SYSTEM SHALL render a "맞춤 추천 정책" section with up to 6 AI-recommended policies.

**REQ-AI-014** (State-Driven): IF the user has no profile or no recommendations yet, THE SYSTEM SHALL display a CTA encouraging profile completion instead of the recommendation section.

**REQ-AI-015** (Event-Driven): WHEN a user clicks a recommended policy card, THE SYSTEM SHALL navigate to the detail page with `source=recommendation` query parameter for tracking.

**REQ-AI-016** (Optional): WHERE feasible, THE SYSTEM SHALL prefetch the detail page on hover to reduce perceived latency.

### 3.4 Similar Policies (REQ-AI-017 ~ REQ-AI-019)

**REQ-AI-017** (Event-Driven): WHEN a user views a policy detail page, THE SYSTEM SHALL display up to 5 "유사 정책" cards below the main content.

**REQ-AI-018** (Ubiquitous): THE SYSTEM SHALL compute similar policies using category + region pre-filter (DB query) followed by AI re-ranking on top-20 candidates.

**REQ-AI-019** (Ubiquitous): THE SYSTEM SHALL cache similar policies per source policy in Redis with key `similar:policy:{policyId}` and 6-hour TTL.

### 3.5 Explanation Display (REQ-AI-020 ~ REQ-AI-021)

**REQ-AI-020** (Ubiquitous): THE SYSTEM SHALL display the AI-generated recommendation reason beneath each recommended policy card.

**REQ-AI-021** (Unwanted): THE SYSTEM SHALL NOT display explanations containing hallucinated facts not present in the source policy data.

### 3.6 Feedback Mechanism (REQ-AI-022 ~ REQ-AI-025)

**REQ-AI-022** (Event-Driven): WHEN a user clicks thumbs-up or thumbs-down on a recommendation, THE SYSTEM SHALL persist a `RecommendationFeedback` record with `userId`, `policyId`, `rating` (UP|DOWN), and `createdAt`.

**REQ-AI-023** (State-Driven): IF the user has already given feedback on a recommendation, THE SYSTEM SHALL allow updating (not duplicating) the existing feedback via upsert.

**REQ-AI-024** (Ubiquitous): THE SYSTEM SHALL incorporate aggregated feedback into the next recommendation generation cycle (down-weight DOWN-rated patterns).

**REQ-AI-025** (Unwanted): THE SYSTEM SHALL NOT expose feedback data of other users.

### 3.7 Nightly Pre-computation (REQ-AI-026 ~ REQ-AI-028)

**REQ-AI-026** (Event-Driven): WHEN the nightly cron job `POST /api/cron/generate-recommendations` runs, THE SYSTEM SHALL regenerate recommendations for all active users with completed profiles.

**REQ-AI-027** (Ubiquitous): THE SYSTEM SHALL process users in batches of 50 with exponential backoff on Gemini API rate limits.

**REQ-AI-028** (Ubiquitous): THE SYSTEM SHALL record each cron run in `DataSyncLog` with counts of success, failure, and Gemini API token usage.

## 4. Specifications

### 4.1 Prisma Schema Additions

```prisma
model PolicyView {
  id        String   @id @default(cuid())
  userId    String
  policyId  String
  source    String   // list | search | recommendation | similar | direct
  viewedAt  DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  policy    Policy   @relation(fields: [policyId], references: [id], onDelete: Cascade)

  @@index([userId, viewedAt])
  @@index([policyId])
}

model SearchLog {
  id         String   @id @default(cuid())
  userId     String?
  query      String
  filters    Json?
  searchedAt DateTime @default(now())
  user       User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId, searchedAt])
}

model PolicyRecommendation {
  id          String   @id @default(cuid())
  userId      String
  policyId    String
  score       Float    // 0.0 - 1.0
  rank        Int
  reason      String   @db.Text
  generatedAt DateTime @default(now())
  expiresAt   DateTime
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  policy      Policy   @relation(fields: [policyId], references: [id], onDelete: Cascade)

  @@unique([userId, policyId])
  @@index([userId, rank])
  @@index([expiresAt])
}

model RecommendationFeedback {
  id        String   @id @default(cuid())
  userId    String
  policyId  String
  rating    String   // UP | DOWN
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  policy    Policy   @relation(fields: [policyId], references: [id], onDelete: Cascade)

  @@unique([userId, policyId])
  @@index([policyId, rating])
}
```

### 4.2 File Structure

```
src/
├── lib/
│   └── openai.ts                              # OpenAI client singleton
├── services/
│   └── ai/
│       ├── recommendation.service.ts          # Core recommendation logic
│       ├── behavior-tracking.service.ts       # Event logging
│       ├── similar-policies.service.ts        # Similar policies logic
│       └── prompts/
│           ├── recommendation.prompt.ts       # GPT prompt templates
│           └── schemas.ts                     # Zod schemas for structured output
├── features/
│   └── recommendations/
│       ├── components/
│       │   ├── recommendation-feed.tsx        # Homepage feed section
│       │   ├── recommendation-card.tsx        # Single recommendation card
│       │   ├── similar-policies.tsx           # Detail page similar section
│       │   └── feedback-buttons.tsx           # Thumbs up/down UI
│       ├── hooks/
│       │   ├── use-recommendations.ts         # TanStack Query hook
│       │   └── use-recommendation-feedback.ts # Mutation hook
│       ├── actions/
│       │   └── feedback.action.ts             # Server action for feedback
│       └── types.ts                           # Shared TS types
└── app/
    ├── (main)/
    │   └── recommendations/
    │       └── page.tsx                       # Full recommendations page
    └── api/
        ├── recommendations/
        │   ├── route.ts                       # GET /api/recommendations
        │   └── feedback/
        │       └── route.ts                   # POST /api/recommendations/feedback
        ├── policies/
        │   └── [id]/
        │       └── similar/
        │           └── route.ts               # GET /api/policies/[id]/similar
        └── cron/
            └── generate-recommendations/
                └── route.ts                   # POST nightly job
```

### 4.3 Gemini AI Integration

**Client** (`src/lib/openai.ts`):
- Singleton `OpenAI` client (from `openai` npm package) configured for Gemini OpenAI-compatible endpoint
- `baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'`
- API key from `process.env.GEMINI_API_KEY`
- 30-second request timeout
- Retry: 2 attempts with exponential backoff

**Model**: `gemini-2.0-flash`
**Response Format**: `{ type: "json_schema", json_schema: {...} }`
**Max Tokens**: 2000 per request
**Temperature**: 0.3 (prioritize consistency over creativity)

**Prompt Structure**:
1. System: Role definition (Korean policy advisor), output constraints
2. User: Profile summary + recent behavior + candidate policies (top-50)
3. Schema: `{ recommendations: [{ policyId, score, rank, reason }] }`

### 4.4 Cache Keys & TTL

Add to existing `CACHE_TTL` enum in `src/lib/redis.ts`:

| Key | TTL | Purpose |
|-----|-----|---------|
| `recommendations:user:{userId}` | 1 hour | User's personalized feed |
| `similar:policy:{policyId}` | 6 hours | Similar policies per source |
| `behavior:user:{userId}:recent` | 30 min | Recent view signals for prompt context |

### 4.5 API Contracts

**GET /api/recommendations**
- Auth: Required (NextAuth session)
- Query: `?limit=10&offset=0`
- Response 200: `{ recommendations: RecommendationDTO[], generatedAt, cached: boolean }`
- Response 401: Unauthorized
- Response 422: Profile incomplete

**POST /api/recommendations/feedback**
- Auth: Required
- Body: `{ policyId: string, rating: 'UP' | 'DOWN' }`
- Response 200: `{ success: true }`
- Response 400: Invalid payload

**GET /api/policies/[id]/similar**
- Auth: Optional (enhanced results if authenticated)
- Query: `?limit=5`
- Response 200: `{ similar: PolicyDTO[] }`

**POST /api/cron/generate-recommendations**
- Auth: Cron secret header `x-cron-secret`
- Response 200: `{ processed: number, failed: number, tokensUsed: number }`

### 4.6 Fallback Strategy

When Gemini API is unavailable:
1. Use rule-based scoring from SPEC-NOTIF-001 matching engine
2. Generate static reason: "프로필과 일치하는 카테고리 및 지역 조건"
3. Cache with shorter TTL (15 min) and `fallback: true` flag
4. Log fallback event to `DataSyncLog`

## 5. Exclusions (What NOT to Build)

- **Shall NOT support** semantic embedding search in this SPEC (reason: deferred to future SPEC-AI-002)
- **Shall NOT implement** real-time recommendation updates via WebSockets (reason: batch + cache is sufficient for P2 scope)
- **Shall NOT train** custom ML models (reason: GPT-4o-mini provides acceptable quality at lower cost and no MLOps burden)
- **Shall NOT build** A/B testing framework for recommendation variants (reason: out of scope; feedback data collection is foundation for future experimentation)
- **Shall NOT expose** raw Gemini API responses to the client (reason: security and schema stability)
- **Shall NOT implement** recommendation explanations in languages other than Korean (reason: product is Korean-only)
- **Will NOT be optimized** for sub-100ms recommendation generation (reason: cached responses are sub-50ms; cold generation up to 5s is acceptable)

## 6. Traceability

- @SPEC:AI-001 → src/services/ai/recommendation.service.ts
- @SPEC:AI-001:BEHAVIOR → src/services/ai/behavior-tracking.service.ts
- @SPEC:AI-001:SIMILAR → src/services/ai/similar-policies.service.ts
- @SPEC:AI-001:API → src/app/api/recommendations/route.ts
- @SPEC:AI-001:CRON → src/app/api/cron/generate-recommendations/route.ts
- @SPEC:AI-001:UI → src/features/recommendations/

## 7. Implementation Notes

**Implementation Date:** 2026-04-06

**Status:** All 4 milestones completed.

**Test Results:** 343 tests passing.

**Key Deviations from SPEC:**

- `CACHE_TTL` constants are defined in `src/lib/cache-ttl.ts` (not in `src/lib/redis.ts` as specified in Section 4.4). This separation was chosen to avoid circular dependencies and keep Redis system concerns isolated from application-level cache constants.

**DB Migration Required:**

```bash
pnpm prisma db push
```

This project does not use migration files. Run `pnpm prisma db push` after pulling changes to apply the new Prisma models: `PolicyView`, `SearchLog`, `PolicyRecommendation`, `RecommendationFeedback`.

**Notable Implementation Decisions:**

- Gemini API is accessed via the `openai` npm package using the OpenAI-compatible endpoint (`https://generativelanguage.googleapis.com/v1beta/openai/`)
- Behavior tracking (view events, search logs) uses fire-and-forget async pattern — errors are silently ignored to avoid blocking the request path
- `ProfileIncompleteError` custom error class triggers HTTP 422 response for users without a completed profile
- Vitest mocks require `vi.hoisted()` for variable initialization ordering in `vi.mock()` factory functions
