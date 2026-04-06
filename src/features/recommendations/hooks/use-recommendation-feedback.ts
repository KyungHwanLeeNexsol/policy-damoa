// @MX:NOTE [AUTO] 추천 피드백 mutation (낙관적 업데이트 + 롤백)
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type {
  FeedbackPayload,
  RecommendationsResult,
} from '../types';

async function postFeedback(payload: FeedbackPayload): Promise<void> {
  const res = await fetch('/api/recommendations/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('FEEDBACK_FAILED');
  }
}

interface FeedbackContext {
  previous?: RecommendationsResult;
}

export function useRecommendationFeedback() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, FeedbackPayload, FeedbackContext>({
    mutationFn: postFeedback,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['recommendations'] });
      const previous = queryClient.getQueryData<RecommendationsResult>([
        'recommendations',
      ]);
      if (previous) {
        queryClient.setQueryData<RecommendationsResult>(['recommendations'], {
          ...previous,
          recommendations: previous.recommendations.filter(
            (r) => !(payload.rating === 'DOWN' && r.policyId === payload.policyId),
          ),
        });
      }
      return { previous };
    },
    onError: (_err, _payload, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['recommendations'], ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
  });
}
