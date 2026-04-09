'use client';

interface PolicyEmptyStateProps {
  query?: string;
  activeFilters?: Record<string, string>;
  onRelaxFilter?: () => void;
}

/**
 * 정책 검색 결과 없음 상태 컴포넌트
 * 필터 상태에 따라 다른 메시지를 표시한다.
 */
export function PolicyEmptyState({
  query,
  activeFilters,
  onRelaxFilter,
}: PolicyEmptyStateProps): React.ReactNode {
  // 활성 필터가 있는 경우
  if (activeFilters && Object.keys(activeFilters).length > 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground mb-4">조건을 조정하면 더 많은 정책을 볼 수 있습니다.</p>
        {onRelaxFilter && (
          <button type="button" onClick={onRelaxFilter} className="text-primary underline text-sm">
            필터 초기화
          </button>
        )}
      </div>
    );
  }

  // 검색어가 있는 경우
  if (query) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">&apos;{query}&apos;에 대한 검색 결과가 없습니다.</p>
      </div>
    );
  }

  // 기본 상태
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-muted-foreground">
        현재 등록된 정책이 없습니다. 잠시 후 다시 확인해 주세요.
      </p>
    </div>
  );
}
