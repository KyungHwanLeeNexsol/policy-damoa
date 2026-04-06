'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { startTransition } from 'react';

import { Button } from '@/components/ui/button';

interface PolicyPaginationProps {
  page: number;
  totalPages: number;
  total: number;
}

/**
 * 정책 목록 페이지네이션 컴포넌트
 * 이전/다음 버튼과 페이지 번호를 표시한다.
 */
export function PolicyPagination({
  page,
  totalPages,
  total,
}: PolicyPaginationProps): React.ReactNode {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 페이지가 1개뿐이면 렌더링하지 않음
  if (totalPages <= 1) {
    return (
      <p className="text-sm text-muted-foreground text-center">
        전체 {total}개 정책
      </p>
    );
  }

  const goToPage = (targetPage: number): void => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(targetPage));

    startTransition(() => {
      router.replace(`?${params.toString()}`);
    });
  };

  // 표시할 페이지 번호 계산 (최대 5개)
  const getPageNumbers = (): number[] => {
    const pages: number[] = [];
    let start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 4);
    start = Math.max(1, end - 4);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-muted-foreground">
        전체 {total}개 정책
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1}
          aria-label="이전 페이지"
        >
          이전
        </Button>

        {pageNumbers.length > 0 && pageNumbers[0]! > 1 && (
          <>
            <Button variant="ghost" size="sm" onClick={() => goToPage(1)}>
              1
            </Button>
            {pageNumbers[0]! > 2 && (
              <span className="px-1 text-muted-foreground">...</span>
            )}
          </>
        )}

        {pageNumbers.map((num) => (
          <Button
            key={num}
            variant={num === page ? 'default' : 'ghost'}
            size="sm"
            onClick={() => goToPage(num)}
          >
            {num}
          </Button>
        ))}

        {pageNumbers.length > 0 && pageNumbers[pageNumbers.length - 1]! < totalPages && (
          <>
            {pageNumbers[pageNumbers.length - 1]! < totalPages - 1 && (
              <span className="px-1 text-muted-foreground">...</span>
            )}
            <Button variant="ghost" size="sm" onClick={() => goToPage(totalPages)}>
              {totalPages}
            </Button>
          </>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages}
          aria-label="다음 페이지"
        >
          ��음
        </Button>
      </div>
    </div>
  );
}
