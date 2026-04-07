# Product Overview: 정책다모아 (Policy-Damoa)

## Project Name and Description

**Name**: 정책다모아 (Policy-Damoa)
**Tagline**: All Government Policies, In One Place

Policy-Damoa is a government policy and subsidy aggregation platform that helps Korean citizens discover, track, and receive personalized notifications about government support programs they are eligible for. The platform consolidates fragmented policy information from central government ministries, local governments (시/군/구), and public institutions into a single, easy-to-use interface with AI-powered matching.

---

## Problem Statement

### Information Fragmentation

Korea has thousands of government support programs — welfare benefits, startup grants, housing subsidies, childcare allowances, employment incentives, and more — but this information is scattered across:

- Central government ministry websites (dozens of agencies)
- 17 metropolitan and provincial portals
- 226 municipal (시/군/구) government websites
- Specialized agency portals (건강보험공단, 고용노동부, etc.)

Citizens have no single authoritative source. A young entrepreneur seeking startup grants must manually visit multiple portals. A pregnant woman looking for childcare support must know which ministry handles which program.

### The Cost of Missed Benefits

- Eligible citizens fail to claim benefits simply because they are unaware they exist
- Government programs go underutilized despite budget allocation
- Information asymmetry disproportionately affects lower-income households who need benefits most
- Even existing aggregation portals (보조금24, 복지로) suffer from poor user experience and lack proactive notification

### Key Pain Points

1. **Discovery barrier**: No unified search across all programs
2. **Eligibility complexity**: Each program has different conditions (age, income, region, occupation, family status)
3. **Missed deadlines**: Application windows close without citizens knowing
4. **Language barrier**: Official government language is often dense and inaccessible
5. **No personalization**: Generic listings with no matching to individual circumstances

---

## Target Audience

### Segment 1: Young Adults (20s-30s)

**Persona: 이준혁, 28, Recent Graduate / Entry-level Worker**

- Newly employed or job-seeking in Seoul
- Unaware of youth housing subsidies (청년월세지원), employment incentives, or cultural benefit programs
- Comfortable with mobile apps; expects modern UX similar to Kakao, Naver
- Does not visit government websites unless absolutely necessary
- Would benefit from: monthly housing allowances, youth startup grants, employment training subsidies

**Pain Point**: Missed out on 청년도약계좌 application deadline because he did not know it existed.

---

### Segment 2: Pregnant Women and Parents with Young Children

**Persona: 김미래, 32, Pregnant, First-time Mother**

- 12 weeks pregnant, living in Suwon
- Eligible for national prenatal checkup vouchers, local baby welcome kits, childcare facility registration support, and parental leave allowances
- Overwhelmed by the number of agencies she needs to contact
- Limited time to research; needs consolidated, trusted information

**Pain Point**: Received conflicting information from local ward office and national portal; unsure which benefits to apply for first.

---

### Segment 3: Solo Entrepreneurs and Small Business Owners

**Persona: 박성민, 35, Self-employed Coffee Shop Owner**

- Running a small cafe in Busan for 2 years
- Eligible for small business energy cost support, local commercial district revitalization grants, and employee hiring incentives
- Too busy to research government programs; relies on word-of-mouth
- Needs clear eligibility checks and direct links to application forms

**Pain Point**: Discovered a rent subsidy program only after the application period ended — through a social media post from a fellow merchant.

---

## Core Features

### 1. Policy Search with Condition-Based Filtering

A comprehensive search and filter system covering all aggregated policy data.

- **Search**: Full-text keyword search across policy titles, descriptions, and tags
- **Filters**: Region (province, city, district), age range, occupation type, income bracket, pregnancy/parenting status, household type (single-person, multicultural, disabled)
- **Sorting**: Newest first, deadline proximity, relevance score
- **Policy Cards**: Summary view with eligibility snapshot, benefit amount, application deadline, and source agency

### 2. Push Notifications for Matching Policies

Proactive notification system that alerts users when new policies matching their profile are published.

- **Profile-based matching**: Users define their conditions once; system matches continuously
- **Channels**: Web push notifications, email digest (daily or weekly)
- **Notification triggers**: New policy published, application window opening, deadline reminder (7 days, 1 day before)
- **Granularity**: Users can set notification frequency and minimum benefit threshold

### 3. AI-Powered Personalized Recommendations

An AI recommendation engine that understands user context and surfaces the most relevant programs.

- **Profile ingestion**: Structured profile (age, region, occupation, family status) combined with free-text life situation description
- **Relevance scoring**: Policies ranked by estimated relevance and benefit value for the user
- **Explainability**: Each recommendation includes a brief explanation of why it matched
- **Feedback loop**: Users can mark recommendations as relevant or irrelevant to improve future matching

### 4. Policy Detail Pages

Rich detail pages for each policy, translated from bureaucratic language into plain Korean.

- Eligibility criteria in checklist format
- Benefit amount and type (cash, voucher, service, loan)
- Required documents list
- Step-by-step application guide
- Official source link and agency contact

### 5. User Profiles and Saved Policies

