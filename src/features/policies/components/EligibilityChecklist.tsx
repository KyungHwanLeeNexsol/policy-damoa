'use client';

import { cn } from '@/lib/utils';
import type { Policy, UserProfile } from '@/types';

import { matchEligibility, type EligibilityResult } from '../utils/eligibility';

interface EligibilityChecklistProps {
  policy: Policy;
  profile: UserProfile | null;
}

// 상태별 아이콘 및 스타일
const statusConfig: Record<EligibilityResult['status'], { icon: string; className: string }> = {
  eligible: { icon: '\u2705', className: 'text-green-600' },
  partial: { icon: '\uD83D\uDFE1', className: 'text-yellow-600' },
  ineligible: { icon: '\u274C', className: 'text-red-600' },
};

/**
 * 적격성 체크리스트 컴포넌트
 * 사용자 프로필이 있으면 자격 요건 매칭 결과를 표시하고,
 * 없으면 로그인 유도 CTA를 표시한다.
 */
export function EligibilityChecklist({
  policy,
  profile,
}: EligibilityChecklistProps): React.ReactNode {
  // 미인증 사용자: 블러 처리 + CTA
  if (!profile) {
    return (
      <div className="relative">
        <div className="blur-sm pointer-events-none select-none p-4 bg-muted/30 rounded-lg">
          <div className="h-4 w-32 bg-muted rounded mb-2" />
          <div className="h-4 w-24 bg-muted rounded mb-2" />
          <div className="h-4 w-28 bg-muted rounded" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm font-medium text-center px-4">
            로그인하면 나에게 맞는지 확인할 수 있어요.
          </p>
        </div>
      </div>
    );
  }

  // 적격성 판단
  const results = matchEligibility(policy, profile);

  if (results.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        이 정책의 자격 요건 정보가 아직 제공되지 않았습니다.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {results.map((result) => {
        const config = statusConfig[result.status];
        return (
          <li
            key={result.label}
            className={cn('flex items-center gap-2 text-sm', config.className)}
          >
            <span>{config.icon}</span>
            <span>{result.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
