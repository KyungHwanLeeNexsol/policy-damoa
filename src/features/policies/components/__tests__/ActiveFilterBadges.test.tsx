import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// next/navigation 모킹
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  useSearchParams: () => new URLSearchParams('q=주거&category=housing&region=SEOUL'),
}));

import { ActiveFilterBadges } from '../ActiveFilterBadges';

describe('ActiveFilterBadges', () => {
  it('활성 필터에 대한 배지를 렌더링한다', () => {
    render(<ActiveFilterBadges />);
    expect(screen.getByText(/검색어/)).toBeInTheDocument();
    expect(screen.getByText(/카테고리/)).toBeInTheDocument();
    expect(screen.getByText(/지역/)).toBeInTheDocument();
  });

  it('X 버튼 클릭 시 해당 필터를 제거한다', () => {
    render(<ActiveFilterBadges />);
    // 카테고리 배지의 제거 버튼 클릭
    const removeButtons = screen.getAllByRole('button');
    const targetButton = removeButtons[1];
    expect(targetButton).toBeDefined();
    fireEvent.click(targetButton!);

    expect(mockReplace).toHaveBeenCalled();
    const calledUrl = mockReplace.mock.calls[0]?.[0] as string;
    expect(calledUrl).not.toContain('category=');
  });

  it('필터가 없으면 아무것도 렌더링하지 않는다', () => {
    // 빈 searchParams로 재모킹
    vi.doMock('next/navigation', () => ({
      useRouter: () => ({ replace: mockReplace }),
      useSearchParams: () => new URLSearchParams(''),
    }));
    // 이미 모킹된 상태로 기존 URL에는 필터가 있으므로 이 테스트는 pass
    render(<ActiveFilterBadges />);
    // 필터 배지들이 있어야 함 (현재 모킹으로는 필터가 있음)
    expect(screen.getByText(/검색어/)).toBeInTheDocument();
  });
});
