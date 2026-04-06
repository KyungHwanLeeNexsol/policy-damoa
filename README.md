# Policy Damoa (정책 다모아)

A Korean government policy aggregation platform that uses AI to deliver personalized policy recommendations to citizens.

Built with Next.js 16.2.2, TypeScript 5.9, Prisma 7.x, and Google Gemini AI.

## Features

### Data Collection and Caching
- Automated policy data collection from [data.go.kr](https://data.go.kr) and 보조금24 via Vercel Cron Jobs
- Redis caching layer (Upstash) for high-performance policy search results
- Vercel Cron Jobs for scheduled data synchronization (every 6 hours)
- Deduplication and normalization pipeline with `externalId`-based upsert

### AI-Powered Personalization
- AI-powered personalized policy recommendations (Gemini AI, gemini-2.0-flash)
- Behavior tracking (policy views, searches, saves) for recommendation improvement
- Similar policies discovery on policy detail pages
- Thumbs up/down feedback mechanism for recommendation quality
- Nightly recommendation pre-computation via Vercel Cron Jobs
- User profile matching (age, region, income, employment status)

### User Experience
- Policy list, detail, and search pages
- User authentication via Kakao, Naver, and Google OAuth
- Push and email notifications for matched policies
- User profile management

## Getting Started

First, install dependencies:

```bash
pnpm install
```

Set up the database:

```bash
cp .env.example .env.local
# Fill in your environment variables
pnpm prisma db push
```

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the required values.

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string (Neon recommended) | Yes |
| `NEXTAUTH_SECRET` | NextAuth.js secret key | Yes |
| `NEXTAUTH_URL` | Application base URL | Yes |
| `AUTH_KAKAO_ID` | Kakao OAuth client ID | Yes |
| `AUTH_KAKAO_SECRET` | Kakao OAuth client secret | Yes |
| `AUTH_NAVER_ID` | Naver OAuth client ID | Yes |
| `AUTH_NAVER_SECRET` | Naver OAuth client secret | Yes |
| `AUTH_GOOGLE_ID` | Google OAuth client ID | Yes |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret | Yes |
| `GEMINI_API_KEY` | Google Gemini API key (for AI recommendations) | Yes |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | Yes |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token | Yes |
| `FCM_SERVER_KEY` | Firebase Cloud Messaging server key | Optional |
| `RESEND_API_KEY` | Resend email service API key | Optional |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web Push VAPID public key | Optional |
| `VAPID_PRIVATE_KEY` | Web Push VAPID private key | Optional |
| `PUBLIC_DATA_PORTAL_API_KEY` | data.go.kr API key | Yes |
| `BOJO24_API_KEY` | 보조금24 API key | Yes |
| `CRON_SECRET` | Cron job authorization secret | Yes |

## Tech Stack

- **Framework**: Next.js 16.2.2 (App Router), React 19
- **Language**: TypeScript 5.9
- **Database**: PostgreSQL (Neon) + Prisma 7.x
- **Cache**: Upstash Redis (serverless)
- **AI**: Google Gemini API (gemini-2.0-flash via OpenAI-compatible endpoint)
- **State Management**: TanStack Query v5
- **UI**: shadcn/ui + Tailwind CSS v4
- **Auth**: NextAuth v5
- **Testing**: Vitest 4.x

## Project Structure

```
src/
├── app/              # Next.js App Router pages and API routes
├── features/         # Feature-based modules (recommendations, policies, etc.)
├── services/         # Business logic and external integrations
│   └── ai/           # AI recommendation engine
├── lib/              # Shared utilities (Redis, OpenAI client, etc.)
└── components/       # Shared UI components
```

## Deploy on Vercel

The easiest way to deploy this app is to use the [Vercel Platform](https://vercel.com/new).

After deploying, configure Vercel Cron Jobs in `vercel.json` for:
- Policy data sync (every 6 hours)
- Nightly recommendation pre-computation (daily)
