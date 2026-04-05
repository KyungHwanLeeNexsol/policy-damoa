# Codebase Overview: 정책다모아 (Policy-Damoa)

## Status

This project is in the **pre-implementation phase**. No source code exists yet. This file will be updated as the codebase is built out.

---

## Project Goals

Policy-Damoa aims to solve the government policy information fragmentation problem in Korea by providing:

1. **Unified Policy Discovery**: Aggregate all government support programs from central agencies, local governments, and public institutions into a single searchable index

2. **Intelligent Matching**: Use AI-powered recommendations to surface the most relevant policies for each user based on their personal circumstances (age, region, occupation, family status, income)

3. **Proactive Notification**: Alert users before application deadlines expire for programs they are eligible for, removing the burden of periodic manual checking

4. **Accessibility**: Transform dense government bureaucratic language into plain, actionable summaries that any citizen can understand

---

## Planned Architecture Summary

- **Framework**: Next.js 14+ App Router with TypeScript
- **Database**: PostgreSQL (Neon serverless) via Prisma ORM
- **Cache**: Upstash Redis for policy listings and session data
- **Authentication**: NextAuth.js with Kakao and Google OAuth
- **AI**: OpenAI API for recommendations and eligibility analysis
- **Deployment**: Vercel with Cron Jobs for data collection

For detailed structure, see: `../.moai/project/structure.md`
For technology decisions, see: `../.moai/project/tech.md`
For product context, see: `../.moai/project/product.md`

---

## Domain Modules (Planned)

### policies

Central domain. Owns the `Policy` model and all search, filtering, and detail retrieval logic. This module will be the most complex and data-intensive part of the system.

**Key responsibilities**:

- Policy data normalization from multiple sources
- Full-text search indexing
- Filter query composition (multi-criteria eligibility matching)
- Policy detail rendering with plain-language summaries

### notifications

Handles user alert preferences and notification delivery.

**Key responsibilities**:

- Notification preference storage and management
- Policy-to-user matching engine (runs after each data sync)
- Web push notification delivery
- Email digest generation and dispatch

### recommendations

AI-powered personalization layer.

**Key responsibilities**:

- User profile analysis
- OpenAI API integration for relevance scoring
- Recommendation caching and freshness management
- Feedback collection for recommendation quality improvement

### user

User identity and profile management.

**Key responsibilities**:

- Authentication session management (NextAuth.js)
- Profile attribute storage (eligibility attributes: age, region, occupation, etc.)
- Saved policy bookmarks
- Application status tracking

### data-collection (scripts layer)

Background data pipeline, not part of the main Next.js app.

**Key responsibilities**:

- API clients for data.go.kr and 보조금24
- Crawlers for local government websites
- Data normalization and deduplication
- Scheduled sync via Vercel Cron Jobs

---

## Entry Points (Planned)

| Entry Point                               | Description                       |
| ----------------------------------------- | --------------------------------- |
| `src/app/page.tsx`                        | Landing page / policy search home |
| `src/app/api/policies/route.ts`           | Policy search and listing API     |
| `src/app/api/recommendations/route.ts`    | AI recommendation API             |
| `src/app/api/notifications/route.ts`      | Notification management API       |
| `src/app/api/auth/[...nextauth]/route.ts` | Authentication handler            |
| `scripts/sync/syncPublicDataPortal.ts`    | Data collection entry (cron)      |

---

## External Integrations (Planned)

| Service         | Purpose                    | Integration Point                                          |
| --------------- | -------------------------- | ---------------------------------------------------------- |
| data.go.kr      | Primary policy data source | `src/services/data-collection/publicDataPortal.service.ts` |
| 보조금24        | Subsidy program data       | `src/services/data-collection/bojo24.service.ts`           |
| OpenAI API      | AI recommendations         | `src/services/ai/recommendation.service.ts`                |
| Neon PostgreSQL | Primary database           | `src/lib/db.ts`                                            |
| Upstash Redis   | Caching and rate limiting  | `src/lib/redis.ts`                                         |
| Kakao OAuth     | Primary social login       | `src/lib/auth.ts`                                          |
| Resend          | Transactional email        | `src/services/notification/email.service.ts`               |
| Vercel          | Deployment and cron        | `vercel.json`                                              |

---

## Update Schedule

This overview will be updated at the completion of each major development phase:

- Phase 1 (Data Pipeline): After data collection scripts are implemented
- Phase 2 (Core API): After policy search API is operational
- Phase 3 (UI): After main search and detail pages are built
- Phase 4 (AI Features): After recommendation engine is integrated
- Phase 5 (Notifications): After push notification system is live

---

Last Updated: 2026-04-05
Version: 0.1.0 (Pre-implementation)
