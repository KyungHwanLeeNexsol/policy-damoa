# Design Direction: SPEC-UI-001 — Policy Search & Filtering

**Date**: 2026-04-06
**Author**: expert-frontend (MoAI) via Intent-First process
**SPEC**: SPEC-UI-001

---

## Intent-First: The Three Questions

**Who is this human?**
A young Korean adult in their 20s or 30s — or a new parent, or a small business owner — who suspects government policies exist that could genuinely help them, but feels defeated before they even start. They've landed on a government portal before and left empty-handed, not because the policy didn't exist, but because the interface buried it in administrative language and nested menus. They are not policy experts. They are people trying to live their lives and catch a break where one exists.

**What must they accomplish?**
Find the one or two policies that actually apply to them — right now, today — with enough confidence to take the next step (clicking "신청하기"). The search is not academic. Every result has practical stakes: housing support, childcare subsidy, startup loan. The system must make them feel *seen*, not processed.

**What should this feel like?**
A knowledgeable, trustworthy friend who knows the government system inside and out, but speaks to you like a human — not like a civil servant filling out a form. The experience should feel competent and warm. When the system shows you 14 matching policies, you should feel relief, not overwhelm. When it shows zero, you should feel guided, not rejected.

---

## Domain Concepts (7)

| Term | Definition |
|------|-----------|
| 정책 (Policy) | A government-funded benefit, subsidy, service, or loan program with defined eligibility and a deadline. Not a "record" or an "item" — it's an opportunity with an expiry date. |
| 수급 자격 (Eligibility) | The intersection of a person's life circumstances and a policy's conditions. Not a filter checkbox — it's a question: "Is this for me?" |
| D-Day | The days remaining until the application deadline closes. A D-7 badge carries emotional weight — it creates urgency without pressure. This is native language for Korean deadline culture. |
| 혜택 유형 (Benefit Type) | The form of support: 현금(cash), 바우처(voucher), 서비스(service), 대출(loan). Users think in terms of "what will I actually receive," not abstract category IDs. |
| 지역 (Region) | The administrative geography (시도 → 시군구) that scopes which policies apply. For MVP, 시도-level is sufficient. Region is not a dropdown — it's "where I live." |
| 나에게 맞는 (Personalized Match) | The state of a policy that has been pre-filtered to the user's profile — age, family status, occupation. The system should communicate "this was picked for you," not "these are the results." |
| 자격 체크리스트 (Eligibility Checklist) | The signature element on the policy detail page: eligibility conditions shown as visual checkmarks. Transforms passive search into active matching. |

---

## Color World (7)

1. **Civic warmth** — Government blue, but softened. Not the cold institutional blue of official portals, but a blue that suggests sky, openness, and possibility.
2. **Confident clarity** — Clean whitespace. The kind of clarity that says "we've done the work of finding this so you don't have to."
3. **Generous** — Rounded corners, comfortable padding. Nothing cramped. The interface gives space to breathe.
4. **Attentive** — Subtle urgency signals: D-day badges in amber/orange for near-deadlines, muted for distant ones. Like a calendar notification from a caring friend, not a warning siren.
5. **Credible without being cold** — Typographic hierarchy that communicates trust. The data is serious; the experience doesn't need to be.
6. **Korean daily life** — Visual vocabulary familiar to Koreans: category system echoing Kakao and Naver, not foreign SaaS tools.
7. **Focused** — No decoration for decoration's sake. Every visual element earns its place by helping the user understand a policy better or move faster.

---

## Signature Element: The Eligibility Checklist

The policy detail page's **자격 체크리스트** is a visual checklist showing which eligibility conditions a user meets and which they don't (when logged in with a profile).

Rather than burying eligibility in bureaucratic prose, the system renders it as a series of clear status indicators:
- ✅ 녹색 체크 → 충족 (Confirmed match)
- 🟡 노란 물음표 → 미확인 (Profile data missing — cannot confirm)
- ❌ 빨간 X → 미충족 (Confirmed non-match)

For non-logged-in users: renders the checklist items blurred with a CTA: "로그인하면 나에게 맞는지 확인할 수 있어요."

This element shifts the burden from the user ("Do I qualify?") to the system ("Here's what we know about you"). It is the platform's core value proposition made visible.

---

## Defaults to Avoid (5)

1. **Avoid the government-portal aesthetic**: Multi-level nested dropdowns, gray tables, 12-column dense forms. The design should look like a modern consumer app, not a civil servant's intranet.
2. **Avoid infinite scroll**: Pagination is intentional. 20 results per page with a clear "N개 결과" count sets expectations. Infinite scroll destroys the user's mental map of how many results exist.
3. **Avoid "reset all" as the only recovery path**: When filters produce zero results, proactively suggest related searches or filter relaxations — not just a "모두 지우기" button.
4. **Avoid decorative empty states**: When there are no matching policies, the empty state should guide: "현재 조건에 맞는 정책이 없지만, 지역 조건을 넓히면 N개 더 볼 수 있어요."
5. **Avoid filter panels that open and disappear**: On desktop, filters should be persistent in the content area — always visible, always reflecting current state. The filter panel is a control panel to operate, not a modal to close.

---

## References

- Design system: `.moai/design/system.md`
- SPEC: `.moai/specs/SPEC-UI-001/spec.md`
- Research: `.moai/specs/SPEC-UI-001/research.md`
