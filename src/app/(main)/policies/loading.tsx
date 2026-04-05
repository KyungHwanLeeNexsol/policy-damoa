// 정책 페이지 로딩 스켈레톤
// 정책 목록 로딩 중 카드 형태의 스켈레톤 표시
import { Skeleton } from '@/components/ui/skeleton';

export default function PoliciesLoading(): React.ReactNode {
  return (
    <div className="flex flex-col gap-6">
      {/* 검색 바 스켈레톤 */}
      <Skeleton className="h-10 w-full max-w-md" />

      {/* 정책 카드 스켈레톤 목록 */}
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-3 rounded-xl border p-6">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex items-center gap-2 pt-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
