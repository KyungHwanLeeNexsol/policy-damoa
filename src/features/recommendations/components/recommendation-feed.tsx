// @MX:NOTE [AUTO] 추천 피드 (홈/추천 페이지용)
'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { useRecommendations } from '../hooks/use-recommendations';

import { RecommendationCard } from './recommendation-card';

export function RecommendationFeed() {
  const { data, isLoading, error } = useRecommendations();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  if (error instanceof Error) {
    if (error.message === 'UNAUTHORIZED') {
      return (
        <div className="rounded-lg border p-6 text-center">
          <p className="mb-3 text-sm text-muted-foreground">
            로그인하면 맞춤형 정책 추천을 받을 수 있어요.
          </p>
          <Button asChild>
            <Link href="/auth/signin">로그인하기</Link>
          </Button>
        </div>
      );
    }
    if (error.message === 'PROFILE_INCOMPLETE') {
      return (
        <div className="rounded-lg border p-6 text-center">
          <p className="mb-3 text-sm text-muted-foreground">
            프로필을 완성하면 더 정확한 추천을 받을 수 있어요.
          </p>
          <Button asChild>
            <Link href="/profile">프로필 완성하기</Link>
          </Button>
        </div>
      );
    }
    return <p className="text-sm text-muted-foreground">추천을 불러오지 못했어요.</p>;
  }

  if (!data || data.recommendations.length === 0) {
    return <p className="text-sm text-muted-foreground">추천할 정책이 없어요.</p>;
  }

  return (
    <div className="space-y-3">
      {data.fallback && (
        <p className="text-xs text-muted-foreground">일시적으로 간이 추천을 제공하고 있어요.</p>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.recommendations.map((item) => (
          <RecommendationCard key={item.policyId} item={item} />
        ))}
      </div>
    </div>
  );
}
