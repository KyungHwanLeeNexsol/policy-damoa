import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// next/navigation 모킹
const mockReplace = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  useSearchParams: () => mockSearchParams,
}));

import { PolicySearch } from '../PolicySearch';

describe('PolicySearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockSearchParams.delete('q');
    mockSearchParams.delete('page');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('검색 입력창을 렌더링한다', () => {
    render(<PolicySearch />);
    expect(screen.getByPlaceholderText(/정책 검색/)).toBeInTheDocument();
  });

  it('URL의 q 파라미터가 있으면 입력창에 표시한다', () => {
    mockSearchParams.set('q', '주거');
    render(<PolicySearch />);
    const input = screen.getByPlaceholderText(/정책 검색/) as HTMLInputElement;
    expect(input.value).toBe('주거');
  });

  it('300ms 디바운스 후 URL을 업데이트한다', async () => {
    render(<PolicySearch />);
    const input = screen.getByPlaceholderText(/정책 검색/);

    fireEvent.change(input, { target: { value: '주거' } });

    // 디바운스 전에는 호출 안 됨
    expect(mockReplace).not.toHaveBeenCalled();

    // 300ms 후
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockReplace).toHaveBeenCalled();
    const calledUrl = mockReplace.mock.calls[0]?.[0] as string;
    expect(calledUrl).toContain('q=');
  });

  it('검색어가 비면 q 파라미터를 제거한다', () => {
    mockSearchParams.set('q', '기존검색');
    render(<PolicySearch />);
    const input = screen.getByPlaceholderText(/정책 검색/);

    fireEvent.change(input, { target: { value: '' } });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockReplace).toHaveBeenCalled();
    const calledUrl = mockReplace.mock.calls[0]?.[0] as string;
    expect(calledUrl).not.toContain('q=');
  });

  it('검색 시 page를 1로 리셋한다', () => {
    mockSearchParams.set('page', '3');
    render(<PolicySearch />);
    const input = screen.getByPlaceholderText(/정책 검색/);

    fireEvent.change(input, { target: { value: '주거' } });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockReplace).toHaveBeenCalled();
    const calledUrl = mockReplace.mock.calls[0]?.[0] as string;
    expect(calledUrl).not.toContain('page=3');
  });

  it('검색어가 있으면 클리어 버튼을 표시한다', () => {
    mockSearchParams.set('q', '주거');
    render(<PolicySearch />);
    expect(screen.getByRole('button', { name: /초기화|지우기|clear/i })).toBeInTheDocument();
  });
});

// afterEach import 필요 없음 - 위에서 사용
import { afterEach } from 'vitest';
