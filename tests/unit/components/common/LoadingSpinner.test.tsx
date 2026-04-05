import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('스피너를 렌더링한다', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('size prop에 따라 다른 크기를 적용한다', () => {
    const { container, rerender } = render(<LoadingSpinner size="sm" />);
    const spinnerSm = container.querySelector('.animate-spin');
    expect(spinnerSm?.classList.contains('size-4')).toBe(true);

    rerender(<LoadingSpinner size="lg" />);
    const spinnerLg = container.querySelector('.animate-spin');
    expect(spinnerLg?.classList.contains('size-12')).toBe(true);
  });

  it('text prop이 있으면 텍스트를 표시한다', () => {
    render(<LoadingSpinner text="데이터 로딩 중..." />);
    expect(screen.getByText('데이터 로딩 중...')).toBeInTheDocument();
  });

  it('text prop이 없으면 기본 aria-label을 사용한다', () => {
    render(<LoadingSpinner />);
    expect(screen.getByLabelText('로딩 중')).toBeInTheDocument();
  });

  it('스크린 리더용 숨겨진 텍스트가 존재한다', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('로딩 중')).toBeInTheDocument();
  });
});
