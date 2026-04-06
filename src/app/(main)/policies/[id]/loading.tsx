import { Skeleton } from '@/components/ui/skeleton';

/**
 * 정책 상세 페이지 로딩 스켈레톤
 */
export default function PolicyDetailLoading(): React.ReactNode {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      {/* 카테고리 배지 스켈레톤 */}
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      {/* 제목 스켈레톤 */}
      <Skeleton className="h-8 w-3/4" />
      {/* 메타 정보 스켈레톤 */}
      <div className="flex gap-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-28" />
      </div>
      {/* 내용 스켈레톤 */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
      {/* 체크리스트 스켈레톤 */}
      <div className="rounded-xl border p-6 space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}
