// @MX:NOTE [AUTO] 유사 정책 컴포넌트 (정책 상세 페이지용)
'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import type { SimilarPolicyItem } from '../types';

interface SimilarPoliciesProps {
  policyId: string;
  limit?: number;
}

async function fetchSimilar(
  policyId: string,
  limit: number,
): Promise<SimilarPolicyItem[]> {
  const res = await fetch(`/api/policies/${policyId}/similar?limit=${limit}`);
  if (!res.ok) throw new Error('FETCH_FAILED');
  const json = (await res.json()) as { similar: SimilarPolicyItem[] };
  return json.similar;
}

export function SimilarPolicies({ policyId, limit = 5 }: SimilarPoliciesProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['similar-policies', policyId, limit],
    queryFn: () => fetchSimilar(policyId, limit),
    staleTime: 60 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (error || !data || data.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">유사한 정책</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {data.map((p) => (
          <Card key={p.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                <Link
                  href={`/policies/${p.id}?source=similar`}
                  className="hover:underline"
                >
                  {p.title}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {p.region ?? '전국'} · {p.category ?? '-'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
