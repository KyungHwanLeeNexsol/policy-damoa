// 로그인 페이지 테스트
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// next-auth/react 모킹
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import LoginPage from '@/app/(auth)/login/page';

describe('로그인 페이지', () => {
  afterEach(() => {
    cleanup();
  });

  it('카카오 로그인 버튼을 렌더링해야 한다', () => {
    render(<LoginPage />);

    expect(screen.getByText('카카오 계정으로 로그인')).toBeInTheDocument();
  });

  it('서비스 이름이 표시되어야 한다', () => {
    render(<LoginPage />);

    expect(screen.getByText('정책다모아')).toBeInTheDocument();
  });

  it('카카오 버튼 1개가 표시되어야 한다', () => {
    render(<LoginPage />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
  });
});
