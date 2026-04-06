# SPEC-AI-001: Acceptance Criteria

@SPEC:AI-001

## Definition of Done

- All acceptance criteria pass (AC-001 ~ AC-028)
- Test coverage ≥ 85% for new code
- Zero TypeScript errors, zero ESLint errors
- Prisma migration applied successfully on dev DB
- All existing SPEC tests still pass (regression-free)
- Gemini API fallback path verified manually

---

## Behavior Tracking

### AC-001: Policy view tracking for authenticated users
**Given** an authenticated user
**When** they navigate to a policy detail page
**Then** a `PolicyView` record is created with `userId`, `policyId`, `source`, and `viewedAt`
**And** the page renders without blocking on the insert

### AC-002: Policy view NOT tracked for anonymous users
**Given** an unauthenticated visitor
**When** they view a policy detail page
**Then** no `PolicyView` record is created

### AC-003: Save action emits behavior signal
**Given** an authenticated user
**When** they save a policy via the bookmark button
**Then** an existing `UserSavedPolicy` is created
**And** the recent behavior cache (`behavior:user:{userId}:recent`) is invalidated

### AC-004: Search queries are persisted
**Given** an authenticated user
**When** they submit a search with query "청년 창업" and filters `{category: "STARTUP"}`
**Then** a `SearchLog` record is stored with query, filters, and timestamp

### AC-005: Behavior tracking is non-blocking
**Given** the behavior tracking service throws an error
**When** a user views a policy
**Then** the detail page still renders successfully
**And** the error is logged to console but not surfaced to the user

---

## Recommendation Engine

### AC-006: Cache hit returns cached recommendations
**Given** a user has cached recommendations in Redis
**When** they request `GET /api/recommendations`
**Then** the response includes `cached: true`
**And** Gemini API is NOT called
**And** response time is under 100ms

### AC-007: Cache miss triggers Gemini API generation
**Given** a user has no cached recommendations
**When** they request `GET /api/recommendations`
**Then** the service fetches top-50 candidates from DB
**And** calls Gemini API gemini-2.0-flash with structured output schema
**And** validates the response with Zod
**And** persists results to `PolicyRecommendation` table
**And** caches in Redis with 1-hour TTL

### AC-008: Recommendation includes explanation
**Given** a successful Gemini API generation
**When** recommendations are returned
**Then** each recommendation has a `reason` field ≤ 200 characters in Korean

### AC-009: Gemini API failure triggers rule-based fallback
**Given** Gemini API returns a 500 error
**When** the recommendation service is called
**Then** the service uses the SPEC-NOTIF-001 matching engine for scoring
**And** returns results with a static reason
**And** caches with shorter TTL (15 min)
**And** logs fallback event to `DataSyncLog`

### AC-010: Profile-incomplete user receives 422
**Given** a user without a complete `UserProfile`
**When** they request `GET /api/recommendations`
**Then** the API returns HTTP 422 with message "Profile incomplete"

### AC-011: Unauthenticated request returns 401
**Given** no session cookie
**When** `GET /api/recommendations` is called
**Then** the API returns HTTP 401

### AC-012: Schema validation rejects malformed Gemini API response
**Given** Gemini API returns JSON missing required fields
**When** Zod validation runs
**Then** the response is rejected
**And** the fallback path is executed

---

## Personalized Feed

### AC-013: Homepage shows recommendation section for logged-in users
**Given** a logged-in user with a complete profile
**When** they visit the homepage
**Then** a "맞춤 추천 정책" section renders with up to 6 policy cards

### AC-014: Homepage shows profile CTA when no profile
**Given** a logged-in user WITHOUT a profile
**When** they visit the homepage
**Then** a CTA encouraging profile completion is shown instead of recommendations

### AC-015: Recommendation click navigates with source param
**Given** a recommendation card is displayed
**When** the user clicks it
**Then** navigation goes to `/policies/[id]?source=recommendation`
**And** the detail page tracks the view with `source: 'recommendation'`

### AC-016: Loading state shows skeleton
**Given** recommendations are being fetched
**When** the feed renders
**Then** a shadcn skeleton loader is shown
**And** is replaced by actual cards on fetch completion

---

## Similar Policies

### AC-017: Detail page shows similar policies section
**Given** a user views a policy detail page
**When** the page loads
**Then** a "유사 정책" section shows up to 5 policies

### AC-018: Similar policies use category + region pre-filter
**Given** a policy in category "STARTUP" and region "서울"
**When** similar policies are computed
**Then** candidates are first filtered by category OR region
**And** AI re-ranking is applied to top-20 candidates

### AC-019: Similar policies are cached
**Given** similar policies were computed for policy X
**When** another user views policy X within 6 hours
**Then** cached results are returned
**And** Gemini API is NOT re-invoked

---

## Feedback Mechanism

### AC-020: Thumbs up persists feedback
**Given** a user sees a recommendation
**When** they click the thumbs-up button
**Then** a `RecommendationFeedback` record is upserted with `rating: 'UP'`
**And** the button shows an active state

### AC-021: Thumbs down persists feedback
**Given** a user sees a recommendation
**When** they click the thumbs-down button
**Then** a `RecommendationFeedback` record is upserted with `rating: 'DOWN'`

### AC-022: Feedback update replaces previous rating
**Given** a user previously gave thumbs-up to policy X
**When** they click thumbs-down on the same policy
**Then** the existing feedback is updated (not duplicated)
**And** only one row exists in `RecommendationFeedback` for (userId, policyId)

### AC-023: Feedback is user-scoped
**Given** user A gave feedback on policy X
**When** user B queries recommendations
**Then** user B does not see user A's feedback data

### AC-024: Optimistic UI update on feedback click
**Given** a user clicks a feedback button
**When** the mutation is in-flight
**Then** the UI immediately reflects the new state
**And** rolls back on error

---

## Nightly Cron Job

### AC-025: Cron endpoint requires secret
**Given** a POST to `/api/cron/generate-recommendations`
**When** the `x-cron-secret` header is missing or incorrect
**Then** the API returns HTTP 401

### AC-026: Cron processes users in batches
**Given** 200 active users with profiles
**When** the cron job runs
**Then** users are processed in batches of 50
**And** each batch completes before the next starts

### AC-027: Cron handles Gemini API rate limits
**Given** Gemini API returns 429 during cron execution
**When** the batch encounters the error
**Then** exponential backoff is applied (1s, 2s, 4s)
**And** the batch resumes after backoff

### AC-028: Cron run is logged to DataSyncLog
**Given** a completed cron run
**When** processing finishes
**Then** a `DataSyncLog` record is created with counts of success, failure, and tokensUsed

---

## Quality Gates

- [ ] All 28 acceptance criteria pass
- [ ] Vitest coverage ≥ 85% for `src/services/ai/`, `src/features/recommendations/`
- [ ] TypeScript strict mode: 0 errors
- [ ] ESLint: 0 errors
- [ ] Prisma migration applied and reversible
- [ ] No hardcoded secrets; `GEMINI_API_KEY` and `CRON_SECRET` via env
- [ ] No PII (email, name, phone) sent in Gemini API prompts
- [ ] Manual verification of Gemini API fallback path
- [ ] Homepage renders correctly for both profile-complete and profile-incomplete users
- [ ] All previous SPEC tests still pass (no regressions)
