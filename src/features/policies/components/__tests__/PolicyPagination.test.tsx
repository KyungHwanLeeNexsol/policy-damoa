import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// next/navigation 모킹
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  useSearchParams: () => new URLSearchParams('category=housing'),
}));

import { PolicyPagination } from '../PolicyPagination';

describe('PolicyPagination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('전체 정책 수를 표시한다', () => {
    render(<PolicyPagination page={1} totalPages={5} total={100} />);
    expect(screen.getByText(/100/)).toBeInTheDocument();
  });

  it('현재 페이지를 표시한다', () => {
    render(<PolicyPagination page={2} totalPages={5} total={100} />);
    // 현재 페이지 번호가 강조되어야 함
    const currentPageButton = screen.getByText('2');
    expect(currentPageButton).toBeInTheDocument();
  });

  it('이전 버튼 클릭 시 page-1로 이동한다', () => {
    render(<PolicyPagination page={3} totalPages={5} total={100} />);
    const prevButton = screen.getByRole('button', { name: /이전/ });
    fireEvent.click(prevButton);

    expect(mockReplace).toHaveBeenCalled();
    const calledUrl = mockReplace.mock.calls[0]?.[0] as string;
    expect(calledUrl).toContain('page=2');
  });

  it('다음 버튼 클릭 시 page+1로 이동한다', () => {
    render(<PolicyPagination page={3} totalPages={5} total={100} />);
    const nextButton = screen.getByRole('button', { name: /다음/ });
    fireEvent.click(nextButton);

    expect(mockReplace).toHaveBeenCalled();
    const calledUrl = mockReplace.mock.calls[0]?.[0] as string;
    expect(calledUrl).toContain('page=4');
  });

  it('첫 페이지에서 이전 버튼이 비활성화된다', () => {
    render(<PolicyPagination page={1} totalPages={5} total={100} />);
    const prevButton = screen.getByRole('button', { name: /이전/ });
    expect(prevButton).toBeDisabled();
  });

  it('마지막 페이지에서 다음 버튼이 비활성화된다', () => {
    render(<PolicyPagination page={5} totalPages={5} total={100} />);
    const nextButton = screen.getByRole('button', { name: /다음/ });
    expect(nextButton).toBeDisabled();
  });

  it('기존 필터 파라미터를 보존한다', () => {
    render(<PolicyPagination page={1} totalPages={5} total={100} />);
    const nextButton = screen.getByRole('button', { name: /다음/ });
    fireEvent.click(nextButton);

    const calledUrl = mockReplace.mock.calls[0]?.[0] as string;
    expect(calledUrl).toContain('category=housing');
  });

  it('totalPages가 1이면 페이지네이션을 렌더링하지 않는다', () => {
    const { container } = render(<PolicyPagination page={1} totalPages={1} total={10} />);
    // 이전/다음 버튼이 없어야 함
    expect(screen.queryByRole('button', { name: /이전/ })).not.toBeInTheDocument();
  });
});
