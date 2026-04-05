// NextAuth v5 설정 테스트
import { describe, expect, it, vi } from 'vitest';

// next-auth 내부 모듈 모킹
vi.mock('@auth/prisma-adapter', () => ({
  PrismaAdapter: vi.fn(() => ({})),
}));

vi.mock('@/lib/db', () => ({
  prisma: {},
}));

vi.mock('next-auth/providers/kakao', () => ({
  default: vi.fn(() => ({ id: 'kakao', name: 'Kakao' })),
}));

vi.mock('next-auth/providers/naver', () => ({
  default: vi.fn(() => ({ id: 'naver', name: 'Naver' })),
}));

vi.mock('next-auth/providers/google', () => ({
  default: vi.fn(() => ({ id: 'google', name: 'Google' })),
}));

vi.mock('next-auth', () => {
  const mockAuth = vi.fn();
  const mockSignIn = vi.fn();
  const mockSignOut = vi.fn();
  const mockHandlers = { GET: vi.fn(), POST: vi.fn() };

  return {
    default: vi.fn(() => ({
      handlers: mockHandlers,
      auth: mockAuth,
      signIn: mockSignIn,
      signOut: mockSignOut,
    })),
  };
});

describe('auth 설정', () => {
  it('handlers, auth, signIn, signOut가 올바르게 export 되어야 한다', async () => {
    const authModule = await import('@/lib/auth');

    expect(authModule.handlers).toBeDefined();
    expect(authModule.handlers.GET).toBeDefined();
    expect(authModule.handlers.POST).toBeDefined();
    expect(authModule.auth).toBeDefined();
    expect(authModule.signIn).toBeDefined();
    expect(authModule.signOut).toBeDefined();
  });

  it('authConfig에 3개의 OAuth 프로바이더가 포함되어야 한다', async () => {
    const authModule = await import('@/lib/auth');

    expect(authModule.authConfig).toBeDefined();
    expect(authModule.authConfig.providers).toHaveLength(3);

    const providerIds = authModule.authConfig.providers.map(
      (p: { id?: string; (): { id: string } }) => (typeof p === 'function' ? p().id : p.id)
    );
    expect(providerIds).toContain('kakao');
    expect(providerIds).toContain('naver');
    expect(providerIds).toContain('google');
  });
});
