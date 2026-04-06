import type { PolicyWithCategories } from '@/types';

import { PolicyCard } from './PolicyCard';
import { PolicyEmptyState } from './PolicyEmptyState';

interface PolicyListProps {
  policies: PolicyWithCategories[];
  total: number;
  searchParams?: Record<string, string>;
}

/**
 * 정책 목록 컴포넌트
 * 정책 카드 그리드 또는 비어있는 상태를 표시한다.
 */
export function PolicyList({
  policies,
  total,
  searchParams,
}: PolicyListProps): React.ReactNode {
  if (total === 0) {
    return <PolicyEmptyState />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {policies.map((policy) => (
        <PolicyCard
          key={policy.id}
          policy={policy}
          searchParams={searchParams}
        />
      ))}
    </div>
  );
}
