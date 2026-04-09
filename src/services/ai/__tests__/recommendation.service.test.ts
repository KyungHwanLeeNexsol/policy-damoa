// recommendation.service 단위 테스트 (SPEC-AI-001 M2)
// AC-006~012 검증: 캐시 hit/miss, Gemini 호출, 폴백, 프로필 검증

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// --- vi.hoisted 로 목 변수 선언 ---
const {
  mockUserProfileFindUnique,
  mockPolicyFindMany,
  mockPolicyRecommendationDeleteMany,
  mockPolicyRecommendationCreateMany,
  mockPolicyRecommendationFindMany,
  mockDataSyncLogCreate,
  mockGeminiCreate,
  mockRedisGet,
  mockRedisSet,
  mockGetRecentBehavior,
} = vi.hoisted(() => ({
  mockUserProfileFindUnique: vi.fn(),
  mockPolicyFindMany: vi.fn(),
  mockPolicyRecommendationDeleteMany: vi.fn(),
  mockPolicyRecommendationCreateMany: vi.fn(),
  mockPolicyRecommendationFindMany: vi.fn(),
  mockDataSyncLogCreate: vi.fn(),
  mockGeminiCreate: vi.fn(),
  mockRedisGet: vi.fn(),
  mockRedisSet: vi.fn(),
  mockGetRecentBehavior: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    userProfile: { findUnique: mockUserProfileFindUnique },
    policy: { findMany: mockPolicyFindMany },
    policyRecommendation: {
      deleteMany: mockPolicyRecommendationDeleteMany,
      createMany: mockPolicyRecommendationCreateMany,
      findMany: mockPolicyRecommendationFindMany,
    },
    dataSyncLog: { create: mockDataSyncLogCreate },
  },
}));

