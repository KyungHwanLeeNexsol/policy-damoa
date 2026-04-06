// @MX:ANCHOR: [AUTO] buildCacheKey - 캐시 일관성 불변 계약
// @MX:REASON: 동일 파라미터 집합의 순서 무관 동일 해시 보장

// @MX:NOTE: [AUTO] buildPolicyWhere - 복잡한 필터-Prisma where 변환 로직

import { createHash } from 'crypto';

import type { PolicySearchFilters } from '@/types';

/**
 * 필터 조건과 페이지 정보로 캐시 키 해시를 생성한다.
 * 파라미터 순서에 관계없이 동일한 해시를 반환한다.
 */
export function buildCacheKey(
  filters: PolicySearchFilters,
  page: number,
  pageSize: number
): string {
  // undefined 값 제거 후 알파벳 순 정렬
  const cleanFilters: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined) {
      cleanFilters[key] = value;
    }
  }
  const sorted = JSON.stringify({ ...cleanFilters, page, pageSize }, Object.keys({ ...cleanFilters, page: page, pageSize: pageSize }).sort());
  return createHash('md5').update(sorted).digest('hex');
}

/**
 * PolicySearchFilters를 Prisma where 절로 변환한다.
 */
export function buildPolicyWhere(
  filters: PolicySearchFilters
): Record<string, unknown> {
  const where: Record<string, unknown> = {};

  // 텍스트 검색: title, description, sourceAgency OR 조건
  if (filters.query) {
    where.OR = [
      { title: { contains: filters.query, mode: 'insensitive' } },
      { description: { contains: filters.query, mode: 'insensitive' } },
      { sourceAgency: { contains: filters.query, mode: 'insensitive' } },
    ];
  }

  // 카테고리: PolicyCategoryRelation을 통한 검색
  if (filters.categoryId) {
    where.categories = {
      some: { category: { slug: filters.categoryId } },
    };
  }

  // 지역: region.code로 검색
  if (filters.regionCode) {
    where.region = { code: filters.regionCode };
  }

  // 상태: 직접 equals
  if (filters.status) {
    where.status = filters.status;
  }

  // 혜택 유형: 직접 equals
  if (filters.benefitType) {
    where.benefitType = filters.benefitType;
  }

  // 직업: eligibilityCriteria JSONB path 검색
  if (filters.occupation) {
    where.eligibilityCriteria = {
      path: ['occupation'],
      array_contains: filters.occupation,
    };
  }

  return where;
}

/**
 * sortBy 파라미터를 Prisma orderBy 절로 변환한다.
 */
export function buildOrderBy(
  sortBy?: string
): Record<string, string> {
  switch (sortBy) {
    case 'newest':
      return { createdAt: 'desc' };
    case 'deadline':
      return { applicationDeadline: 'asc' };
    case 'relevance':
      return { updatedAt: 'desc' };
    default:
      return { createdAt: 'desc' };
  }
}
