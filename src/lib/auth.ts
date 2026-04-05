// @MX:ANCHOR: [AUTO] NextAuth v5 인증 설정 - 전체 인증 시스템의 진입점
// @MX:REASON: 미들웨어, API 라우트, 서버 컴포넌트에서 참조되는 핵심 모듈
import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import Kakao from 'next-auth/providers/kakao';
import Naver from 'next-auth/providers/naver';

import { prisma } from '@/lib/db';

// NextAuth v5 설정 객체
// JWT 세션 전략과 Prisma Adapter를 사용한 3개 OAuth 프로바이더 구성
export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [Kakao, Naver, Google],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    // JWT 콜백: 토큰에 사용자 ID 추가
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    // 세션 콜백: 세션에 사용자 ID 노출
    session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
