import { describe, expect, it } from 'vitest';

import { buildCacheKey, buildOrderBy, buildPolicyWhere } from '../policy.queries';

describe('buildCacheKey', () => {
  it('동일한 필터를 다른 순서로 전달해도 동일한 해시를 반환한다', () => {
    const key1 = buildCacheKey({ query: '주거', categoryId: 'housing', status: 'active' }, 1, 20);
    const key2 = buildCacheKey({ status: 'active', query: '주거', categoryId: 'housing' }, 1, 20);
    expect(key1).toBe(key2);
  });

  it('빈 필터에 대해 유효한 해시를 반환한다', () => {
    const key = buildCacheKey({}, 1, 20);
    expect(key).toBeTruthy();
    expect(typeof key).toBe('string');
  });

  it('다른 페이지 번호는 다른 해시를 생성한다', () => {
    const key1 = buildCacheKey({ query: '주거' }, 1, 20);
    const key2 = buildCacheKey({ query: '주거' }, 2, 20);
    expect(key1).not.toBe(key2);
  });

  it('다른 pageSize는 다른 해시를 생성한다', () => {
    const key1 = buildCacheKey({ query: '주거' }, 1, 20);
    const key2 = buildCacheKey({ query: '주거' }, 1, 10);
    expect(key1).not.toBe(key2);
  });

  it('undefined 값이 포함된 필터는 해당 키를 무시한다', () => {
    const key1 = buildCacheKey({ query: '주거' }, 1, 20);
    const key2 = buildCacheKey({ query: '주거', categoryId: undefined }, 1, 20);
    expect(key1).toBe(key2);
  });
});

describe('buildPolicyWhere', () => {
  it('빈 필터에 대해 빈 where 절을 반환한다', () => {
    const where = buildPolicyWhere({});
    expect(where).toEqual({});
  });

  it('query 필터 시 title, description, sourceAgency에서 OR 검색한다', () => {
    const where = buildPolicyWhere({ query: '주거' });
    expect(where.OR).toBeDefined();
    expect(where.OR).toHaveLength(3);
    expect(where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: { contains: '주거', mode: 'insensitive' } }),
        expect.objectContaining({
          description: { contains: '주거', mode: 'insensitive' },
        }),
        expect.objectContaining({
          sourceAgency: { contains: '주거', mode: 'insensitive' },
        }),
      ])
    );
  });

  it('categoryId 필터 시 PolicyCategoryRelation을 통해 검색한다', () => {
    const where = buildPolicyWhere({ categoryId: 'housing' });
    expect(where.categories).toBeDefined();
    expect(where.categories).toEqual({
      some: { category: { slug: 'housing' } },
    });
  });

  it('regionCode 필터 시 region.code로 검색한다', () => {
    const where = buildPolicyWhere({ regionCode: 'SEOUL' });
    expect(where.region).toEqual({ code: 'SEOUL' });
  });

  it('status 필터를 직접 equals로 검색한다', () => {
    const where = buildPolicyWhere({ status: 'active' });
    expect(where.status).toBe('active');
  });

  it('benefitType 필터를 직접 equals로 검색한다', () => {
    const where = buildPolicyWhere({ benefitType: 'cash' });
    expect(where.benefitType).toBe('cash');
  });

  it('occupation 필터를 eligibilityCriteria JSONB path로 검색한다', () => {
    const where = buildPolicyWhere({ occupation: 'student' });
    expect(where.eligibilityCriteria).toBeDefined();
    expect(where.eligibilityCriteria).toEqual({
      path: ['occupation'],
      array_contains: 'student',
    });
  });

  it('여러 필터를 동시에 적용한다', () => {
    const where = buildPolicyWhere({
      query: '주거',
      status: 'active',
      regionCode: 'SEOUL',
    });
    expect(where.OR).toBeDefined();
    expect(where.status).toBe('active');
    expect(where.region).toEqual({ code: 'SEOUL' });
  });
});

describe('buildOrderBy', () => {
  it('sortBy가 없으면 newest(createdAt desc)를 반환한다', () => {
    const orderBy = buildOrderBy();
    expect(orderBy).toEqual({ createdAt: 'desc' });
  });

  it('newest는 createdAt desc를 반환한다', () => {
    const orderBy = buildOrderBy('newest');
    expect(orderBy).toEqual({ createdAt: 'desc' });
  });

  it('deadline은 applicationDeadline asc를 반환한다', () => {
    const orderBy = buildOrderBy('deadline');
    expect(orderBy).toEqual({ applicationDeadline: 'asc' });
  });

  it('relevance는 updatedAt desc를 반환한다 (기본 대체)', () => {
    const orderBy = buildOrderBy('relevance');
    expect(orderBy).toEqual({ updatedAt: 'desc' });
  });

  it('알 수 없는 sortBy는 newest로 폴백한다', () => {
    const orderBy = buildOrderBy('unknown');
    expect(orderBy).toEqual({ createdAt: 'desc' });
  });
});
