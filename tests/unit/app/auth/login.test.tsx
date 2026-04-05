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

  it('소셜 로그인 버튼 3개를 렌더링해야 한다', () => {
    render(<LoginPage />);

    expect(screen.getByText('카카오로 시작하기')).toBeInTheDocument();
    expect(screen.getByText('네이버로 시작하기')).toBeInTheDocument();
    expect(screen.getByText('구글로 시작하기')).toBeInTheDocument();
  });

  it('로그인 제목이 표시되어야 한다', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument();
  });

  it('3개의 프로바이더 버튼이 모두 표시되어야 한다', () => {
    render(<LoginPage />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
  });
});
