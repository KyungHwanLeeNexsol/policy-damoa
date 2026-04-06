import { beforeEach, describe, expect, it, vi } from 'vitest';

// 모듈 모킹 선언 (hoisting)
vi.mock('@/lib/db', () => ({
  prisma: {
    policy: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
    },
    region: {
      findMany: vi.fn(),
    },
    policyCategory: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/services/cache/policy.cache', () => ({
  getCachedPolicyList: vi.fn(),
  setCachedPolicyList: vi.fn(),
  getCachedPolicyDetail: vi.fn(),
  setCachedPolicyDetail: vi.fn(),
}));

import { prisma } from '@/lib/db';
import {
  getCachedPolicyDetail,
  getCachedPolicyList,
  setCachedPolicyDetail,
  setCachedPolicyList,
} from '@/services/cache/policy.cache';

import { getCategories, getPolicies, getPolicyById, getRegions } from '../policy.actions';

// 테스트용 정책 데이터
const mockPolicy = {
  id: 'policy-1',
  externalId: null,
  title: '청년 주거 지원',
  description: '청년을 위한 주거 지원 정책',
  eligibilityCriteria: null,
  additionalConditions: null,
  benefitType: 'cash',
  benefitAmount: '100만원',
  applicationMethod: '온라인',
  applicationDeadline: new Date('2025-12-31'),
  sourceUrl: null,
  sourceAgency: '국토교통부',
  regionId: 'region-1',
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
  categories: [
    {
      category: {
        id: 'cat-1',
        name: '주거·주택',
        slug: 'housing',
        description: null,
        icon: 'Home',
      },
    },
  ],
  region: { id: 'region-1', name: '서울', code: 'SEOUL', level: 1, parentId: null },
};

describe('getPolicies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('캐시에 데이터가 있으면 캐시에서 반환한다', async () => {
    const cachedData = {
      data: [mockPolicy],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    };
    vi.mocked(getCachedPolicyList).mockResolvedValue(cachedData);

    const result = await getPolicies({});

    expect(getCachedPolicyList).toHaveBeenCalled();
    expect(prisma.policy.findMany).not.toHaveBeenCalled();
    expect(result).toEqual(cachedData);
  });

  it('캐시 미스 시 Prisma에서 조회 후 캐시에 저장한다', async () => {
    vi.mocked(getCachedPolicyList).mockResolvedValue(null);
    vi.mocked(prisma.policy.findMany).mockResolvedValue([mockPolicy] as never);
    vi.mocked(prisma.policy.count).mockResolvedValue(1 as never);

    const result = await getPolicies({});

    expect(getCachedPolicyList).toHaveBeenCalled();
    expect(prisma.policy.findMany).toHaveBeenCalled();
    expect(prisma.policy.count).toHaveBeenCalled();
    expect(setCachedPolicyList).toHaveBeenCalled();
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it('page와 pageSize를 올바르게 처리한다', async () => {
    vi.mocked(getCachedPolicyList).mockResolvedValue(null);
    vi.mocked(prisma.policy.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.policy.count).mockResolvedValue(50 as never);

    const result = await getPolicies({ page: 2, pageSize: 10 });

    expect(prisma.policy.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      })
    );
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(10);
    expect(result.totalPages).toBe(5);
  });

  it('기본 page=1, pageSize=20을 사용한다', async () => {
    vi.mocked(getCachedPolicyList).mockResolvedValue(null);
    vi.mocked(prisma.policy.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.policy.count).mockResolvedValue(0 as never);

    await getPolicies({});

    expect(prisma.policy.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 20,
      })
    );
  });
});

describe('getPolicyById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('캐시에 데이터가 있으면 캐시에서 반환한다', async () => {
    vi.mocked(getCachedPolicyDetail).mockResolvedValue(mockPolicy);

    const result = await getPolicyById('policy-1');

    expect(getCachedPolicyDetail).toHaveBeenCalledWith('policy-1');
    expect(prisma.policy.findUnique).not.toHaveBeenCalled();
    expect(result).toEqual(mockPolicy);
  });

  it('캐시 미스 시 Prisma에서 조회 후 캐시에 저장한다', async () => {
    vi.mocked(getCachedPolicyDetail).mockResolvedValue(null);
    vi.mocked(prisma.policy.findUnique).mockResolvedValue(mockPolicy as never);

    const result = await getPolicyById('policy-1');

    expect(prisma.policy.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'policy-1' },
      })
    );
    expect(setCachedPolicyDetail).toHaveBeenCalledWith('policy-1', mockPolicy);
    expect(result).toEqual(mockPolicy);
  });

  it('존재하지 않는 정책은 null을 반환한다', async () => {
    vi.mocked(getCachedPolicyDetail).mockResolvedValue(null);
    vi.mocked(prisma.policy.findUnique).mockResolvedValue(null as never);

    const result = await getPolicyById('non-existent');

    expect(result).toBeNull();
    expect(setCachedPolicyDetail).not.toHaveBeenCalled();
  });
});

describe('getRegions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('시도 레벨(level=1) 지역 목록을 반환한다', async () => {
    const mockRegions = [
      { id: 'r1', name: '서울', code: 'SEOUL', level: 1, parentId: null },
      { id: 'r2', name: '부산', code: 'BUSAN', level: 1, parentId: null },
    ];
    vi.mocked(prisma.region.findMany).mockResolvedValue(mockRegions as never);

    const result = await getRegions();

    expect(prisma.region.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { level: 1 },
        orderBy: { name: 'asc' },
      })
    );
    expect(result).toEqual(mockRegions);
  });
});

describe('getCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('모든 카테고리를 반환한다', async () => {
    const mockCategories = [
      { id: 'c1', name: '주거·주택', slug: 'housing', description: null, icon: 'Home' },
    ];
    vi.mocked(prisma.policyCategory.findMany).mockResolvedValue(mockCategories as never);

    const result = await getCategories();

    expect(prisma.policyCategory.findMany).toHaveBeenCalled();
    expect(result).toEqual(mockCategories);
  });
});

// M7: 캐시 통합 검증
describe('캐시 통합 검증', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Redis가 null 반환 시(장애) Prisma 폴백으로 데이터를 반환한다', async () => {
    // getCachedPolicyList가 null 반환 (Redis 장애 시나리오)
    vi.mocked(getCachedPolicyList).mockResolvedValue(null);
    vi.mocked(prisma.policy.findMany).mockResolvedValue([mockPolicy] as never);
    vi.mocked(prisma.policy.count).mockResolvedValue(1 as never);

    const result = await getPolicies({});

    // Prisma가 호출되어야 함
    expect(prisma.policy.findMany).toHaveBeenCalled();
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('getCachedPolicyList가 정확한 캐시 키로 호출된다', async () => {
    vi.mocked(getCachedPolicyList).mockResolvedValue(null);
    vi.mocked(prisma.policy.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.policy.count).mockResolvedValue(0 as never);

    await getPolicies({ query: '주거', status: 'active' });
    await getPolicies({ status: 'active', query: '주거' });

    // 두 호출 모두 동일한 캐시 키로 조회해야 함
    const calls = vi.mocked(getCachedPolicyList).mock.calls;
    const firstCallKey = calls[0]?.[0];
    const secondCallKey = calls[1]?.[0];
    expect(firstCallKey).toBeDefined();
    expect(firstCallKey).toBe(secondCallKey);
  });
});
