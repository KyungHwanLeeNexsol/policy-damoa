import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PolicyEmptyState } from '../PolicyEmptyState';

describe('PolicyEmptyState', () => {
  it('기본 상태 메시지를 표시한다', () => {
    render(<PolicyEmptyState />);
    expect(screen.getByText(/현재 등록된 정책이 없습니다/)).toBeInTheDocument();
  });

  it('검색어가 있으면 검색 결과 없음 메시지를 표시한다', () => {
    render(<PolicyEmptyState query="주거" />);
    expect(screen.getByText(/'주거'에 대한 검색 결과가 없습니다/)).toBeInTheDocument();
  });

  it('활성 필터가 있으면 조건 조정 메시지를 표시한다', () => {
    render(<PolicyEmptyState activeFilters={{ category: 'housing', region: 'SEOUL' }} />);
    expect(screen.getByText(/조건을 조정하면 더 많은 정책을 볼 수 있습니다/)).toBeInTheDocument();
  });

  it('필터 초기화 버튼을 클릭할 수 있다', () => {
    const onRelaxFilter = vi.fn();
    render(
      <PolicyEmptyState activeFilters={{ category: 'housing' }} onRelaxFilter={onRelaxFilter} />
    );
    const resetButton = screen.getByText('필터 초기화');
    fireEvent.click(resetButton);
    expect(onRelaxFilter).toHaveBeenCalled();
  });

  it('onRelaxFilter가 없으면 필터 초기화 버튼이 없다', () => {
    render(<PolicyEmptyState activeFilters={{ category: 'housing' }} />);
    expect(screen.queryByText('필터 초기화')).not.toBeInTheDocument();
  });
});
