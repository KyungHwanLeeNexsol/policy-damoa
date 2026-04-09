import { Suspense } from 'react';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getPolicies, getRegions, getCategories } from '@/features/policies/actions/policy.actions';
import { parseSearchParams } from '@/features/policies/schemas/search';
import { ActiveFilterBadges } from '@/features/policies/components/ActiveFilterBadges';
import { PolicyFilter } from '@/features/policies/components/PolicyFilter';
import { PolicyList } from '@/features/policies/components/PolicyList';
import { PolicyPagination } from '@/features/policies/components/PolicyPagination';
import { PolicySearch } from '@/features/policies/components/PolicySearch';
import PoliciesLoading from './loading';

interface PoliciesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * 정책 목록 페이지 (Pencil 디자인 기반)
 */
export default async function PoliciesPage({
  searchParams,
}: PoliciesPageProps): Promise<React.ReactNode> {
  const params = await searchParams;
  const session = await auth();
  const filters = parseSearchParams(params);

  if (session?.user?.id && !params.region) {
    try {
      const userProfile = await prisma.userProfile.findUnique({
        where: { userId: session.user.id },
        select: { regionId: true },
      });
      if (userProfile?.regionId) {
        const region = await prisma.region.findUnique({
          where: { id: userProfile.regionId },
          select: { code: true },
        });
        if (region?.code) {
          filters.regionCode = region.code;
        }
      }
    } catch {
      // 사용자 프로필 조회 실패 시 무시
    }
  }

  const [result, regions, categories] = await Promise.all([
    getPolicies(filters),
    getRegions(),
    getCategories(),
  ]);

  const searchParamsRecord: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      searchParamsRecord[key] = value;
    } else if (Array.isArray(value) && value[0]) {
      searchParamsRecord[key] = value[0];
    }
  }

  return (
    <div className="px-6 py-8 lg:px-[170px]">
      {/* 페이지 헤더 */}
      <div className="mb-6 flex items-center gap-3">
        <div className="h-6 w-1 rounded-full bg-[#4F6EF7]" />
        <h1 className="text-[22px] font-bold text-[#191F28]">정책 찾기</h1>
        <span className="text-[14px] text-[#8B95A1]">
          전체 {result.total.toLocaleString()}개 정책
        </span>
      </div>

      {/* 검색 */}
      <div className="rounded-[16px] bg-white p-5 shadow-sm" style={{ border: '1px solid #F2F3F6' }}>
        <PolicySearch />
        <div className="mt-4">
          <PolicyFilter regions={regions} categories={categories} />
        </div>
        <div className="mt-3">
          <ActiveFilterBadges />
        </div>
      </div>

      {/* 정책 목록 */}
      <div className="mt-6 space-y-4">
        <Suspense fallback={<PoliciesLoading />}>
          <PolicyList
            policies={result.data}
            total={result.total}
            searchParams={searchParamsRecord}
          />
        </Suspense>

        {result.totalPages > 1 && (
          <PolicyPagination page={result.page} totalPages={result.totalPages} total={result.total} />
        )}
      </div>
    </div>
  );
}
