// @MX:NOTE [AUTO] 추천 카드
'use client';

import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { RecommendationItem } from '../types';

import { FeedbackButtons } from './feedback-buttons';

interface RecommendationCardProps {
  item: RecommendationItem;
}

export function RecommendationCard({ item }: RecommendationCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">
          <Link
            href={`/policies/${item.policyId}?source=recommendation`}
            className="hover:underline"
          >
            {item.title ?? item.policyId}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-3">{item.reason}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {item.region ?? '전국'} · {item.category ?? '-'}
          </span>
          <FeedbackButtons policyId={item.policyId} />
        </div>
      </CardContent>
    </Card>
  );
}
