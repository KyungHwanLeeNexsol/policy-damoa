import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getPolicyById } from '@/features/policies/actions/policy.actions';
import { PolicyDetail } from '@/features/policies/components/PolicyDetail';
import { SimilarPolicies } from '@/features/recommendations/components/similar-policies';
import { trackPolicyView } from '@/services/ai/behavior-tracking.service';
import type { UserProfile } from '@/types';

interface PolicyDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ source?: string }>;
}

/**
 * 정책 상세 페이지 메타데이터 생성
 */
export async function generateMetadata({
  params,
}: PolicyDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const policy = await getPolicyById(id);

  if (!policy) {
    return { title: '정책을 찾을 수 없습니다' };
  }

  return {
    title: `${policy.title} | 정책다모아`,
    description: policy.description ?? undefined,
  };
}

/**
 * 정책 상세 페이지 (서버 컴포넌트)
 * 정책 ID로 상세 정보를 조회하고 PolicyDetail 컴포넌트를 렌더링한다.
 */
export default async function PolicyDetailPage({
  params,
  searchParams,
}: PolicyDetailPageProps): Promise<React.ReactNode> {
  const [{ id }, { source }, session] = await Promise.all([
    params,
    searchParams,
    auth(),
  ]);
  const policy = await getPolicyById(id);

  if (!policy) {
    notFound();
  }

  // 인증 사용자의 프로필 조회
  let userProfile: UserProfile | null = null;
  if (session?.user?.id) {
    try {
      const profile = await prisma.userProfile.findUnique({
        where: { userId: session.user.id },
      });
      userProfile = profile as UserProfile | null;
      // 정책 조회 이벤트 비동기 기록 (non-blocking)
      void trackPolicyView(
        session.user.id,
        id,
        (source as 'recommendation' | 'similar' | 'search' | 'detail') ?? 'detail',
      );
    } catch {
      // 프로필 조회 실패 시 무시 (선택 기능)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      <PolicyDetail
        policy={policy}
        session={session}
        userProfile={userProfile}
      />
      <SimilarPolicies policyId={id} />
    </div>
  );
}
