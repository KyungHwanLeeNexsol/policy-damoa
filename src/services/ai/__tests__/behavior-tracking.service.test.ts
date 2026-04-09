// behavior-tracking.service 단위 테스트 (SPEC-AI-001 M1)
// AC-001, AC-004, AC-005 검증: fire-and-forget, 비차단, 에러 무시

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Prisma 모듈 목업 (vi.hoisted: vi.mock 팩토리 호이스팅보다 먼저 평가됨)
const { mockPolicyViewCreate, mockSearchLogCreate, mockPolicyViewFindMany, mockSearchLogFindMany } =
  vi.hoisted(() => ({
    mockPolicyViewCreate: vi.fn(),
    mockSearchLogCreate: vi.fn(),
    mockPolicyViewFindMany: vi.fn(),
    mockSearchLogFindMany: vi.fn(),
  }));

vi.mock('@/lib/db', () => ({
  prisma: {
    policyView: {
      create: mockPolicyViewCreate,
      findMany: mockPolicyViewFindMany,
    },
    searchLog: {
      create: mockSearchLogCreate,
      findMany: mockSearchLogFindMany,
    },
  },
}));

// Redis 모듈 목업
const { mockRedisGet, mockRedisSet, mockRedisDel } = vi.hoisted(() => ({
  mockRedisGet: vi.fn(),
  mockRedisSet: vi.fn(),
  mockRedisDel: vi.fn(),
}));

vi.mock('@/lib/redis', () => ({
  getRedis: vi.fn(),
}));

vi.mock('@/lib/cache-ttl', () => ({
  CACHE_TTL: {
    RECOMMENDATIONS: 3600,
    SIMILAR_POLICIES: 21600,
    BEHAVIOR_RECENT: 1800,
  },
}));

import { getRedis } from '@/lib/redis';

import { getRecentBehavior, trackPolicyView, trackSearch } from '../behavior-tracking.service';

const mockRedis = {
  get: mockRedisGet,
  set: mockRedisSet,
  del: mockRedisDel,
};

describe('behavior-tracking.service — trackPolicyView', () => {
  beforeEach(() => {
    vi.mocked(getRedis).mockReturnValue(mockRedis as never);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('인증 사용자의 정책 조회를 PolicyView에 기록해야 한다 (AC-001)', async () => {
    mockPolicyViewCreate.mockResolvedValue({ id: 'view-1' });

    await trackPolicyView('user-1', 'policy-1', 'recommendation');

    expect(mockPolicyViewCreate).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        policyId: 'policy-1',
        source: 'recommendation',
      },
    });
  });

  it('DB 오류가 발생해도 예외를 던지지 않아야 한다 (AC-005)', async () => {
    mockPolicyViewCreate.mockRejectedValue(new Error('DB 다운'));

    await expect(trackPolicyView('user-1', 'policy-1', 'detail')).resolves.toBeUndefined();
  });

  it('성공 시 최근 행동 캐시를 무효화해야 한다 (AC-003)', async () => {
    mockPolicyViewCreate.mockResolvedValue({ id: 'view-1' });
    mockRedisDel.mockResolvedValue(1);

    await trackPolicyView('user-1', 'policy-1', 'detail');

    expect(mockRedisDel).toHaveBeenCalledWith('behavior:user:user-1:recent');
  });
});

describe('behavior-tracking.service — trackSearch', () => {
  beforeEach(() => {
    vi.mocked(getRedis).mockReturnValue(mockRedis as never);
    vi.clearAllMocks();
  });

  it('검색 쿼리와 필터를 SearchLog에 저장해야 한다 (AC-004)', async () => {
    mockSearchLogCreate.mockResolvedValue({ id: 'search-1' });

    await trackSearch('user-1', '청년 창업', { category: 'STARTUP' });

    expect(mockSearchLogCreate).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        query: '청년 창업',
        filters: { category: 'STARTUP' },
      },
    });
  });

  it('userId가 null이면 익명 검색으로 저장해야 한다', async () => {
    mockSearchLogCreate.mockResolvedValue({ id: 'search-1' });

    await trackSearch(null, '복지', undefined);

    expect(mockSearchLogCreate).toHaveBeenCalledWith({
      data: {
        userId: null,
        query: '복지',
        filters: undefined,
      },
    });
  });

  it('DB 오류가 발생해도 예외를 던지지 않아야 한다 (AC-005)', async () => {
    mockSearchLogCreate.mockRejectedValue(new Error('DB 다운'));

    await expect(trackSearch('user-1', '복지', null)).resolves.toBeUndefined();
  });
});

describe('behavior-tracking.service — getRecentBehavior', () => {
  beforeEach(() => {
    vi.mocked(getRedis).mockReturnValue(mockRedis as never);
    vi.clearAllMocks();
  });

  it('Redis 캐시가 있으면 캐시를 반환해야 한다', async () => {
    const cached = { views: [{ policyId: 'p1' }], searches: [{ query: 'q1' }] };
    mockRedisGet.mockResolvedValue(cached);

    const result = await getRecentBehavior('user-1');

    expect(result).toEqual(cached);
    expect(mockRedisGet).toHaveBeenCalledWith('behavior:user:user-1:recent');
    expect(mockPolicyViewFindMany).not.toHaveBeenCalled();
  });

  it('캐시 미스 시 DB에서 최근 조회/검색을 가져와야 한다', async () => {
    mockRedisGet.mockResolvedValue(null);
    mockPolicyViewFindMany.mockResolvedValue([
      { policyId: 'p1', source: 'detail', viewedAt: new Date() },
    ]);
    mockSearchLogFindMany.mockResolvedValue([
      { query: 'q1', filters: null, searchedAt: new Date() },
    ]);
    mockRedisSet.mockResolvedValue('OK');

    const result = await getRecentBehavior('user-1');

    expect(result.views).toHaveLength(1);
    expect(result.searches).toHaveLength(1);
    expect(mockPolicyViewFindMany).toHaveBeenCalled();
    expect(mockSearchLogFindMany).toHaveBeenCalled();
  });

  it('Redis가 null이어도 DB에서 결과를 반환해야 한다 (graceful degradation)', async () => {
    vi.mocked(getRedis).mockReturnValue(null);
    mockPolicyViewFindMany.mockResolvedValue([]);
    mockSearchLogFindMany.mockResolvedValue([]);

    const result = await getRecentBehavior('user-1');

    expect(result).toEqual({ views: [], searches: [] });
  });

  it('DB 오류가 발생하면 빈 결과를 반환해야 한다 (AC-005)', async () => {
    mockRedisGet.mockResolvedValue(null);
    mockPolicyViewFindMany.mockRejectedValue(new Error('DB 다운'));
    mockSearchLogFindMany.mockResolvedValue([]);

    const result = await getRecentBehavior('user-1');

    expect(result).toEqual({ views: [], searches: [] });
  });
});
