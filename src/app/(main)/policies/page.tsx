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
 * 정책 목록 페이지 (서버 컴포넌트)
 * URL searchParams를 읽어 필터를 적용하고 정책 목록을 렌더링한다.
 */
export default async function PoliciesPage({
  searchParams,
}: PoliciesPageProps): Promise<React.ReactNode> {
  const params = await searchParams;
  const session = await auth();
  const filters = parseSearchParams(params);

  // REQ-UI-006: 인증 사용자에게 지역 필터 기본값 설정
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
      // 사용자 프로필 조회 실패 시 무시 (선택 기능)
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
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">정책 찾기</h1>
        <p className="text-muted-foreground text-sm">전체 {result.total.toLocaleString()}개 정책</p>
      </div>

      {/* 검색 */}
      <PolicySearch />

      {/* 활성 필터 배지 */}
      <ActiveFilterBadges />

      <div className="flex gap-6">
        {/* 필터 패널 (데스크탑: 인라인, 모바일: Sheet) */}
        <aside className="hidden lg:block w-56 shrink-0">
          <PolicyFilter regions={regions} categories={categories} />
        </aside>

        {/* 정책 목록 */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* 모바일 필터 버튼 */}
          <div className="lg:hidden">
            <PolicyFilter regions={regions} categories={categories} />
          </div>

          <Suspense fallback={<PoliciesLoading />}>
            <PolicyList
              policies={result.data}
              total={result.total}
              searchParams={searchParamsRecord}
            />
          </Suspense>

          {/* 페이지네이션 */}
          {result.totalPages > 1 && (
            <PolicyPagination
              page={result.page}
              totalPages={result.totalPages}
              total={result.total}
            />
          )}
        </div>
      </div>
    </div>
  );
}
