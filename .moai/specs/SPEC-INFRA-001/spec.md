---
id: SPEC-INFRA-001
title: 'Project Foundation'
version: '1.0.0'
status: draft
created: '2026-04-05'
updated: '2026-04-05'
author: zuge3
priority: P0
issue_number: 0
lifecycle: spec-first
dependencies: []
---

# SPEC-INFRA-001: 프로젝트 기반 인프라 구축

## HISTORY

| 버전  | 날짜       | 작성자 | 변경 내용      |
| ----- | ---------- | ------ | -------------- |
| 1.0.0 | 2026-04-05 | zuge3  | 초기 SPEC 작성 |

---

## 개요

정책다모아(Policy-Damoa) 프로젝트의 기반 인프라를 구축한다. Next.js 14+ App Router 기반 프로젝트 스캐폴딩, PostgreSQL 데이터베이스 스키마 설계 및 Prisma ORM 연동, NextAuth.js 소셜 로그인(카카오/네이버/구글), shadcn/ui 기반 레이아웃 컴포넌트, 개발 환경 설정(ESLint, Prettier, Vitest, Docker Compose)을 포함한다.

이 SPEC은 전체 MVP의 첫 번째 단계로, 이후 모든 기능 SPEC(데이터 파이프라인, 검색/필터링, 알림, AI 추천)이 의존하는 공통 기반을 확립한다.

---

## 요구사항

### REQ-INFRA-001: Next.js 프로젝트 초기화 (Ubiquitous)

시스템은 **항상** Next.js 14+ App Router 기반 TypeScript strict mode 프로젝트로 구성되어야 한다.

- TypeScript `strict: true` 모드 활성화
- App Router 디렉토리 구조 (`src/app/`) 적용
- `src/` 디렉토리 기반 프로젝트 구조 (features, components, lib, services, hooks, types, styles)
- pnpm 패키지 매니저 사용
- `next.config.ts` 기본 설정 (이미지 도메인, 실험적 기능 등)
- `tsconfig.json`에 path alias 설정 (`@/` prefix)

### REQ-INFRA-002: 데이터베이스 스키마 및 Prisma 설정 (Ubiquitous)

시스템은 **항상** PostgreSQL 데이터베이스와 Prisma ORM을 통해 타입 안전한 데이터 액세스를 제공해야 한다.

**핵심 모델:**

- **User**: id, email, name, image, emailVerified, createdAt, updatedAt
- **Account**: NextAuth.js OAuth 계정 연결 (provider, providerAccountId, access_token, refresh_token 등)
- **Session**: NextAuth.js 세션 관리 (sessionToken, expires)
- **Policy**: id, externalId, title, description, summary, eligibilityCriteria (JSONB), benefitType, benefitAmount, applicationDeadline, sourceUrl, sourceAgency, region, status, createdAt, updatedAt
- **PolicyCategory**: id, name, slug, description, parentId (self-referencing for hierarchy)
- **PolicyCategoryRelation**: policyId, categoryId (다대다 관계)
- **Region**: id, name, code, level (시/도, 시/군/구 계층), parentId
- **UserProfile**: id, userId, birthYear, gender, region, occupation, isPregnant, hasChildren, childrenCount, youngestChildAge, householdType, incomeLevel, additionalConditions (JSONB)
- **UserSavedPolicy**: id, userId, policyId, applicationStatus, savedAt, note
- **NotificationLog**: id, userId, policyId, channel, sentAt, readAt

**관계:**

- User 1:1 UserProfile
- User 1:N UserSavedPolicy
- User 1:N NotificationLog
- Policy N:M PolicyCategory (PolicyCategoryRelation을 통해)
- Policy 1:N UserSavedPolicy
- Policy 1:N NotificationLog
- Region self-referencing (parent-child 계층)

**인덱스:**

- Policy: title, region, applicationDeadline에 인덱스
- Policy: externalId에 unique 인덱스
- UserProfile: userId에 unique 인덱스
- UserSavedPolicy: (userId, policyId)에 unique 복합 인덱스

### REQ-INFRA-003: NextAuth.js 인증 (Event-Driven)

