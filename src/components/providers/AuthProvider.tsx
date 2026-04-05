'use client';

// 클라이언트 사이드 세션 프로바이더
// 클라이언트 컴포넌트에서 useSession() 훅 사용을 위해 필요
import { SessionProvider } from 'next-auth/react';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.ReactNode {
  return <SessionProvider>{children}</SessionProvider>;
}
