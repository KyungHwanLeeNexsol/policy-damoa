'use server';

// @MX:ANCHOR: [AUTO] getPolicies - 정책 목록 조회 진입점 (fan_in >= 3)
// @MX:REASON: page.tsx, tests, 추후 추천 엔진에서 호출
// @MX:NOTE: [AUTO] getPolicies cache bypass - Redis 장애 시 Prisma 폴백은 의도적 설계

import { prisma } from '@/lib/db';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { trackSearch } from '@/services/ai/behavior-tracking.service';
import {
  getCachedPolicyDetail,
  getCachedPolicyList,
  setCachedPolicyDetail,
  setCachedPolicyList,
} from '@/services/cache/policy.cache';
import type {
  PaginatedResponse,
  PolicySearchFilters,
  PolicyWithCategories,
  PolicyCategory,
  Region,
} from '@/types';

import { buildCacheKey, buildOrderBy, buildPolicyWhere } from './policy.queries';

/**
 * 필터 조건에 따른 정책 목록을 조회한다.
 * 캐시 우선 조회 후 Prisma 폴백.
 */
export async function getPolicies(
  filters: PolicySearchFilters
): Promise<PaginatedResponse<PolicyWithCategories>> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
  const cacheKey = buildCacheKey(filters, page, pageSize);

  // 검색어가 있으면 비차단 검색 로그 기록 (SPEC-AI-001 REQ-AI-007)
  if (filters.query && filters.query.trim().length > 0) {
    const queryText = filters.query;
    void import('@/lib/auth')
      .then(({ auth }) => auth())
      .then((session) =>
        trackSearch(session?.user?.id ?? null, queryText, {
          regionCode: filters.regionCode ?? null,
          categoryId: filters.categoryId ?? null,
        })
      )
      .catch(() => {
        /* fire-and-forget */
      });
  }

  // 캐시 조회
  const cached = await getCachedPolicyList<PaginatedResponse<PolicyWithCategories>>(cacheKey);
  if (cached) {
    return cached;
  }

  // Prisma 조회
  const where = buildPolicyWhere(filters);
  const orderBy = buildOrderBy(filters.sortBy);
  const skip = (page - 1) * pageSize;

  const [data, total] = await Promise.all([
    prisma.policy.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        region: true,
      },
    }),
    prisma.policy.count({ where }),
  ]);

  const result: PaginatedResponse<PolicyWithCategories> = {
    data: data as unknown as PolicyWithCategories[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };

  // 캐시 저장
  await setCachedPolicyList(cacheKey, result);

  return result;
}

/**
 * ID로 정책 상세를 조회한다.
 * 캐시 우선 조회 후 Prisma 폴백.
 */
export async function getPolicyById(id: string): Promise<PolicyWithCategories | null> {
  // 캐시 조회
  const cached = await getCachedPolicyDetail<PolicyWithCategories>(id);
  if (cached) {
    return cached;
  }

  // Prisma 조회
  const policy = await prisma.policy.findUnique({
    where: { id },
    include: {
      categories: {
        include: {
          category: true,
        },
      },
      region: true,
    },
  });

  if (!policy) {
    return null;
  }

  const result = policy as unknown as PolicyWithCategories;

  // 캐시 저장
  await setCachedPolicyDetail(id, result);

  return result;
}

/**
 * 시도 레벨(level=1) 지역 목록을 조회한다.
 */
export async function getRegions(): Promise<Region[]> {
  const regions = await prisma.region.findMany({
    where: { level: 1 },
    orderBy: { name: 'asc' },
  });
  return regions as unknown as Region[];
}

/**
 * 모든 정책 카테고리를 조회한다.
 */
export async function getCategories(): Promise<PolicyCategory[]> {
  const categories = await prisma.policyCategory.findMany({
    orderBy: { name: 'asc' },
  });
  return categories as unknown as PolicyCategory[];
}