Personalization layer enabling persistent preferences and history.

- Profile setup wizard collecting key eligibility attributes
- Bookmarked policies with application status tracking
- Application history log

---

## Use Cases

### Use Case 1: Discovering Housing Support as a Young Renter

이준혁 opens Policy-Damoa and selects "youth housing" from quick filter tags. He sets his age (28), region (서울 강남구), and employment status (employed). The system returns 7 matching programs including 청년월세지원 from the Ministry of Land, and a Gangnam-gu-specific housing allowance. He bookmarks both and enables deadline reminders.

### Use Case 2: Prenatal Benefit Onboarding

김미래 completes the profile setup wizard, selecting "pregnant" and her gestational week. The AI recommendation panel immediately surfaces 9 programs: national prenatal checkup vouchers (국민행복카드), Suwon city baby welcome kit, and 3 others she had never heard of. She applies for 4 programs in the same session using the provided direct links.

### Use Case 3: Small Business Grant Discovery via Notification

박성민 has push notifications enabled with his profile set to "self-employed, Busan, food service." He receives a push alert: "New: Busan small merchant energy cost subsidy — applications open, deadline in 14 days." He taps the notification, reviews the eligibility checklist (meets all conditions), and accesses the application form directly.

### Use Case 4: AI Chat for Eligibility Clarification

A user is unsure whether they qualify for a disability employment support grant. They use the AI assistant chat to describe their situation. The AI reviews the policy eligibility rules, asks 2 clarifying questions, and provides a clear "likely eligible" assessment with the key conditions they meet. It also suggests 2 alternative programs if the primary one does not apply.

### Use Case 5: Deadline-Based Discovery

A user sorts available policies by "deadline soonest." They find a local art grant they had missed with only 3 days left. They apply immediately after reading the AI-simplified summary.

### Use Case 6: Family Profile for Multi-Benefit Planning

A couple with a 1-year-old child creates a joint profile. The system identifies 12 overlapping and complementary programs (childcare subsidies, child allowance, parenting leave supplements) and groups them into a "new parent" bundle view with a recommended application sequence.

---

## Success Metrics (KPIs)

### Acquisition

- Monthly Active Users (MAU): Target 50,000 by Month 6
- User registration rate: Target 30% of visitors
- Organic search traffic share: Target 40% of total traffic by Month 12

### Engagement

- Average policies viewed per session: Target 5+
- Profile completion rate: Target 70% of registered users
- Notification opt-in rate: Target 60% of registered users
- Return visit rate (30-day): Target 40%

### Impact

- Policy applications initiated via platform: Target 10,000 by Month 6
- Average eligible programs discovered per user: Target 4+
- User-reported benefit received: Track via optional survey

### Retention

- 30-day retention: Target 35%
- 90-day retention: Target 20%

### Quality

- AI recommendation relevance rating (user thumbs up/down): Target 75% positive
- Search zero-results rate: Target below 5%

---

## Competitive Analysis Summary

| Platform         | Programs       | UX Quality | Notifications | AI Features | Personalization |
| ---------------- | -------------- | ---------- | ------------- | ----------- | --------------- |
| **보조금24**     | 16,373+        | Poor       | None          | None        | None            |
| **복지로**       | ~5,000         | Moderate   | Basic         | None        | Limited         |
| **커넥트웍스**   | ~2,000         | Good       | None          | None        | Moderate        |
| **Policy-Damoa** | All aggregated | Excellent  | Yes (push)    | Yes         | Full profile    |

### Differentiation

1. **UX-first**: Consumer-grade design inspired by Kakao and Toss, not government portal aesthetics
2. **Proactive**: Push notifications before deadlines expire; competitors are purely reactive
3. **AI matching**: Personalized recommendations with natural language eligibility explanations
4. **Breadth**: Aggregates central + local + public institution programs (competitors are partial)
5. **Timeliness**: Near-real-time data collection via API + crawling; less stale than static government portals

---

## Revenue Model Candidates

### Phase 1: Free Platform (Growth)

No monetization in MVP phase. Focus on user acquisition and data quality.

### Phase 2: Premium Subscription

Monthly subscription (~3,000-5,000 KRW) for:

- Priority AI recommendations with detailed matching report
- Unlimited saved searches and alert profiles
- Application document checklist generation
- Calendar integration for deadlines

### Phase 3: B2B / Institutional Licensing

- White-label policy aggregation API for banks, insurance companies, HR platforms
- Data analytics reports for local governments on benefit utilization gaps
- Policy notification integration for corporate HR (employee benefits discovery)

### Phase 4: Partnership Revenue

- Certified financial advisors and social welfare consultants can purchase featured placement
- Government agency partnerships for direct application submission integration
- Affiliate revenue from financial products complementary to government benefits (e.g., youth savings accounts)

---

Last Updated: 2026-04-07
Version: 1.1.0 (모든 핵심 기능 구현 완료: SPEC-INFRA-001, SPEC-API-001, SPEC-UI-001, SPEC-NOTIF-001, SPEC-AI-001)
