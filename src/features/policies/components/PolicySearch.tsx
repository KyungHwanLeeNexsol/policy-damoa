'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { startTransition, useCallback, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';

/**
 * 정책 검색 입력 컴포넌트
 * 300ms 디바운스로 URL 검색 파라미터를 업데이트한다.
 */
export function PolicySearch(): React.ReactNode {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get('q') ?? '';
  const [value, setValue] = useState(urlQuery);
  // URL이 외부에서 변경된 경우(뒤로가기 등) 렌더 중 state 동기화
  // React 권장 패턴: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery);
  if (prevUrlQuery !== urlQuery) {
    setPrevUrlQuery(urlQuery);
    setValue(urlQuery);
  }
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateUrl = useCallback(
    (query: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (query) {
        params.set('q', query);
      } else {
        params.delete('q');
      }
      // 검색 시 페이지를 1로 리셋
      params.delete('page');

      startTransition(() => {
        router.replace(`?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newValue = e.target.value;
    setValue(newValue);

    // 디바운스: 이전 타이머 취소 후 300ms 후 URL 업데이트
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      updateUrl(newValue);
    }, 300);
  };

  const handleClear = (): void => {
    setValue('');
    updateUrl('');
  };

  return (
    <div className="relative">
      <Input
        type="text"
        placeholder="정책 검색..."
        value={value}
        onChange={handleChange}
        className="pr-8"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="검색어 지우기"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm"
        >
          X
        </button>
      )}
    </div>
  );
}
