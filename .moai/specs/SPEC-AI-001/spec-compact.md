# SPEC-AI-001 (Compact)

**AI-Powered Policy Recommendations** | P2 | spec-anchored | Deps: INFRA, API, UI, NOTIF

## Goal
Personalized policy recommendations using Google Gemini API (gemini-2.0-flash via OpenAI-compatible endpoint), with behavior tracking, similar policies, explanations, and feedback loop.

## Key Requirements
- REQ-AI-001..005: Track PolicyView, SearchLog, save signals (async, auth-only, non-blocking)
- REQ-AI-006..012: GPT-4o-mini recommendations with Redis 1h cache, Zod-validated structured output, rule-based fallback on failure
- REQ-AI-013..016: Homepage "맞춤 추천 정책" section (6 cards), profile CTA fallback
- REQ-AI-017..019: Similar policies (category+region pre-filter + AI re-rank top-20, 6h cache)
- REQ-AI-020..021: Korean explanations ≤200 chars, no hallucinations
- REQ-AI-022..025: Thumbs up/down feedback with upsert, user-scoped, feeds next cycle
- REQ-AI-026..028: Nightly cron (batch 50, exp backoff, DataSyncLog)

## New Prisma Models
- `PolicyView` (userId, policyId, source, viewedAt)
- `SearchLog` (userId?, query, filters, searchedAt)
- `PolicyRecommendation` (userId, policyId, score, rank, reason, expiresAt) — unique(userId, policyId)
- `RecommendationFeedback` (userId, policyId, rating UP|DOWN) — unique(userId, policyId)

## New Files (15)
- `src/lib/openai.ts`
- `src/services/ai/{recommendation,behavior-tracking,similar-policies}.service.ts`
- `src/services/ai/prompts/{recommendation.prompt,schemas}.ts`
- `src/features/recommendations/components/{recommendation-feed,recommendation-card,similar-policies,feedback-buttons}.tsx`
- `src/features/recommendations/hooks/{use-recommendations,use-recommendation-feedback}.ts`
- `src/features/recommendations/actions/feedback.action.ts`
- `src/features/recommendations/types.ts`
- `src/app/(main)/recommendations/page.tsx`
- `src/app/api/recommendations/route.ts`
- `src/app/api/recommendations/feedback/route.ts`
- `src/app/api/policies/[id]/similar/route.ts`
- `src/app/api/cron/generate-recommendations/route.ts`

## Cache Keys (add to CACHE_TTL)
- `recommendations:user:{userId}` = 3600s
- `similar:policy:{policyId}` = 21600s
- `behavior:user:{userId}:recent` = 1800s

## API
- `GET /api/recommendations` (auth, 401/422/200)
- `POST /api/recommendations/feedback` (auth, body: policyId+rating)
- `GET /api/policies/[id]/similar` (optional auth)
- `POST /api/cron/generate-recommendations` (x-cron-secret header)

## Model Config
- `gemini-2.0-flash`, temp 0.3, max 2000 tokens, 30s timeout, 2 retries
- `response_format: { type: 'json_schema' }` (Gemini OpenAI-compatible endpoint)
- Base URL: `https://generativelanguage.googleapis.com/v1beta/openai/`
- Env: `GEMINI_API_KEY`
- Prompt: system role + profile + recent behavior + top-50 candidates

## Exclusions
- No embeddings/semantic search (future SPEC-AI-002)
- No realtime WebSocket updates
- No custom ML training
- No A/B testing framework
- No multi-language explanations (Korean only)
- No PII in prompts

## Quality Gates
- 85%+ coverage, 0 TS/ESLint errors, migration reversible, no regressions
