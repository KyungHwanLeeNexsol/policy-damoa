// 로딩 스피너 컴포넌트
// 데이터 로딩 중 표시되는 애니메이션 스피너
import { cn } from '@/lib/utils';

type SpinnerSize = 'sm' | 'md' | 'lg';

interface LoadingSpinnerProps {
  /** 스피너 크기 */
  size?: SpinnerSize;
  /** 로딩 메시지 (선택) */
  text?: string;
  /** 추가 CSS 클래스 */
  className?: string;
}

// 크기별 스피너 스타일 매핑
const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'size-4 border-2',
  md: 'size-8 border-3',
  lg: 'size-12 border-4',
};

export function LoadingSpinner({
  size = 'md',
  text,
  className,
}: LoadingSpinnerProps): React.ReactNode {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3', className)}
      role="status"
      aria-label={text ?? '로딩 중'}
    >
      <div
        className={cn('animate-spin rounded-full border-muted border-t-primary', sizeClasses[size])}
      />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
      <span className="sr-only">로딩 중</span>
    </div>
  );
}
