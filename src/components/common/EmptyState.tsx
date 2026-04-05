// 빈 상태 컴포넌트
// 데이터가 없을 때 아이콘, 제목, 설명, 액션 버튼을 표시
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  /** 표시할 아이콘 */
  icon: LucideIcon;
  /** 제목 텍스트 */
  title: string;
  /** 설명 텍스트 */
  description: string;
  /** 선택적 액션 버튼 */
  action?: React.ReactNode;
  /** 추가 CSS 클래스 */
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps): React.ReactNode {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-4 p-8 text-center', className)}
    >
      <div className="rounded-full bg-muted p-4">
        <Icon className="size-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