**WHEN** 사용자가 로그인 버튼을 클릭하면 **THEN** 카카오, 네이버, 구글 OAuth 프로바이더를 통한 소셜 로그인이 수행되어야 한다.

- NextAuth.js v5 (Auth.js) 설정
- Kakao OAuth 프로바이더 연동
- Naver OAuth 프로바이더 연동
- Google OAuth 프로바이더 연동
- Prisma Adapter를 통한 데이터베이스 세션 관리
- JWT 전략 기본 사용 (서버리스 환경 최적화)
- `src/lib/auth.ts`에 NextAuth 설정 파일 생성
- `src/app/api/auth/[...nextauth]/route.ts` Route Handler 생성
- `src/components/providers/AuthProvider.tsx` 세션 프로바이더 컴포넌트

**WHEN** 인증되지 않은 사용자가 보호된 페이지에 접근하면 **THEN** 로그인 페이지로 리다이렉트되어야 한다.

**WHEN** 사용자가 로그아웃하면 **THEN** 세션이 무효화되고 홈페이지로 리다이렉트되어야 한다.

### REQ-INFRA-004: 기본 레이아웃 구성 (Ubiquitous)

시스템은 **항상** 일관된 헤더, 푸터, 내비게이션을 포함하는 기본 레이아웃을 제공해야 한다.

- **Root Layout** (`src/app/layout.tsx`): HTML 메타데이터, 글로벌 프로바이더 (AuthProvider, QueryProvider, ThemeProvider), 한국어 lang 속성
- **Main Layout** (`src/app/(main)/layout.tsx`): Header, Sidebar, Footer를 포함하는 메인 앱 레이아웃
- **Auth Layout** (`src/app/(auth)/layout.tsx`): 로그인/회원가입 전용 레이아웃 (네비게이션 없음)
- **Header** (`src/components/layout/Header.tsx`): 로고, 네비게이션 링크, 로그인/프로필 버튼, 모바일 햄버거 메뉴
- **Footer** (`src/components/layout/Footer.tsx`): 서비스 정보, 링크, 저작권
- **Sidebar** (`src/components/layout/Sidebar.tsx`): 카테고리 네비게이션 (데스크톱만)
- **Navigation** (`src/components/layout/Navigation.tsx`): 모바일 하단 탭 네비게이션
- shadcn/ui 컴포넌트 기반 구현 (Button, Card, Dialog, Input, Badge 등 기본 컴포넌트 설치)
- Tailwind CSS 테마 설정 (색상 팔레트, 타이포그래피, 반응형 브레이크포인트)
- 다크 모드 지원 (next-themes)
- 반응형 디자인: 모바일 우선 (mobile-first) 접근

### REQ-INFRA-005: 개발 환경 설정 (Ubiquitous)

시스템은 **항상** 일관된 코드 품질과 개발 경험을 보장하는 도구들이 설정되어야 한다.

- **ESLint**: `@typescript-eslint/eslint-plugin`, Next.js 권장 규칙, import 정렬 규칙
- **Prettier**: 코드 포맷팅 (tabWidth: 2, singleQuote: true, trailingComma: all)
- **Vitest**: 단위/통합 테스트 프레임워크 설정, React Testing Library 연동
- **Playwright**: E2E 테스트 프레임워크 기본 설정
- **Husky + lint-staged**: pre-commit 훅 (ESLint, Prettier, tsc --noEmit)
- **Docker Compose**: 로컬 개발용 PostgreSQL + Redis 서비스 설정
- `.env.example`: 환경 변수 템플릿 (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, OAuth 키 등)
- **GitHub Actions CI**: PR 시 타입 체크, 린트, 테스트, 빌드 자동화

### REQ-INFRA-006: 에러 처리 및 로딩 상태 (Unwanted)

시스템은 처리되지 않은 에러가 사용자에게 원시 에러 메시지로 노출되**지 않아야 한다**.

