---
id: SPEC-INFRA-001
title: 'Project Foundation - Implementation Plan'
spec_ref: SPEC-INFRA-001/spec.md
---

# SPEC-INFRA-001: Implementation Plan

## Task Decomposition

### Milestone 1: Project Scaffold (Priority High)

**Task 1.1: Next.js Project Initialization**

- Initialize Next.js 14+ project with `create-next-app` (TypeScript, App Router, Tailwind, `src/` directory)
- Configure `tsconfig.json` with strict mode and path aliases (`@/*`)
- Configure `next.config.ts` with image domains and experimental features
- Set up `pnpm` as package manager with `.npmrc` configuration

**Task 1.2: Directory Structure Creation**

- Create feature module directories: `src/features/policies/`, `src/features/notifications/`, `src/features/recommendations/`, `src/features/user/`
- Create shared directories: `src/components/ui/`, `src/components/layout/`, `src/components/common/`, `src/components/providers/`
- Create utility directories: `src/lib/`, `src/services/`, `src/hooks/`, `src/types/`, `src/styles/`
- Create infrastructure directories: `prisma/`, `scripts/`, `tests/unit/`, `tests/integration/`, `tests/e2e/`

**Task 1.3: Environment Configuration**

- Create `.env.example` with all required environment variables
- Create `docker-compose.yml` with PostgreSQL 16 and Redis 7 services
- Create `.gitignore` with appropriate exclusions

### Milestone 2: Database Schema & Prisma (Priority High)

**Task 2.1: Prisma Schema Design**

- Install Prisma CLI and `@prisma/client`
- Design `schema.prisma` with all models (User, Account, Session, Policy, PolicyCategory, Region, UserProfile, UserSavedPolicy, NotificationLog)
- Define model relationships, indexes, and constraints
- Configure Prisma datasource for PostgreSQL with connection pooling URL

**Task 2.2: Prisma Client Setup**

- Create `src/lib/db.ts` with Prisma Client singleton pattern (prevent multiple instances in dev)
- Run initial migration: `prisma migrate dev --name init`
- Verify schema with `prisma db push` against local Docker PostgreSQL

### Milestone 3: Authentication (Priority High)

**Task 3.1: NextAuth.js Configuration**

- Install `next-auth@5` (Auth.js) and `@auth/prisma-adapter`
- Create `src/lib/auth.ts` with NextAuth configuration
- Configure Kakao OAuth provider
- Configure Naver OAuth provider
- Configure Google OAuth provider
- Set up Prisma Adapter for database session/account storage
- Configure JWT strategy with appropriate token expiry

**Task 3.2: Auth Route and Provider**

- Create `src/app/api/auth/[...nextauth]/route.ts` Route Handler
- Create `src/components/providers/AuthProvider.tsx` (SessionProvider wrapper)
- Create `src/app/(auth)/layout.tsx` for auth pages
- Create `src/app/(auth)/login/page.tsx` with social login buttons
- Implement `src/app/middleware.ts` for protected route redirection

### Milestone 4: Layout & UI Components (Priority High)

**Task 4.1: Tailwind & shadcn/ui Setup**

- Configure `tailwind.config.ts` with custom theme (Korean-friendly typography, brand colors)
- Install shadcn/ui CLI and initialize with default configuration
- Install base shadcn/ui components: Button, Card, Dialog, Input, Badge, Dropdown, Avatar, Separator, Sheet
- Install `next-themes` for dark mode support
- Install `lucide-react` for icons

**Task 4.2: Layout Components**

- Create `src/app/layout.tsx` (Root Layout with providers, metadata, Korean lang)
- Create `src/components/layout/Header.tsx` (logo, nav links, auth button, mobile hamburger)
- Create `src/components/layout/Footer.tsx` (service info, copyright)
- Create `src/components/layout/Sidebar.tsx` (category navigation, desktop only)
- Create `src/components/layout/Navigation.tsx` (mobile bottom tab navigation)
- Create `src/app/(main)/layout.tsx` (Main Layout composing Header, Sidebar, Footer)
- Create `src/app/(main)/page.tsx` (Home page placeholder)

**Task 4.3: Common Components**

- Create `src/components/common/ErrorBoundary.tsx`
- Create `src/components/common/LoadingSpinner.tsx`
- Create `src/components/common/EmptyState.tsx`
- Create `src/app/not-found.tsx` (404 page)
- Create `src/app/(main)/error.tsx` (error boundary)
- Create `src/app/(main)/policies/loading.tsx` (loading skeleton)

**Task 4.4: Provider Setup**

- Create `src/components/providers/ThemeProvider.tsx` (next-themes)
- Create `src/components/providers/QueryProvider.tsx` (TanStack Query)
- Wire all providers in Root Layout

### Milestone 5: Development Environment (Priority Medium)

**Task 5.1: Code Quality Tools**

- Configure ESLint with `@typescript-eslint`, Next.js rules, import sorting
- Configure Prettier with project conventions (tabWidth: 2, singleQuote: true)
- Install and configure Husky for Git hooks
- Configure lint-staged for pre-commit checks (lint, format, type-check)

**Task 5.2: Testing Infrastructure**

- Install and configure Vitest with `vitest.config.ts`
- Install React Testing Library (`@testing-library/react`, `@testing-library/jest-dom`)
- Install and configure Playwright with `playwright.config.ts`
- Create sample test files to verify setup

