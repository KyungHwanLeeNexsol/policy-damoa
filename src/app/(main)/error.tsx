'use client';

// 메인 레이아웃 에러 페이지
// 런타임 에러 발생 시 표시되는 에러 바운더리 UI
import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps): React.ReactNode {
  useEffect(() => {
    // 에러 로깅 (프로덕션에서는 에러 추적 서비스로 전송)
    console.error('페이지 에러:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertTriangle className="size-8 text-destructive" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">오류가 발생했습니다</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          페이지를 로드하는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      </div>
      <Button onClick={reset} variant="outline">
        다시 시도
      </Button>
    </div>
  );
}
