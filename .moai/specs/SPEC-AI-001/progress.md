## SPEC-AI-001 Progress

- Started: 2026-04-06T06:43:11+09:00
- Development Mode: TDD (RED-GREEN-REFACTOR)
- Harness Level: standard
- Execution Mode: Full Pipeline (sub-agent, sequential milestones)
- Language Skills: moai-lang-typescript
- Phase 0.9 complete: TypeScript/Next.js detected (package.json with typescript)
- Phase 0.95 complete: Full Pipeline mode (files: 15, domains: 2 — backend/frontend)

## Milestone 1 — Foundation (완료)

- 상태: GREEN (12/12 테스트 통과, TS strict 0 오류)
- RED → GREEN → REFACTOR 사이클 1회 완료
- 추가된 파일:
  - `src/lib/openai.ts` — Gemini OpenAI 호환 클라이언트 싱글톤 (@MX:ANCHOR)
  - `src/lib/cache-ttl.ts` — CACHE_TTL 상수 (RECOMMENDATIONS/SIMILAR_POLICIES/BEHAVIOR_RECENT)
  - `src/services/ai/behavior-tracking.service.ts` — trackPolicyView/trackSearch/getRecentBehavior (fire-and-forget)
  - `src/lib/__tests__/openai.test.ts` — 2 테스트
  - `src/services/ai/__tests__/behavior-tracking.service.test.ts` — 10 테스트
- 검증한 AC: AC-001, AC-003 (캐시 무효화), AC-004, AC-005
- 설계 결정: SPEC 은 CACHE_TTL 을 redis.ts 에 추가하라고 명시했으나
  redis.ts 는 변경 금지 정책이 걸려 있어 `src/lib/cache-ttl.ts` 로 분리.
- 미수행: M2 (recommendation/similar 서비스 + API 라우트), M3 (UI), M4 (cron)

## Milestone 2 — 추천·유사 서비스 (완료)

- 상태: GREEN (AC-006~AC-009 완료)
- RED → GREEN → REFACTOR 사이클 1회 완료
- 추가된 파일:
  - `src/services/ai/recommendation.service.ts` — 핵심 추천 엔진 (캐시→Gemini→폴백)
  - `src/services/ai/similar-policies.service.ts` — 유사 정책 AI 재랭킹
  - `src/services/ai/prompts/recommendation.prompt.ts` — PII 제거 프롬프트 빌더
  - `src/services/ai/prompts/schemas.ts` — Gemini 구조화 출력용 Zod 스키마
  - `src/services/ai/__tests__/recommendation.service.test.ts`
  - `src/services/ai/__tests__/similar-policies.service.test.ts`
  - `src/services/ai/prompts/__tests__/schemas.test.ts`
  - `src/services/ai/prompts/__tests__/recommendation.prompt.test.ts`
- 검증한 AC: AC-006 (추천 서비스), AC-007 (유사 정책), AC-008 (Gemini 구조화 출력), AC-009 (폴백 전략)

## Milestone 3 — UI 컴포넌트·훅·액션·API 라우트 (완료)

- 상태: GREEN (AC-010~AC-013 완료)
- RED → GREEN → REFACTOR 사이클 1회 완료
- 추가된 파일:
  - `src/features/recommendations/components/recommendation-feed.tsx` — 홈 피드 섹션
  - `src/features/recommendations/components/recommendation-card.tsx` — 추천 카드 컴포넌트
  - `src/features/recommendations/components/similar-policies.tsx` — 유사 정책 섹션
  - `src/features/recommendations/components/feedback-buttons.tsx` — 좋아요/싫어요 버튼
  - `src/features/recommendations/hooks/use-recommendations.ts` — TanStack Query 훅
  - `src/features/recommendations/hooks/use-recommendation-feedback.ts` — 낙관적 업데이트 뮤테이션 훅
  - `src/features/recommendations/actions/feedback.action.ts` — 피드백 Server Action
  - `src/features/recommendations/types/index.ts` — 추천 관련 타입 정의
  - `src/app/(main)/recommendations/page.tsx` — 전체 추천 페이지
  - `src/app/api/recommendations/route.ts` — GET /api/recommendations (auth, 401/422/200)
  - `src/app/api/recommendations/feedback/route.ts` — POST /api/recommendations/feedback
  - `src/app/api/policies/[id]/similar/route.ts` — GET /api/policies/[id]/similar
- 검증한 AC: AC-010 (개인화 피드), AC-011 (유사 정책 UI), AC-012 (피드백 메커니즘), AC-013 (추천 이유 표시)

## Milestone 4 — 야간 추천 생성 Cron (완료)

- 상태: GREEN (AC-014~AC-015 완료)
- RED → GREEN → REFACTOR 사이클 1회 완료
- 추가된 파일:
  - `src/app/api/cron/generate-recommendations/route.ts` — POST (x-cron-secret, 배치 50, 지수 백오프)
- 검증한 AC: AC-014 (야간 배치 사전 계산), AC-015 (지수 백오프 배치 처리)

- All milestones complete: 343 tests passing, 0 type errors in new files (after CI fix abfec31)
