'use client';

// @MX:NOTE: [AUTO] ActiveFilterBadges - URL 파라미터 기반 활성 필터 배지 표시

import { useRouter, useSearchParams } from 'next/navigation';
import { startTransition } from 'react';

import { Badge } from '@/components/ui/badge';

// 필터 키와 한국어 레이블 매핑
const FILTER_LABELS: Record<string, string> = {
  q: '검색어',
  category: '카테고리',
  region: '지역',
  benefit: '혜택유형',
  status: '상태',
  occupation: '직업',
  family: '가족상태',
  sort: '정렬',
};

// 배지로 표시할 필터 키 목록 (page, pageSize 제외)
const BADGE_KEYS = Object.keys(FILTER_LABELS);

/**
 * 활성 필터 배지 컴포넌트
 * URL searchParams에서 활성 필터를 읽어 배지로 표시하고,
 * X 버튼 클릭 시 해당 필터를 제거한다.
 */
export function ActiveFilterBadges(): React.ReactNode {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 활성 필터 추출
  const activeFilters = BADGE_KEYS.filter((key) => searchParams.has(key));

  if (activeFilters.length === 0) {
    return null;
  }

  const handleRemove = (key: string): void => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.delete('page'); // 필터 변경 시 페이지 리셋

    startTransition(() => {
      router.replace(`?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {activeFilters.map((key) => (
        <Badge key={key} variant="secondary" className="gap-1">
          <span>
            {FILTER_LABELS[key]}: {searchParams.get(key)}
          </span>
          <button
            type="button"
            onClick={() => handleRemove(key)}
            className="ml-1 hover:text-foreground"
            aria-label={`${FILTER_LABELS[key]} 필터 제거`}
          >
            X
          </button>
        </Badge>
      ))}
    </div>
  );
}