vi.mock('@/lib/openai', () => ({
  default: {
    chat: {
      completions: {
        create: mockGeminiCreate,
      },
    },
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

vi.mock('@/services/ai/behavior-tracking.service', () => ({
  getRecentBehavior: mockGetRecentBehavior,
}));

import { getRedis } from '@/lib/redis';

import { ProfileIncompleteError, generateRecommendations } from '../recommendation.service';

const mockRedis = { get: mockRedisGet, set: mockRedisSet };

const profileComplete = {
  userId: 'user-1',
  birthYear: 1995,
  regionId: 'region-seoul',
  occupation: 'employed',
  incomeLevel: 'middle',
  familyStatus: 'single',
  hasChildren: false,
  isDisabled: false,
  isVeteran: false,
  gender: null,
  isPregnant: false,
  childrenCount: 0,
  additionalInfo: null,
};

const candidatePolicies = [
  {
    id: 'p1',
    title: '청년 창업 지원',
    description: '만 19-34세 창업',
    regionId: 'region-seoul',
    applicationDeadline: new Date('2026-12-31'),
    eligibilityCriteria: null,
    categories: [],
  },
  {
    id: 'p2',
    title: '주거 지원',
    description: '청년 월세',
    regionId: 'region-seoul',
    applicationDeadline: new Date('2026-10-31'),
    eligibilityCriteria: null,
    categories: [],
  },
];

function geminiResponse(
  recs: Array<{ policyId: string; score: number; rank: number; reason: string }>
) {
  return {
    choices: [
      {
        message: {
          content: JSON.stringify({ recommendations: recs }),
        },
      },
    ],
    usage: { total_tokens: 500 },
  };
}

describe('generateRecommendations — 캐시 히트 (AC-006)', () => {
  beforeEach(() => {
    vi.mocked(getRedis).mockReturnValue(mockRedis as never);
    vi.clearAllMocks();
    mockGetRecentBehavior.mockResolvedValue({ views: [], searches: [] });
  });

  afterEach(() => vi.restoreAllMocks());

  it('Redis 캐시가 있으면 Gemini 를 호출하지 않고 즉시 반환해야 한다', async () => {
    const cached = {
      recommendations: [{ policyId: 'p1', score: 0.9, rank: 1, reason: '캐시' }],
      generatedAt: new Date().toISOString(),
    };
    mockRedisGet.mockResolvedValue(cached);

    const result = await generateRecommendations('user-1');

    expect(result.cached).toBe(true);
    expect(result.recommendations).toHaveLength(1);
    expect(mockGeminiCreate).not.toHaveBeenCalled();
    expect(mockUserProfileFindUnique).not.toHaveBeenCalled();
  });
});

describe('generateRecommendations — 캐시 미스 + Gemini 성공 (AC-007, AC-008)', () => {
  beforeEach(() => {
    vi.mocked(getRedis).mockReturnValue(mockRedis as never);
    vi.clearAllMocks();
    mockRedisGet.mockResolvedValue(null);
    mockGetRecentBehavior.mockResolvedValue({ views: [], searches: [] });
    mockUserProfileFindUnique.mockResolvedValue(profileComplete);
    mockPolicyFindMany.mockResolvedValue(candidatePolicies);
    mockPolicyRecommendationDeleteMany.mockResolvedValue({ count: 0 });
    mockPolicyRecommendationCreateMany.mockResolvedValue({ count: 2 });
    mockRedisSet.mockResolvedValue('OK');
  });

  it('Gemini 를 호출하고 결과를 PolicyRecommendation 에 저장해야 한다', async () => {
    mockGeminiCreate.mockResolvedValue(
      geminiResponse([
        { policyId: 'p1', score: 0.9, rank: 1, reason: '청년 조건 일치' },
        { policyId: 'p2', score: 0.7, rank: 2, reason: '서울 지역' },
      ])
    );

    const result = await generateRecommendations('user-1');

    expect(result.cached).toBe(false);
    expect(result.recommendations).toHaveLength(2);
    expect(mockGeminiCreate).toHaveBeenCalledTimes(1);
    expect(mockPolicyRecommendationCreateMany).toHaveBeenCalled();
    expect(mockRedisSet).toHaveBeenCalledWith('recommendations:user:user-1', expect.any(Object), {
      ex: 3600,
    });
  });

  it('각 추천에 reason 필드가 200자 이하 한국어로 포함되어야 한다 (AC-008)', async () => {
    mockGeminiCreate.mockResolvedValue(
      geminiResponse([{ policyId: 'p1', score: 0.9, rank: 1, reason: '청년 조건 일치' }])
    );

    const result = await generateRecommendations('user-1');
    const reason = result.recommendations[0]?.reason ?? '';
    expect(reason.length).toBeLessThanOrEqual(200);
    expect(reason).toBe('청년 조건 일치');
  });
});

describe('generateRecommendations — Gemini 실패 → 폴백 (AC-009, AC-012)', () => {
  beforeEach(() => {
    vi.mocked(getRedis).mockReturnValue(mockRedis as never);
    vi.clearAllMocks();
    mockRedisGet.mockResolvedValue(null);
    mockGetRecentBehavior.mockResolvedValue({ views: [], searches: [] });
    mockUserProfileFindUnique.mockResolvedValue(profileComplete);
    mockPolicyFindMany.mockResolvedValue(candidatePolicies);
    mockPolicyRecommendationDeleteMany.mockResolvedValue({ count: 0 });
    mockPolicyRecommendationCreateMany.mockResolvedValue({ count: 2 });
    mockDataSyncLogCreate.mockResolvedValue({ id: 'log-1' });
    mockRedisSet.mockResolvedValue('OK');
  });

  it('Gemini 500 오류 시 규칙 기반 폴백으로 반환해야 한다', async () => {
    mockGeminiCreate.mockRejectedValue(new Error('Gemini 500'));

    const result = await generateRecommendations('user-1');

    expect(result.recommendations.length).toBeGreaterThan(0);
    // 폴백은 정적 reason 사용
    expect(result.recommendations[0]?.reason).toContain('프로필');
    expect(mockDataSyncLogCreate).toHaveBeenCalled();
  });

  it('Gemini JSON 이 Zod 검증 실패 시 폴백 사용 (AC-012)', async () => {
    mockGeminiCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ wrong: 'shape' }) } }],
      usage: { total_tokens: 100 },
    });

    const result = await generateRecommendations('user-1');

    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.recommendations[0]?.reason).toContain('프로필');
  });

  it('폴백 결과는 15분 단축 TTL 로 캐시되어야 한다', async () => {
    mockGeminiCreate.mockRejectedValue(new Error('fail'));

    await generateRecommendations('user-1');

    expect(mockRedisSet).toHaveBeenCalledWith('recommendations:user:user-1', expect.any(Object), {
      ex: 15 * 60,
    });
  });
});

describe('generateRecommendations — 프로필 불완전 (AC-010)', () => {
  beforeEach(() => {
    vi.mocked(getRedis).mockReturnValue(mockRedis as never);
    vi.clearAllMocks();
    mockRedisGet.mockResolvedValue(null);
    mockGetRecentBehavior.mockResolvedValue({ views: [], searches: [] });
  });

  it('birthYear 가 없으면 ProfileIncompleteError 를 던져야 한다', async () => {
    mockUserProfileFindUnique.mockResolvedValue({
      ...profileComplete,
      birthYear: null,
    });

    await expect(generateRecommendations('user-1')).rejects.toBeInstanceOf(ProfileIncompleteError);
  });

  it('regionId 가 없으면 ProfileIncompleteError 를 던져야 한다', async () => {
    mockUserProfileFindUnique.mockResolvedValue({
      ...profileComplete,
      regionId: null,
    });

    await expect(generateRecommendations('user-1')).rejects.toBeInstanceOf(ProfileIncompleteError);
  });

  it('UserProfile 이 없으면 ProfileIncompleteError 를 던져야 한다', async () => {
    mockUserProfileFindUnique.mockResolvedValue(null);

    await expect(generateRecommendations('user-1')).rejects.toBeInstanceOf(ProfileIncompleteError);
  });
});
