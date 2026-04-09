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

// next/navigation 모킹
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  })),
}));

describe('Header', () => {
  it("로고 텍스트 '정책다모아'를 렌더링한다", () => {
    render(<Header />);
    expect(screen.getByText('정책다모아')).toBeInTheDocument();
  });

  it('네비게이션 링크를 렌더링한다', () => {
    render(<Header />);
    expect(screen.getByText('홈')).toBeInTheDocument();
    expect(screen.getByText('정책검색')).toBeInTheDocument();
    expect(screen.getByText('관심정책')).toBeInTheDocument();
    expect(screen.getByText('알림설정')).toBeInTheDocument();
    expect(screen.getByText('마이페이지')).toBeInTheDocument();
  });

  it('비인증 상태에서 로그인 버튼을 표시한다', () => {
    render(<Header />);
    expect(screen.getByText('로그인')).toBeInTheDocument();
  });

  it('통합검색 버튼이 존재한다', () => {
    render(<Header />);
    expect(screen.getByLabelText('통합검색')).toBeInTheDocument();
  });

  it('알림 링크가 존재한다', () => {
    render(<Header />);
    expect(screen.getByLabelText('알림')).toBeInTheDocument();
  });
});
