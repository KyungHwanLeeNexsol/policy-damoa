'use client';

import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * 정책 목록 페이지 에러 바운더리
 */
export default function PoliciesError({ error, reset }: ErrorProps): React.ReactNode {
  useEffect(() => {
    console.error('[PoliciesPage] 오류 발생:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <p className="text-lg font-medium">정책 목록을 불러오지 못했습니다.</p>
      <p className="text-sm text-muted-foreground">잠시 후 다시 시도해 주세요.</p>
      <Button onClick={reset} variant="outline">
        다시 시도
      </Button>
    </div>
  );
}
