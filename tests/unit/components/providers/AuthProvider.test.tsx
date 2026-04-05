// AuthProvider 컴포넌트 테스트
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// next-auth/react 모킹
vi.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="session-provider">{children}</div>
  ),
}));

import { AuthProvider } from '@/components/providers/AuthProvider';

describe('AuthProvider', () => {
  afterEach(() => {
    cleanup();
  });

  it('자식 컴포넌트를 올바르게 렌더링해야 한다', () => {
    render(
      <AuthProvider>
        <div data-testid="child">테스트 자식</div>
      </AuthProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('테스트 자식')).toBeInTheDocument();
  });

  it('SessionProvider로 자식을 감싸야 한다', () => {
    render(
      <AuthProvider>
        <div data-testid="child">내용</div>
      </AuthProvider>
    );

    expect(screen.getByTestId('session-provider')).toBeInTheDocument();
    // 자식이 SessionProvider 내부에 있는지 확인
    const provider = screen.getByTestId('session-provider');
    const child = screen.getByTestId('child');
    expect(provider.contains(child)).toBe(true);
  });
});
