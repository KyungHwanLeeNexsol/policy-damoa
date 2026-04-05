---
id: SPEC-INFRA-001
title: "Project Foundation - Compact Reference"
spec_ref: SPEC-INFRA-001/spec.md
---

# SPEC-INFRA-001: Compact Reference

## Requirements

### REQ-INFRA-001: Next.js Project Initialization (Ubiquitous)
- Next.js 14+ App Router, TypeScript strict mode
- `src/` directory structure, pnpm, path aliases (`@/`)

### REQ-INFRA-002: Database Schema & Prisma (Ubiquitous)
- Models: User, Account, Session, Policy, PolicyCategory, PolicyCategoryRelation, Region, UserProfile, UserSavedPolicy, NotificationLog
- JSONB for eligibilityCriteria and additionalConditions
- Indexes on Policy(title, region, applicationDeadline), unique on Policy(externalId), unique on UserSavedPolicy(userId, policyId)

### REQ-INFRA-003: NextAuth.js Authentication (Event-Driven)
- WHEN login clicked THEN OAuth via Kakao/Naver/Google
- WHEN unauthenticated access to protected route THEN redirect to login
- WHEN logout THEN invalidate session, redirect to home

### REQ-INFRA-004: Base Layout (Ubiquitous)
- Root Layout: providers, metadata, `lang="ko"`
- Main Layout: Header, Sidebar, Footer
- Auth Layout: no navigation chrome
- Header, Footer, Sidebar, mobile Navigation components
- shadcn/ui base components, Tailwind theme, dark mode, responsive

### REQ-INFRA-005: Development Environment (Ubiquitous)
- ESLint + Prettier + Husky + lint-staged
- Vitest + React Testing Library + Playwright
- Docker Compose (PostgreSQL 16, Redis 7)
- GitHub Actions CI

### REQ-INFRA-006: Error Handling (Unwanted)
- Raw errors shall NOT be exposed to users
- 404 page, error boundary, loading states

### REQ-INFRA-007: TanStack Query Setup (Optional)
- QueryClientProvider with staleTime 5min, DevTools in dev

---

## Acceptance Criteria Summary

| ID | Description |
|---|---|
| AC-001 | `pnpm build` succeeds, `pnpm start` serves on port 3000 |
| AC-002 | `pnpm dev` runs with HMR and path alias resolution |
| AC-003 | `prisma migrate dev` creates all tables, indexes, constraints |
| AC-004 | OAuth login works (Kakao/Naver/Google), creates User + Account + Session |
| AC-005 | Logout invalidates session; protected routes redirect to login |
| AC-006 | Layout renders: desktop (Header+Sidebar+Footer), mobile (Header+BottomNav) |
| AC-007 | Semantic HTML elements, ARIA labels, keyboard accessibility |
| AC-008 | ESLint, Prettier, Husky pre-commit hook all functional |
| AC-009 | Vitest and Playwright run sample tests successfully |
| AC-010 | Docker Compose starts PostgreSQL and Redis |

---

## Files to Create/Modify

```
src/app/layout.tsx, not-found.tsx, globals.css
src/app/(auth)/layout.tsx, login/page.tsx
src/app/(main)/layout.tsx, page.tsx, error.tsx, policies/loading.tsx
src/app/api/auth/[...nextauth]/route.ts
src/components/layout/{Header,Footer,Sidebar,Navigation}.tsx
src/components/common/{ErrorBoundary,LoadingSpinner,EmptyState}.tsx
src/components/providers/{AuthProvider,QueryProvider,ThemeProvider}.tsx
src/components/ui/{button,card,dialog,input,badge,...}.tsx
src/lib/{db,auth,utils,constants}.ts
src/types/index.ts
prisma/schema.prisma
docker-compose.yml, .env.example
.eslintrc.json, .prettierrc, vitest.config.ts, playwright.config.ts
next.config.ts, tailwind.config.ts, tsconfig.json
.github/workflows/ci.yml
```

---

## Exclusions

- Data pipeline (SPEC-API-001)
- Search & filtering UI (SPEC-UI-001)
- Notification system (SPEC-NOTIF-001)
- AI recommendations (SPEC-AI-001)
- Redis caching layer (SPEC-API-001)
- Policy data seeding (SPEC-API-001)
- Profile setup wizard UI (SPEC-NOTIF-001)
