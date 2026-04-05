---
project: Policy-Damoa
version: "1.0.0"
created: "2026-04-05"
author: zuge3
---

# Policy-Damoa MVP SPEC Roadmap

## Overview

정책다모아 MVP를 5개의 순차적 SPEC으로 분해한 로드맵이다. 각 SPEC은 독립적으로 구현 및 테스트 가능하며, 의존성 순서에 따라 구현한다.

---

## SPEC Dependency Graph

```
SPEC-INFRA-001 (Foundation)
    │
    ├──► SPEC-API-001 (Data Pipeline)
    │        │
    │        ├──► SPEC-UI-001 (Search & Filtering)
    │        │        │
    │        │        └──► SPEC-AI-001 (AI Recommendations)
    │        │
    │        └──► SPEC-NOTIF-001 (Notifications)
    │
    └──► (all SPECs depend on INFRA-001)
```

---

## SPEC-INFRA-001: Project Foundation

**Priority**: P0 (Must Complete First)
**Complexity**: Medium
**Status**: Draft

Next.js 14+ App Router 프로젝트 스캐폴딩, PostgreSQL 데이터베이스 스키마(Prisma), NextAuth.js 소셜 로그인(카카오/네이버/구글), shadcn/ui 기반 레이아웃, 개발 환경 설정(ESLint, Prettier, Vitest, Docker Compose, CI/CD).

**Key Deliverables**:
- Working Next.js app with TypeScript strict mode
- Complete Prisma schema with all core models
- Social authentication (Kakao, Naver, Google)
- Responsive layout (Header, Footer, Sidebar, mobile nav)
- Development toolchain (lint, format, test, CI)

**Dependencies**: None

---

## SPEC-API-001: Data Pipeline

**Priority**: P0
**Complexity**: High
**Status**: Planned

공공데이터포털 API 및 보조금24 API 연동, 데이터 정규화/중복 제거 파이프라인, Vercel Cron 기반 주기적 데이터 갱신, Upstash Redis 캐싱 레이어, 개발용 정책 데이터 시딩 스크립트.

**Key Deliverables**:
- Public Data Portal API client (`data.go.kr`)
- Bojo24 API client (보조금24)
- Data normalization and deduplication pipeline
- Cron-based data refresh (Vercel Cron Jobs)
- Redis caching layer (Upstash) for policy queries
- Seed scripts for development data

**Dependencies**: SPEC-INFRA-001 (database schema, Prisma client)

---

## SPEC-UI-001: Search & Filtering

**Priority**: P1
**Complexity**: High
**Status**: Planned

정책 목록 페이지(서버사이드 필터링), 다중 조건 필터 UI(지역 트리 선택기, 연령 범위, 직업 카테고리, 가족 상태 토글), 정책 상세 페이지, 전문 검색(PostgreSQL tsvector), 반응형 모바일 레이아웃.

**Key Deliverables**:
- Policy list page with server-side pagination and filtering
- Multi-condition filter panel (region tree, age, occupation, family status)
- Policy detail page with eligibility checklist and application guide
- Full-text search with Korean text support
- Mobile-optimized responsive filter/search UI

**Dependencies**: SPEC-INFRA-001 (layout, components), SPEC-API-001 (policy data in database)

---

## SPEC-NOTIF-001: User Profile & Notifications

**Priority**: P1
**Complexity**: Medium-High
**Status**: Planned

사용자 프로필 설정 플로우(조건 설문), 알림 기본 설정 관리, 백그라운드 매칭 엔진(새 정책 vs 사용자 조건), Web Push + 이메일 알림 전달, 알림 히스토리 페이지.

**Key Deliverables**:
- Profile setup wizard (conditions questionnaire)
- Notification preferences management UI
- Background matching engine (new policies vs user conditions)
- Web Push notification delivery (via web-push library)
- Email notification delivery (via Resend)
- Notification history page

**Dependencies**: SPEC-INFRA-001 (auth, UserProfile model), SPEC-API-001 (policy data for matching)

---

## SPEC-AI-001: AI Recommendations

**Priority**: P2
**Complexity**: Medium
**Status**: Planned

사용자 행동 추적(조회, 저장, 검색), OpenAI API 기반 AI 추천 엔진, 홈페이지 개인화 정책 피드, 정책 상세 페이지 "유사 정책" 추천.

**Key Deliverables**:
- User behavior tracking (views, saves, searches)
- AI recommendation engine using OpenAI API (GPT-4o-mini)
- Personalized policy feed on homepage
- "Similar policies" section on detail pages
- Recommendation explanation display
- Feedback mechanism (thumbs up/down)

**Dependencies**: SPEC-INFRA-001 (auth, database), SPEC-API-001 (policy data), SPEC-UI-001 (detail pages), SPEC-NOTIF-001 (user profile data)

---

## Implementation Sequence

```
Phase 1: SPEC-INFRA-001  ──► Foundation ready
Phase 2: SPEC-API-001    ──► Data pipeline operational, policies in DB
Phase 3: SPEC-UI-001     ──► Users can search and browse policies
         SPEC-NOTIF-001  ──► Users get notified (can run parallel with UI-001)
Phase 4: SPEC-AI-001     ──► AI recommendations enhance the experience
```

---

## Complexity Summary

| SPEC | Complexity | Est. Files | Key Risk |
|---|---|---|---|
| SPEC-INFRA-001 | Medium | ~40 | NextAuth v5 beta stability |
| SPEC-API-001 | High | ~25 | External API rate limits, data quality |
| SPEC-UI-001 | High | ~30 | Complex filter UX, Korean full-text search |
| SPEC-NOTIF-001 | Medium-High | ~20 | Push notification browser compatibility |
| SPEC-AI-001 | Medium | ~15 | AI response quality, cost management |

---

## Expert Consultation Recommendations

| SPEC | Recommended Experts |
|---|---|
| SPEC-INFRA-001 | expert-backend (DB schema), expert-frontend (layout) |
| SPEC-API-001 | expert-backend (API integration, caching) |
| SPEC-UI-001 | expert-frontend (filter UX, responsive), design-uiux (accessibility) |
| SPEC-NOTIF-001 | expert-backend (matching engine), expert-frontend (notification UI) |
| SPEC-AI-001 | expert-backend (OpenAI integration), expert-frontend (recommendation UI) |
