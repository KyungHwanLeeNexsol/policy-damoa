import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '@/components/layout/Header';

// next-auth/react 모킹
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
}));

// next-themes 모킹
vi.mock('next-themes', () => ({
  useTheme: vi.fn(() => ({
    setTheme: vi.fn(),
    resolvedTheme: 'light',
  })),
}));

// next/navigation 모킹
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
}));

describe('Header', () => {
  it("로고 텍스트 '정책다모아'를 렌더링한다", () => {
    render(<Header />);
    expect(screen.getByText('정책다모아')).toBeInTheDocument();
  });

  it('네비게이션 링크를 렌더링한다', () => {
    render(<Header />);
    expect(screen.getByText('정책 검색')).toBeInTheDocument();
    expect(screen.getByText('추천')).toBeInTheDocument();
    expect(screen.getByText('알림')).toBeInTheDocument();
  });

  it('비인증 상태에서 로그인 버튼을 표시한다', () => {
    render(<Header />);
    expect(screen.getByText('로그인')).toBeInTheDocument();
  });

  it('테마 전환 버튼이 존재한다', () => {
    render(<Header />);
    expect(screen.getByLabelText('테마 전환')).toBeInTheDocument();
  });

  it('모바일 메뉴 버튼이 존재한다', () => {
    render(<Header />);
    expect(screen.getByLabelText('메뉴 열기')).toBeInTheDocument();
  });
});
