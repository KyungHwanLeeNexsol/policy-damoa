---
id: SPEC-INFRA-001
title: 'Project Foundation - Acceptance Criteria'
spec_ref: SPEC-INFRA-001/spec.md
---

# SPEC-INFRA-001: Acceptance Criteria

## AC-001: Project Builds and Starts Successfully

**Given** the project dependencies are installed with `pnpm install`
**When** the developer runs `pnpm build`
**Then** the Next.js production build completes without errors
**And** TypeScript compilation succeeds with zero type errors
**And** the build output includes App Router pages and API routes

**Given** the production build is complete
**When** the developer runs `pnpm start`
**Then** the Next.js server starts on port 3000
**And** the home page (`/`) returns HTTP 200
**And** no runtime errors appear in the server console

---

## AC-002: Development Server Runs with Hot Reload

**Given** the developer has run `pnpm install`
**When** the developer runs `pnpm dev`
**Then** the Next.js development server starts on port 3000
**And** hot module replacement (HMR) is active
**And** TanStack Query DevTools are visible in the browser (development mode only)
**And** TypeScript path aliases (`@/`) resolve correctly

---

## AC-003: Database Migrations Run Without Errors

**Given** a PostgreSQL database is running (via Docker Compose or Neon)
**And** the `DATABASE_URL` environment variable is configured correctly
**When** the developer runs `pnpm prisma migrate dev`
**Then** the initial migration applies successfully
**And** all tables are created: User, Account, Session, Policy, PolicyCategory, PolicyCategoryRelation, Region, UserProfile, UserSavedPolicy, NotificationLog
**And** all indexes and constraints are applied correctly

**Given** the migration has been applied
**When** the developer runs `pnpm prisma studio`
**Then** Prisma Studio opens and displays all models with correct relationships
**And** the developer can browse empty tables without errors

**Given** the schema is deployed
**When** the developer inspects the database
**Then** the Policy table has a JSONB column for eligibilityCriteria
**And** the Region table has a self-referencing parentId for hierarchy
**And** the UserSavedPolicy table has a unique compound index on (userId, policyId)
**And** the Policy table has a unique index on externalId

---

## AC-004: Authentication Flow Works (Login)

**Given** the NextAuth.js configuration is complete
**And** OAuth credentials are configured for at least one provider (Kakao, Naver, or Google)
**When** a user navigates to `/login`
**Then** the login page displays social login buttons for Kakao, Naver, and Google
**And** each button is styled appropriately with provider brand colors/icons

**Given** a user clicks the Kakao login button
**When** the OAuth flow completes successfully
**Then** the user is redirected to the home page (`/`)
**And** a new User record is created in the database
**And** an Account record is created linking the OAuth provider
**And** a Session is established and the user sees their profile image/name in the Header

**Given** a user clicks the Naver login button
**When** the OAuth flow completes successfully
**Then** the same user creation and session establishment occurs as with Kakao

**Given** a user clicks the Google login button
**When** the OAuth flow completes successfully
**Then** the same user creation and session establishment occurs as with Kakao

---

## AC-005: Authentication Flow Works (Logout and Protection)

**Given** a user is logged in with an active session
**When** the user clicks the logout button in the Header
**Then** the session is invalidated
**And** the user is redirected to the home page
**And** the Header shows login button instead of profile

**Given** an unauthenticated user
**When** they attempt to navigate to `/profile`
**Then** they are redirected to `/login`
**And** after successful login, they are redirected back to `/profile`

**Given** an authenticated user
**When** they navigate to `/profile`
**Then** the page loads successfully without redirection

---

## AC-006: Base Layout Renders Correctly

**Given** the application is running
**When** a user visits the home page on a desktop browser (width >= 1024px)
**Then** the Header is visible at the top with logo, navigation links, and auth button
**And** the Sidebar is visible on the left with category navigation
**And** the Footer is visible at the bottom with service information
**And** the main content area occupies the remaining space