- `src/app/not-found.tsx`: 404 페이지
- `src/app/(main)/error.tsx`: 메인 영역 에러 바운더리
- `src/app/(main)/policies/loading.tsx`: 정책 목록 로딩 UI
- `src/components/common/ErrorBoundary.tsx`: 재사용 가능한 에러 바운더리
- `src/components/common/LoadingSpinner.tsx`: 로딩 스피너 컴포넌트
- `src/components/common/EmptyState.tsx`: 빈 상태 컴포넌트

### REQ-INFRA-007: TanStack Query 설정 (Optional)

**가능하면** TanStack Query v5 클라이언트 설정을 제공하여 서버 상태 관리 기반을 마련한다.

- `src/components/providers/QueryProvider.tsx`: QueryClientProvider 설정
- 기본 설정: staleTime 5분, gcTime 10분, refetchOnWindowFocus false
- DevTools 설정 (개발 환경에서만 활성화)

---

## 기술 접근 방식

### 아키텍처

- **모노레포 단일 저장소**: Next.js App Router가 프론트엔드와 백엔드(Route Handler)를 통합
- **Vertical Slice Architecture**: `src/features/` 디렉토리에서 도메인별 코드 격리
- **서버리스 우선**: Vercel 배포를 고려한 서버리스 아키텍처

### 데이터베이스 전략

- Prisma schema를 Single Source of Truth로 사용
- `prisma migrate dev`로 마이그레이션 관리
- Prisma Client 싱글톤 패턴 (`src/lib/db.ts`)
- Docker Compose로 로컬 PostgreSQL 실행, 프로덕션은 Neon 사용

### 인증 전략

- JWT 기반 세션 (서버리스 환경 최적화)
- Prisma Adapter로 User/Account/Session 자동 관리
- 미들웨어를 통한 보호 라우트 설정

---

## 영향 받는 파일

### 새로 생성되는 파일

```
policy-damoa/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── not-found.tsx
│   │   ├── globals.css
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   └── login/page.tsx
│   │   ├── (main)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── error.tsx
│   │   │   └── policies/loading.tsx
│   │   └── api/auth/[...nextauth]/route.ts
│   ├── components/
│   │   ├── ui/ (shadcn/ui components)
│   │   ├── layout/Header.tsx
│   │   ├── layout/Footer.tsx
│   │   ├── layout/Sidebar.tsx
│   │   ├── layout/Navigation.tsx
│   │   ├── common/ErrorBoundary.tsx
│   │   ├── common/LoadingSpinner.tsx
│   │   ├── common/EmptyState.tsx
│   │   └── providers/AuthProvider.tsx
│   │   └── providers/QueryProvider.tsx
│   │   └── providers/ThemeProvider.tsx
│   ├── lib/
│   │   ├── db.ts
│   │   ├── auth.ts
│   │   └── utils.ts
│   ├── types/
│   │   └── index.ts
│   └── styles/
├── prisma/
│   └── schema.prisma
├── docker-compose.yml
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── vitest.config.ts
├── playwright.config.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .github/workflows/ci.yml
```

---

## 제외 사항

이 SPEC에서는 다음 기능을 **구현하지 않는다**:

- **데이터 파이프라인**: 공공데이터포털/보조금24 API 연동, 크롤링, 데이터 수집 스크립트 (SPEC-API-001)
- **검색 및 필터링**: 정책 검색 UI, 다중 조건 필터, 전문 검색 (SPEC-UI-001)
- **알림 시스템**: 푸시 알림, 이메일 알림, 매칭 엔진 (SPEC-NOTIF-001)
- **AI 추천**: OpenAI API 연동, 개인화 추천, 유사 정책 추천 (SPEC-AI-001)
- **Redis 캐싱**: Upstash Redis 연동 및 캐시 레이어 (SPEC-API-001)
- **데이터 시딩**: 실제 정책 데이터 시딩 스크립트 (SPEC-API-001)
- **프로필 설정 마법사**: 사용자 프로필 입력 UI 및 플로우 (SPEC-NOTIF-001)

---

## 추적성

- **product.md**: Core Features 1-5, Target Audience 전체
- **structure.md**: 전체 디렉토리 구조, Prisma 모델
- **tech.md**: Next.js, PostgreSQL/Prisma, NextAuth.js, Tailwind/shadcn/ui, Vitest 선택 근거
