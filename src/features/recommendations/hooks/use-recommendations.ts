// @MX:NOTE [AUTO] 추천 조회 훅 (TanStack Query)
'use client';

import { useQuery } from '@tanstack/react-query';

import type { RecommendationsResult } from '../types';

async function fetchRecommendations(): Promise<RecommendationsResult> {
  const res = await fetch('/api/recommendations', { credentials: 'include' });
  if (res.status === 401) {
    throw new Error('UNAUTHORIZED');
  }
  if (res.status === 422) {
    throw new Error('PROFILE_INCOMPLETE');
  }
  if (!res.ok) {
    throw new Error('FETCH_FAILED');
  }
  return (await res.json()) as RecommendationsResult;
}

export function useRecommendations(enabled: boolean = true) {
  return useQuery({
    queryKey: ['recommendations'],
    queryFn: fetchRecommendations,
    enabled,
    staleTime: 60 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof Error) {
        if (error.message === 'UNAUTHORIZED' || error.message === 'PROFILE_INCOMPLETE') {
          return false;
        }
      }
      return failureCount < 2;
    },
  });
}
