import { z } from 'zod';

import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import type { PolicySearchFilters } from '@/types';

// URL 검색 파라미터 스키마
export const searchParamsSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  region: z.string().optional(),
  benefit: z.string().optional(),
  status: z.enum(['active', 'expired', 'upcoming']).optional(),
  sort: z.enum(['newest', 'deadline', 'relevance']).optional(),
  age_min: z.coerce.number().int().min(0).max(150).optional(),
  age_max: z.coerce.number().int().min(0).max(150).optional(),
  occupation: z.string().optional(),
  family: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(DEFAULT_PAGE_SIZE),
});

export type SearchParams = z.infer<typeof searchParamsSchema>;

/**
 * URL searchParams를 PolicySearchFilters로 변환한다.
 */
export function parseSearchParams(
  params: Record<string, string | string[] | undefined>
): PolicySearchFilters {
  // 문자열 배열인 경우 첫 번째 값만 사용
  const normalized: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(params)) {
    normalized[key] = Array.isArray(value) ? value[0] : value;
  }

  const parsed = searchParamsSchema.safeParse(normalized);
  if (!parsed.success) {
    return { page: 1, pageSize: DEFAULT_PAGE_SIZE };
  }

  const {
    q,
    category,
    region,
    benefit,
    status,
    sort,
    age_min,
    age_max,
    occupation,
    family,
    page,
    pageSize,
  } = parsed.data;

  const filters: PolicySearchFilters = {
    page,
    pageSize,
  };

  if (q) filters.query = q;
  if (category) filters.categoryId = category;
  if (region) filters.regionCode = region;
  if (benefit) filters.benefitType = benefit;
  if (status) filters.status = status;
  if (sort) filters.sortBy = sort;
  if (occupation) filters.occupation = occupation;
  if (family) filters.familyStatus = family;
  if (age_min !== undefined && age_max !== undefined) {
    filters.ageRange = { min: age_min, max: age_max };
  }

  return filters;
}
