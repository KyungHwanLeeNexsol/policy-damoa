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

export async function generateMetadata({ params }: PolicyDetailPageProps): Promise<Metadata> {
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
 * 정책 상세 페이지 (Pencil 디자인 기반 2-컬럼 레이아웃)
 */
export default async function PolicyDetailPage({
  params,
  searchParams,
}: PolicyDetailPageProps): Promise<React.ReactNode> {
  const [{ id }, { source }, session] = await Promise.all([params, searchParams, auth()]);
  const policy = await getPolicyById(id);

  if (!policy) {
    notFound();
  }

  let userProfile: UserProfile | null = null;
  if (session?.user?.id) {
    try {
      const profile = await prisma.userProfile.findUnique({
        where: { userId: session.user.id },
      });
      userProfile = profile as UserProfile | null;
      void trackPolicyView(
        session.user.id,
        id,
        (source as 'recommendation' | 'similar' | 'search' | 'detail') ?? 'detail'
      );
    } catch {
      // 프로필 조회 실패 시 무시
    }
  }

  return (
    <div className="px-6 py-8 lg:px-[170px]">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* 메인 콘텐츠 */}
        <div className="flex-1 min-w-0">
          <div
            className="rounded-[16px] bg-white p-6 shadow-sm"
            style={{ border: '1px solid #F2F3F6' }}
          >
            <PolicyDetail policy={policy} session={session} userProfile={userProfile} />
          </div>
        </div>

        {/* 사이드바 */}
        <aside className="w-full lg:w-[320px] lg:shrink-0">
          <div
            className="rounded-[16px] bg-white p-5 shadow-sm"
            style={{ border: '1px solid #F2F3F6' }}
          >
            <h3 className="text-[15px] font-bold text-[#191F28]">비슷한 정책</h3>
            <div className="mt-4">
              <SimilarPolicies policyId={id} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