**Given** the application is running
**When** a user visits the home page on a mobile browser (width < 768px)
**Then** the Header shows a hamburger menu button instead of full navigation
**And** the Sidebar is hidden
**And** the bottom tab Navigation is visible with key page icons
**And** the Footer is visible below the content
**And** all content is readable without horizontal scrolling

**Given** the application is running
**When** the user toggles dark mode via the theme switcher
**Then** the entire layout switches to dark mode colors
**And** all shadcn/ui components respect the theme change
**And** the theme preference persists across page reloads

**Given** the user navigates to a non-existent page
**When** the 404 page renders
**Then** a user-friendly "Page Not Found" message is displayed
**And** a link to return to the home page is provided

---

## AC-007: Layout Accessibility

**Given** the application layout is rendered
**When** a screen reader user navigates the page
**Then** the Header uses a `<header>` semantic element with `role="banner"`
**And** the main content uses a `<main>` semantic element
**And** the Footer uses a `<footer>` semantic element
**And** navigation links have descriptive `aria-label` attributes
**And** the mobile hamburger menu is keyboard-accessible (Enter/Space to toggle)

---

## AC-008: Development Tools Work Correctly (Lint and Format)

**Given** the project is set up with ESLint and Prettier
**When** the developer runs `pnpm lint`
**Then** ESLint checks all `.ts` and `.tsx` files without errors
**And** TypeScript-specific rules are enforced
**And** import ordering rules are applied

**Given** the project is set up with Prettier
**When** the developer runs `pnpm format:check`
**Then** Prettier reports that all files conform to the configured style
**And** running `pnpm format` fixes any formatting inconsistencies

**Given** the developer stages a TypeScript file with lint errors
**When** they attempt to commit
**Then** Husky pre-commit hook triggers lint-staged
**And** the commit is blocked with ESLint error output
**And** the developer must fix errors before committing

---

## AC-009: Testing Infrastructure Works

**Given** Vitest is configured
**When** the developer runs `pnpm test`
**Then** Vitest discovers and runs all `.test.ts` and `.test.tsx` files
**And** React Testing Library renders components correctly in the test environment
**And** at least one sample test passes confirming the setup

**Given** Playwright is configured
**When** the developer runs `pnpm test:e2e`
**Then** Playwright launches a browser and runs `.spec.ts` files
**And** at least one sample E2E test passes confirming the setup

**Given** the CI pipeline configuration exists
**When** a pull request is opened on GitHub
**Then** the CI workflow runs: install, type-check, lint, test, and build steps
**And** the PR status check reflects the CI result (pass or fail)

---

## AC-010: Docker Compose Local Environment

**Given** Docker Desktop is installed
**When** the developer runs `docker compose up -d`
**Then** a PostgreSQL 16 container starts on port 5432
**And** a Redis 7 container starts on port 6379
**And** both services are accessible from the host machine
**And** the `DATABASE_URL` in `.env.example` matches the Docker PostgreSQL configuration

---

## Quality Gates

- Zero TypeScript compilation errors (`tsc --noEmit`)
- Zero ESLint errors on all source files
- All Prisma migrations apply cleanly
- Authentication flow works for at least one OAuth provider
- Layout renders correctly on mobile (375px) and desktop (1440px) viewports
- All sample tests pass (Vitest + Playwright)
- Docker Compose services start successfully

---

## Definition of Done

- [ ] All 7 requirements (REQ-INFRA-001 through REQ-INFRA-007) implemented
- [ ] All 10 acceptance criteria (AC-001 through AC-010) pass verification
- [ ] Zero TypeScript errors, zero ESLint errors
- [ ] Prisma schema deployed and all models accessible
- [ ] At least one OAuth provider functional (Kakao preferred)
- [ ] Layout responsive on mobile and desktop
- [ ] CI pipeline configured and passing
- [ ] `.env.example` documented with all required variables
- [ ] Docker Compose verified for local development
