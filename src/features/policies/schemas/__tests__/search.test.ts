import { describe, expect, it } from 'vitest';

import { parseSearchParams, searchParamsSchema } from '../search';

describe('searchParamsSchema', () => {
  it('빈 객체를 유효하게 파싱한다', () => {
    const result = searchParamsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(20);
    }
  });

  it('유효한 status 값을 파싱한다', () => {
    const result = searchParamsSchema.safeParse({ status: 'active' });
    expect(result.success).toBe(true);
  });

  it('잘못된 status 값을 거부한다', () => {
    const result = searchParamsSchema.safeParse({ status: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('page를 문자열에서 숫자로 변환한다', () => {
    const result = searchParamsSchema.safeParse({ page: '3' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
    }
  });

  it('page가 0 이하면 거부한다', () => {
    const result = searchParamsSchema.safeParse({ page: '0' });
    expect(result.success).toBe(false);
  });
});

describe('parseSearchParams', () => {
  it('URL 파라미터를 PolicySearchFilters로 변환한다', () => {
    const filters = parseSearchParams({
      q: '주거',
      category: 'housing',
      region: 'SEOUL',
      status: 'active',
      sort: 'newest',
    });

    expect(filters.query).toBe('주거');
    expect(filters.categoryId).toBe('housing');
    expect(filters.regionCode).toBe('SEOUL');
    expect(filters.status).toBe('active');
    expect(filters.sortBy).toBe('newest');
    expect(filters.page).toBe(1);
    expect(filters.pageSize).toBe(20);
  });

  it('빈 파라미터에 대해 기본값을 반환한다', () => {
    const filters = parseSearchParams({});
    expect(filters.page).toBe(1);
    expect(filters.pageSize).toBe(20);
    expect(filters.query).toBeUndefined();
  });

  it('잘못된 status는 무시하고 기본값을 반환한다', () => {
    const filters = parseSearchParams({ status: 'invalid' });
    expect(filters.page).toBe(1);
    expect(filters.status).toBeUndefined();
  });

  it('배열 값은 첫 번째 값만 사용한다', () => {
    const filters = parseSearchParams({
      q: ['첫번째', '두번째'] as unknown as string,
    });
    expect(filters.query).toBe('첫번째');
  });

  it('ageRange를 파싱한다', () => {
    const filters = parseSearchParams({
      age_min: '19',
      age_max: '34',
    });
    expect(filters.ageRange).toEqual({ min: 19, max: 34 });
  });

  it('occupation과 family를 파싱한다', () => {
    const filters = parseSearchParams({
      occupation: 'student',
      family: 'single',
    });
    expect(filters.occupation).toBe('student');
    expect(filters.familyStatus).toBe('single');
  });
});
