import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '@/components/layout/Footer';

describe('Footer', () => {
  it('저작권 텍스트를 렌더링한다', () => {
    render(<Footer />);
    expect(screen.getByText(/© 2026 정책다모아\. All rights reserved\./)).toBeInTheDocument();
  });

  it('서비스 설명을 렌더링한다', () => {
    render(<Footer />);
    expect(screen.getByText('정책다모아 - 모든 정부 정책, 한곳에')).toBeInTheDocument();
  });

  it('서비스 링크를 렌더링한다', () => {
    render(<Footer />);
    expect(screen.getByText('이용약관')).toBeInTheDocument();
    expect(screen.getByText('개인정보처리방침')).toBeInTheDocument();
    expect(screen.getByText('문의하기')).toBeInTheDocument();
  });

  it('푸터 역할을 가진 contentinfo 영역이 존재한다', () => {
    render(<Footer />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
