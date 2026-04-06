'use client';

// @MX:NOTE: [AUTO] PolicyFilter - URL 파라미터 기반 필터 패널, 모바일은 Sheet로 표시

import { useRouter, useSearchParams } from 'next/navigation';
import { startTransition } from 'react';

import type { PolicyCategory, Region } from '@/types';

interface PolicyFilterProps {
  regions: Region[];
  categories: PolicyCategory[];
}

// 상태 옵션
const STATUS_OPTIONS = [
  { value: 'active', label: '진행중' },
  { value: 'upcoming', label: '예정' },
  { value: 'expired', label: '마감' },
] as const;

// 정렬 옵션
const SORT_OPTIONS = [
  { value: 'newest', label: '최신순' },
  { value: 'deadline', label: '마감임박순' },
  { value: 'relevance', label: '관련도순' },
] as const;

/**
 * 정책 필터 패널 컴포넌트
 * 데스크탑에서는 인라인, 모바일에서는 Sheet로 표시한다.
 */
export function PolicyFilter({
  regions,
  categories,
}: PolicyFilterProps): React.ReactNode {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string): void => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page'); // 필터 변경 시 페이지 리셋

    startTransition(() => {
      router.replace(`?${params.toString()}`);
    });
  };

  const currentCategory = searchParams.get('category') ?? '';
  const currentRegion = searchParams.get('region') ?? '';
  const currentStatus = searchParams.get('status') ?? '';
  const currentSort = searchParams.get('sort') ?? '';

  return (
    <div className="space-y-6">
      {/* 카테고리 */}
      <section>
        <h3 className="text-sm font-semibold mb-2">카테고리</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => updateFilter('category', currentCategory === cat.slug ? '' : cat.slug)}
              className={`text-xs px-3 py-1 rounded-full border ${
                currentCategory === cat.slug
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-muted border-input'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* 지역 */}
      <section>
        <h3 className="text-sm font-semibold mb-2">지역</h3>
        <select
          value={currentRegion}
          onChange={(e) => updateFilter('region', e.target.value)}
          className="w-full text-sm border rounded-md px-3 py-2 bg-background"
        >
          <option value="">전체 지역</option>
          {regions.map((region) => (
            <option key={region.id} value={region.code}>
              {region.name}
            </option>
          ))}
        </select>
      </section>

      {/* 상태 */}
      <section>
        <h3 className="text-sm font-semibold mb-2">상태</h3>
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                updateFilter('status', currentStatus === option.value ? '' : option.value)
              }
              className={`text-xs px-3 py-1 rounded-full border ${
                currentStatus === option.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-muted border-input'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {/* 정렬 */}
      <section>
        <h3 className="text-sm font-semibold mb-2">정렬</h3>
        <select
          value={currentSort}
          onChange={(e) => updateFilter('sort', e.target.value)}
          className="w-full text-sm border rounded-md px-3 py-2 bg-background"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </section>
    </div>
  );
}
