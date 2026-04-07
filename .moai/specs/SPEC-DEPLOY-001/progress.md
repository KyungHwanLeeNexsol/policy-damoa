## SPEC-DEPLOY-001 Progress

- Started: 2026-04-07T00:00:00+09:00
- Phase 0.9 complete: TypeScript 프로젝트 감지 → moai-lang-typescript
- Phase 0.95 complete: Scale-based mode = Focused Mode (1 domain: deployment, ≤4 files)

### Harness Level
- Level: standard (default)

### Cron Route Auth Status (Phase 1 pre-scan)
- sync-public-data: ✅ CRON_SECRET Bearer auth 구현됨
- sync-bojo24: ✅ CRON_SECRET Bearer auth 구현됨
- match-policies: ✅ CRON_SECRET Bearer auth 구현됨
- send-digest: ✅ CRON_SECRET Bearer auth 구현됨
- deadline-reminder: ✅ CRON_SECRET Bearer auth 구현됨

### Test Coverage Gap (Phase 1 pre-scan)
- sync-public-data: ✅ 401 테스트 존재
- match-policies: ✅ 401 테스트 존재
- sync-bojo24: ❌ 테스트 파일 없음
- send-digest: ❌ 테스트 파일 없음
- deadline-reminder: ❌ 테스트 파일 없음

### Phase 2 Implementation (2026-04-07)
- sync-bojo24/__tests__/route.test.ts: 생성 (4 tests: 401×2, 200, 500)
- send-digest/__tests__/route.test.ts: 생성 (4 tests: 401×2, 200, 500)
- deadline-reminder/__tests__/route.test.ts: 생성 (4 tests: 401×2, 200, 500)
- .env.example: NEXTAUTH_URL Vercel 주석 추가, FCM_SERVER_KEY(미사용) 제거, NEXT_PUBLIC_APP_URL 추가
- Tests: 12/12 passed ✅
- Lint: 0 errors ✅

### vercel.json Status
- 5개 Cron 구성 ✅
- maxDuration: 900 (5개 모두) ✅

### .env.example Status
- SPEC S2 매트릭스 필수 변수 모두 포함 ✅
- FCM_SERVER_KEY 포함 (SPEC 외 변수, 코드에서 사용 여부 미확인)
