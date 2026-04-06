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
