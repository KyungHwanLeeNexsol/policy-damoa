// 404 페이지
// 존재하지 않는 경로 접근 시 표시
import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound(): React.ReactNode {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="rounded-full bg-muted p-6">
        <FileQuestion className="size-12 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">404</h1>
        <p className="text-lg text-muted-foreground">페이지를 찾을 수 없습니다</p>
        <p className="text-sm text-muted-foreground">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
      </div>
      <Button asChild>
        <Link href="/">홈으로 돌아가기</Link>
      </Button>
    </div>
  );
}
