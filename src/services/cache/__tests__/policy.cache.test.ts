// policy.cache 단위 테스트
// Redis graceful degradation 검증

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Redis 모듈 목업
const mockGet = vi.fn();
const mockSet = vi.fn();
const mockDel = vi.fn();
const mockScan = vi.fn();

vi.mock('@/lib/redis', () => ({
  getRedis: vi.fn(),
}));

import { getRedis } from '@/lib/redis';

import {
  getCachedApiResponse,
  getCachedPolicyDetail,
  getCachedPolicyList,
  invalidatePolicyCaches,
  setCachedApiResponse,
  setCachedPolicyDetail,
  setCachedPolicyList,
} from '../policy.cache';

const mockRedis = {
  get: mockGet,
  set: mockSet,
  del: mockDel,
  scan: mockScan,
};

describe('policy.cache — Redis 연결 성공', () => {
  beforeEach(() => {
    vi.mocked(getRedis).mockReturnValue(mockRedis as never);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // API 응답 캐시
  it('getCachedApiResponse가 캐시된 데이터를 반환해야 한다', async () => {
    const mockData = { items: [{ id: '1' }], totalCount: 1 };
    mockGet.mockResolvedValue(mockData);

    const result = await getCachedApiResponse('PUBLIC_DATA_PORTAL', 1);
    expect(result).toEqual(mockData);
    expect(mockGet).toHaveBeenCalledWith('api:PUBLIC_DATA_PORTAL:page:1');
  });

  it('setCachedApiResponse가 TTL 6시간으로 저장해야 한다', async () => {
    mockSet.mockResolvedValue('OK');
    const data = { items: [], totalCount: 0 };

    await setCachedApiResponse('PUBLIC_DATA_PORTAL', 1, data);
    expect(mockSet).toHaveBeenCalledWith(
      'api:PUBLIC_DATA_PORTAL:page:1',
      data,
      { ex: 6 * 60 * 60 },
    );
  });

  // 정책 목록 캐시
  it('getCachedPolicyList가 캐시된 데이터를 반환해야 한다', async () => {
    const mockData = { policies: [{ id: '1' }] };
    mockGet.mockResolvedValue(mockData);

    const result = await getCachedPolicyList('abc123');
    expect(result).toEqual(mockData);
    expect(mockGet).toHaveBeenCalledWith('policy:list:filter:abc123');
  });

  it('setCachedPolicyList가 TTL 15분으로 저장해야 한다', async () => {
    mockSet.mockResolvedValue('OK');
    await setCachedPolicyList('abc123', { data: [] });
    expect(mockSet).toHaveBeenCalledWith(
      'policy:list:filter:abc123',
      { data: [] },
      { ex: 15 * 60 },
    );
  });

  // 정책 상세 캐시
  it('getCachedPolicyDetail이 캐시된 데이터를 반환해야 한다', async () => {
    const mockData = { id: 'pol-001', title: '테스트 정책' };
    mockGet.mockResolvedValue(mockData);

    const result = await getCachedPolicyDetail('pol-001');
    expect(result).toEqual(mockData);
    expect(mockGet).toHaveBeenCalledWith('policy:detail:pol-001');
  });

  it('setCachedPolicyDetail이 TTL 30분으로 저장해야 한다', async () => {
    mockSet.mockResolvedValue('OK');
    await setCachedPolicyDetail('pol-001', { title: '정책' });
    expect(mockSet).toHaveBeenCalledWith(
      'policy:detail:pol-001',
      { title: '정책' },
      { ex: 30 * 60 },
    );
  });

  // 캐시 무효화
  it('invalidatePolicyCaches가 정책 캐시를 삭제해야 한다', async () => {
    mockScan.mockResolvedValue([0, ['policy:list:filter:a', 'policy:list:filter:b']]);
    mockDel.mockResolvedValue(2);

    await invalidatePolicyCaches();
    expect(mockScan).toHaveBeenCalled();
  });
});

describe('policy.cache — Redis 연결 실패 (graceful degradation)', () => {
  beforeEach(() => {
    vi.mocked(getRedis).mockReturnValue(null);
    vi.clearAllMocks();
  });

  it('Redis가 null이면 getCachedApiResponse는 null을 반환해야 한다', async () => {
    const result = await getCachedApiResponse('PUBLIC_DATA_PORTAL', 1);
    expect(result).toBeNull();
  });

  it('Redis가 null이면 setCachedApiResponse는 조용히 종료해야 한다', async () => {
    await expect(
      setCachedApiResponse('PUBLIC_DATA_PORTAL', 1, {}),
    ).resolves.toBeUndefined();
  });

  it('Redis가 null이면 getCachedPolicyList는 null을 반환해야 한다', async () => {
    const result = await getCachedPolicyList('hash');
    expect(result).toBeNull();
  });

  it('Redis가 null이면 getCachedPolicyDetail은 null을 반환해야 한다', async () => {
    const result = await getCachedPolicyDetail('id');
    expect(result).toBeNull();
  });

  it('Redis가 null이면 invalidatePolicyCaches는 조용히 종료해야 한다', async () => {
    await expect(invalidatePolicyCaches()).resolves.toBeUndefined();
  });
});

describe('policy.cache — Redis 오류 처리', () => {
  beforeEach(() => {
    const errorRedis = {
      get: vi.fn().mockRejectedValue(new Error('Redis 연결 끊김')),
      set: vi.fn().mockRejectedValue(new Error('Redis 연결 끊김')),
      del: vi.fn().mockRejectedValue(new Error('Redis 연결 끊김')),
      scan: vi.fn().mockRejectedValue(new Error('Redis 연결 끊김')),
    };
    vi.mocked(getRedis).mockReturnValue(errorRedis as never);
    vi.clearAllMocks();
  });

  it('get 에러 시 null을 반환해야 한다', async () => {
    const result = await getCachedApiResponse('PUBLIC_DATA_PORTAL', 1);
    expect(result).toBeNull();
  });

  it('set 에러 시 조용히 종료해야 한다', async () => {
    await expect(
      setCachedApiResponse('PUBLIC_DATA_PORTAL', 1, {}),
    ).resolves.toBeUndefined();
  });

  it('invalidate 에러 시 조용히 종료해야 한다', async () => {
    await expect(invalidatePolicyCaches()).resolves.toBeUndefined();
  });
});
