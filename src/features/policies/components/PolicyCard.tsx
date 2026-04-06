'use client';

import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn, getDday, truncate } from '@/lib/utils';
import type { PolicyWithCategories } from '@/types';

interface PolicyCardProps {
  policy: PolicyWithCategories;
  searchParams?: Record<string, string>;
}

/**
 * 정책 카드 컴포넌트
 * 정책 목록에서 개별 정책을 카드 형태로 표시한다.
 */
export function PolicyCard({ policy, searchParams }: PolicyCardProps): React.ReactNode {
  // 상세 페이지 링크 생성 (필터 상태 보존)
  const queryString = searchParams
    ? '?' + new URLSearchParams(searchParams).toString()
    : '';
  const href = `/policies/${policy.id}${queryString}`;

  // D-Day 계산
  const dday = policy.applicationDeadline ? getDday(policy.applicationDeadline) : null;

  // D-Day 배지 색상 결정
  const getDdayVariant = (ddayText: string): string => {
    if (ddayText === '마감') return 'bg-muted text-muted-foreground';
    const match = ddayText.match(/D-(\d+)/);
    if (!match?.[1]) return 'bg-gray-100 text-gray-600';
    const days = parseInt(match[1], 10);
    if (days <= 7) return 'bg-amber-100 text-amber-700';
    if (days <= 30) return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <Link href={href} className="block">
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {/* 카테고리 배지 */}
            {policy.categories.map(({ category }) => (
              <Badge key={category.id} variant="secondary">
                {category.name}
              </Badge>
            ))}
            {/* 혜택 유형 배지 */}
            {policy.benefitType && (
              <Badge variant="outline">{policy.benefitType}</Badge>
            )}
          </div>
          <h3 className="font-semibold text-base line-clamp-2">{policy.title}</h3>
        </CardHeader>
        <CardContent className="pt-0">
          {/* 설명 (2줄 제한) */}
          {policy.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {truncate(policy.description, 100)}
            </p>
          )}
          {/* D-Day 배지 */}
          {dday && (
            <Badge className={cn('text-xs', getDdayVariant(dday))}>
              {dday}
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
