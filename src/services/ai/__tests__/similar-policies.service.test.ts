// similar-policies.service 단위 테스트 (SPEC-AI-001 M2)
// AC-017~019 검증: 사전 필터, AI 재순위, 6시간 캐시

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPolicyFindUnique, mockPolicyFindMany, mockGeminiCreate, mockRedisGet, mockRedisSet } =
  vi.hoisted(() => ({
    mockPolicyFindUnique: vi.fn(),
    mockPolicyFindMany: vi.fn(),
    mockGeminiCreate: vi.fn(),
    mockRedisGet: vi.fn(),
    mockRedisSet: vi.fn(),
  }));

vi.mock('@/lib/db', () => ({
  prisma: {
    policy: {
      findUnique: mockPolicyFindUnique,
      findMany: mockPolicyFindMany,
    },
  },
}));

vi.mock('@/lib/openai', () => ({
  default: {
    chat: { completions: { create: mockGeminiCreate } },
  },
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

import { getSimilarPolicies } from '../similar-policies.service';

const mockRedis = { get: mockRedisGet, set: mockRedisSet };

const sourcePolicy = {
  id: 'p-source',
  title: '청년 창업 지원',
  regionId: 'region-seoul',
  applicationDeadline: new Date('2026-12-31'),
  categories: [{ category: { id: 'c1', name: 'STARTUP' } }],
};

const candidates = Array.from({ length: 20 }, (_, i) => ({
  id: `p${i}`,
  title: `유사 정책 ${i}`,
  description: '설명',
  regionId: 'region-seoul',
  applicationDeadline: new Date('2026-11-30'),
  categories: [{ category: { id: 'c1', name: 'STARTUP' } }],
}));

describe('getSimilarPolicies — 캐시 히트 (AC-019)', () => {
  beforeEach(() => {
    vi.mocked(getRedis).mockReturnValue(mockRedis as never);
    vi.clearAllMocks();
  });

  afterEach(() => vi.restoreAllMocks());

  it('캐시가 있으면 Gemini 나 DB 를 호출하지 않아야 한다', async () => {
    mockRedisGet.mockResolvedValue([
      { id: 'p1', title: '캐시된 유사 정책', category: 'STARTUP', region: 'seoul', deadline: null },
    ]);

    const result = await getSimilarPolicies('p-source');

    expect(result).toHaveLength(1);
    expect(mockGeminiCreate).not.toHaveBeenCalled();
    expect(mockPolicyFindUnique).not.toHaveBeenCalled();
  });
});

describe('getSimilarPolicies — 캐시 미스 + 사전필터 + AI 재순위 (AC-017, AC-018)', () => {
  beforeEach(() => {
    vi.mocked(getRedis).mockReturnValue(mockRedis as never);
    vi.clearAllMocks();
    mockRedisGet.mockResolvedValue(null);
    mockPolicyFindUnique.mockResolvedValue(sourcePolicy);
    mockPolicyFindMany.mockResolvedValue(candidates);
    mockRedisSet.mockResolvedValue('OK');
  });

  it('category OR region 사전필터로 최대 20개 후보를 조회해야 한다', async () => {
    mockGeminiCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              similar: [
                { policyId: 'p0', score: 0.9, rank: 1 },
                { policyId: 'p1', score: 0.85, rank: 2 },
              ],
            }),
          },
        },
      ],
      usage: { total_tokens: 300 },
    });

    const result = await getSimilarPolicies('p-source', 5);

    expect(mockPolicyFindMany).toHaveBeenCalled();
    const findArgs = mockPolicyFindMany.mock.calls[0]?.[0] as { take?: number };
    expect(findArgs?.take).toBe(20);
    expect(result.length).toBeGreaterThan(0);
  });

  it('6시간 TTL (21600) 로 캐시해야 한다 (AC-019)', async () => {
    mockGeminiCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({ similar: [{ policyId: 'p0', score: 0.9, rank: 1 }] }),
          },
        },
      ],
      usage: { total_tokens: 100 },
    });

    await getSimilarPolicies('p-source');

    expect(mockRedisSet).toHaveBeenCalledWith('similar:policy:p-source', expect.any(Array), {
      ex: 21600,
    });
  });

  it('원본 정책이 없으면 빈 배열을 반환해야 한다', async () => {
    mockPolicyFindUnique.mockResolvedValue(null);

    const result = await getSimilarPolicies('nonexistent');

    expect(result).toEqual([]);
    expect(mockGeminiCreate).not.toHaveBeenCalled();
  });
});

describe('getSimilarPolicies — Gemini 실패 시 폴백', () => {
  beforeEach(() => {
    vi.mocked(getRedis).mockReturnValue(mockRedis as never);
    vi.clearAllMocks();
    mockRedisGet.mockResolvedValue(null);
    mockPolicyFindUnique.mockResolvedValue(sourcePolicy);
    mockPolicyFindMany.mockResolvedValue(candidates.slice(0, 5));
    mockRedisSet.mockResolvedValue('OK');
  });

  it('Gemini 오류 시 DB 순서 그대로 폴백해야 한다', async () => {
    mockGeminiCreate.mockRejectedValue(new Error('Gemini down'));

    const result = await getSimilarPolicies('p-source', 5);

    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(5);
  });
});
