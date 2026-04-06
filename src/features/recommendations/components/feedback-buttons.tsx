// @MX:NOTE [AUTO] 추천 피드백 버튼 (UP/DOWN)
'use client';

import { Button } from '@/components/ui/button';

import { useRecommendationFeedback } from '../hooks/use-recommendation-feedback';

interface FeedbackButtonsProps {
  policyId: string;
}

export function FeedbackButtons({ policyId }: FeedbackButtonsProps) {
  const mutation = useRecommendationFeedback();

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate({ policyId, rating: 'UP' })}
        aria-label="도움이 됐어요"
      >
        👍
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate({ policyId, rating: 'DOWN' })}
        aria-label="별로예요"
      >
        👎
      </Button>
    </div>
  );
}
