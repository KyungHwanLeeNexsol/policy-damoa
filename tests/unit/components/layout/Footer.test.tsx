import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '@/components/layout/Footer';

describe('Footer', () => {
  it('저작권 텍스트를 렌더링한다', () => {
    render(<Footer />);
    expect(screen.getByText(/© 2026 정책다모아/)).toBeInTheDocument();
  });

  it('서비스 설명을 렌더링한다', () => {
    render(<Footer />);
    expect(screen.getByText('범정부 정책정보 통합 플랫폼')).toBeInTheDocument();
  });

  it('관련 사이트 링크를 렌더링한다', () => {
    render(<Footer />);
    expect(screen.getByText('정부24 (gov.kr)')).toBeInTheDocument();
    expect(screen.getByText('보조금24')).toBeInTheDocument();
    expect(screen.getByText('고용노동부')).toBeInTheDocument();
  });

  it('서비스 링크를 렌더링한다', () => {
    render(<Footer />);
    expect(screen.getByText('이용약관')).toBeInTheDocument();
    expect(screen.getByText('개인정보처리방침')).toBeInTheDocument();
  });

  it('푸터 역할을 가진 contentinfo 영역이 존재한다', () => {
    render(<Footer />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