**Task 5.3: CI/CD Pipeline**

- Create `.github/workflows/ci.yml` with:
  - Dependency installation (`pnpm install --frozen-lockfile`)
  - Type check (`pnpm tsc --noEmit`)
  - Lint (`pnpm lint`)
  - Unit/integration tests (`pnpm test`)
  - Build verification (`pnpm build`)

### Milestone 6: Utility Setup (Priority Low)

**Task 6.1: Shared Utilities**

- Create `src/lib/utils.ts` with `cn()` (clsx + twMerge), `formatDate()`, `formatCurrency()`
- Create `src/lib/constants.ts` with app-wide constants
- Create `src/types/index.ts` with global type definitions

---

## Technology Specifications

| Technology             | Version         | Purpose                                              |
| ---------------------- | --------------- | ---------------------------------------------------- |
| Next.js                | >=14.2.0        | Full-stack React framework with App Router           |
| React                  | >=18.3.0        | UI library                                           |
| TypeScript             | >=5.5.0         | Type safety                                          |
| Prisma                 | >=5.15.0        | Database ORM and migration tool                      |
| @prisma/client         | >=5.15.0        | Type-safe database client                            |
| next-auth              | >=5.0.0-beta.19 | Authentication (Auth.js v5)                          |
| @auth/prisma-adapter   | >=2.0.0         | NextAuth Prisma integration                          |
| tailwindcss            | >=3.4.0         | Utility-first CSS framework                          |
| @radix-ui/\*           | latest          | Accessible UI primitives (via shadcn/ui)             |
| @tanstack/react-query  | >=5.50.0        | Server state management                              |
| next-themes            | >=0.3.0         | Theme management (dark mode)                         |
| lucide-react           | >=0.400.0       | Icon library                                         |
| zod                    | >=3.23.0        | Runtime schema validation                            |
| date-fns               | >=3.6.0         | Date utilities                                       |
| vitest                 | >=1.6.0         | Unit/integration test runner                         |
| @testing-library/react | >=16.0.0        | React component testing                              |
| @playwright/test       | >=1.45.0        | E2E testing                                          |
| eslint                 | >=8.57.0        | Code linting                                         |
| prettier               | >=3.3.0         | Code formatting                                      |
| husky                  | >=9.0.0         | Git hooks                                            |
| lint-staged            | >=15.2.0        | Pre-commit file filtering                            |
| PostgreSQL             | 16.x            | Database (via Docker for local, Neon for production) |

> Note: Exact latest stable versions should be confirmed at `/moai:2-run` stage using WebFetch.

---

## Dependencies

### External Service Dependencies

- **Neon**: PostgreSQL serverless database (production)
- **Kakao Developers**: OAuth application registration required
- **Naver Developers**: OAuth application registration required
- **Google Cloud Console**: OAuth 2.0 client ID required

### Internal SPEC Dependencies

- None (this is the foundation SPEC; all other SPECs depend on this)

### Downstream Dependents

- SPEC-API-001 (Data Pipeline): Depends on database schema and Prisma client
- SPEC-UI-001 (Search & Filtering): Depends on layout components, database schema
- SPEC-NOTIF-001 (Notifications): Depends on authentication, UserProfile model
- SPEC-AI-001 (AI Recommendations): Depends on all above

---

## Risk Analysis

### Risk 1: NextAuth.js v5 Beta Instability

**Likelihood**: Medium
**Impact**: Medium
**Mitigation**: Pin to a known stable beta version. Monitor Auth.js GitHub for breaking changes. Keep authentication logic isolated in `src/lib/auth.ts` for easy migration.

### Risk 2: Kakao/Naver OAuth Configuration Complexity

**Likelihood**: Medium
**Impact**: Low
**Mitigation**: Document OAuth app registration steps in project README. Create `.env.example` with clear variable names. Test each provider individually during development.

### Risk 3: Prisma Schema Changes in Later SPECs

**Likelihood**: High
**Impact**: Low
**Mitigation**: Design schema with known future needs (JSONB for flexible fields, nullable columns for optional data). Use Prisma migrations for safe schema evolution.

### Risk 4: shadcn/ui Component Customization

**Likelihood**: Low
**Impact**: Low
**Mitigation**: shadcn/ui copies components into the codebase, providing full ownership. Customizations are straightforward and do not depend on upstream releases.

---

## Traceability

| Requirement   | Plan Task                   | Acceptance Criteria |
| ------------- | --------------------------- | ------------------- |
| REQ-INFRA-001 | Milestone 1 (Tasks 1.1-1.3) | AC-001, AC-002      |
| REQ-INFRA-002 | Milestone 2 (Tasks 2.1-2.2) | AC-003              |
| REQ-INFRA-003 | Milestone 3 (Tasks 3.1-3.2) | AC-004, AC-005      |
| REQ-INFRA-004 | Milestone 4 (Tasks 4.1-4.4) | AC-006, AC-007      |
| REQ-INFRA-005 | Milestone 5 (Tasks 5.1-5.3) | AC-008, AC-009      |
| REQ-INFRA-006 | Milestone 4.3               | AC-006              |
| REQ-INFRA-007 | Milestone 4.4               | AC-002              |
