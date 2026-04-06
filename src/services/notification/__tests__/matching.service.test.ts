import { describe, it, expect, vi, beforeEach } from 'vitest';
import { matchUserToPolicy, matchPoliciesForUsers } from '../matching.service';

// Prisma 모킹
vi.mock('@/lib/db', () => ({
  prisma: {
    userProfile: {
      findMany: vi.fn(),
    },
    policy: {
      findMany: vi.fn(),
    },
    matchingResult: {
      upsert: vi.fn(),
    },
  },
}));

const baseProfile = {
  userId: 'user-1',
  birthYear: 2000, // 26세
  occupation: 'student',
  incomeLevel: 'below-50',
  regionId: 'seoul-gangnam',
  familyStatus: 'single',
  hasChildren: false,
  isDisabled: false,
  isVeteran: false,
};

describe('matchUserToPolicy', () => {
  it('조건 없는 정책은 모든 사용자에게 매칭된다', () => {
    const result = matchUserToPolicy(baseProfile, {
      id: 'policy-1',
      eligibilityCriteria: null,
      regionId: null,
    });
    expect(result.matched).toBe(true);
    expect(result.matchedCriteria).toContain('no-criteria');
  });

  it('지역 일치 시 매칭된다', () => {
    const result = matchUserToPolicy(baseProfile, {
      id: 'policy-1',
      eligibilityCriteria: { regionIds: ['seoul-gangnam'] },
      regionId: null,
    });
    expect(result.matched).toBe(true);
    expect(result.matchedCriteria).toContain('region');
  });

  it('지역 불일치 시 매칭되지 않는다', () => {
    const result = matchUserToPolicy(baseProfile, {
      id: 'policy-1',
      eligibilityCriteria: { regionIds: ['busan-haeundae'] },
      regionId: null,
    });
    expect(result.matched).toBe(false);
  });

  it('policy.regionId와 사용자 지역 불일치 시 매칭되지 않는다', () => {
    const result = matchUserToPolicy(baseProfile, {
      id: 'policy-1',
      eligibilityCriteria: null,
      regionId: 'busan-haeundae',
    });
    expect(result.matched).toBe(false);
  });

  it('연령 범위 내에 있으면 매칭된다', () => {
    const result = matchUserToPolicy(baseProfile, {
      id: 'policy-1',
      eligibilityCriteria: { ageMin: 19, ageMax: 34 },
      regionId: null,
    });
    expect(result.matched).toBe(true);
    expect(result.matchedCriteria).toContain('age');
  });

  it('연령 범위 밖이면 매칭 점수가 낮다', () => {
    const result = matchUserToPolicy(
      { ...baseProfile, birthYear: 1970 }, // 56세
      {
        id: 'policy-1',
        eligibilityCriteria: { ageMin: 19, ageMax: 34 },
        regionId: null,
      }
    );
    // 연령 조건 1개, 0점 = 0% = 매칭 안됨
    expect(result.score).toBe(0);
  });

  it('직업 조건 일치 시 매칭된다', () => {
    const result = matchUserToPolicy(baseProfile, {
      id: 'policy-1',
      eligibilityCriteria: { occupation: ['student', 'unemployed'] },
      regionId: null,
    });
    expect(result.matched).toBe(true);
    expect(result.matchedCriteria).toContain('occupation');
  });

  it('복합 조건에서 50% 이상 충족 시 매칭된다', () => {
    // 직업: student ✓, 소득: below-50 ✓, 장애: true X
    const result = matchUserToPolicy(baseProfile, {
      id: 'policy-1',
      eligibilityCriteria: {
        occupation: ['student'],
        incomeLevel: ['below-50'],
        isDisabled: true,
      },
      regionId: null,
    });
    expect(result.matched).toBe(true); // 2/3 = 66% >= 50%
  });

  it('빈 eligibilityCriteria 객체는 조건 없음으로 처리', () => {
    const result = matchUserToPolicy(baseProfile, {
      id: 'policy-1',
      eligibilityCriteria: {},
      regionId: null,
    });
    expect(result.matched).toBe(true);
  });
});

describe('matchPoliciesForUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('사용자와 정책을 매칭하여 결과를 저장한다', async () => {
    const { prisma } = await import('@/lib/db');

    vi.mocked(prisma.userProfile.findMany).mockResolvedValue([
      {
        userId: 'user-1',
        birthYear: 2000,
        occupation: 'student',
        incomeLevel: 'below-50',
        regionId: 'seoul',
        familyStatus: 'single',
        hasChildren: false,
        isDisabled: false,
        isVeteran: false,
      } as never,
    ]);

    vi.mocked(prisma.policy.findMany).mockResolvedValue([
      {
        id: 'policy-1',
        eligibilityCriteria: { occupation: ['student'] },
        regionId: null,
      } as never,
    ]);

    vi.mocked(prisma.matchingResult.upsert).mockResolvedValue({} as never);

    const result = await matchPoliciesForUsers();

    expect(result.matched).toBe(1);
    expect(prisma.matchingResult.upsert).toHaveBeenCalledOnce();
  });

  it('지역 불일치 사용자는 매칭되지 않는다', async () => {
    const { prisma } = await import('@/lib/db');

    vi.mocked(prisma.userProfile.findMany).mockResolvedValue([
      {
        userId: 'user-1',
        birthYear: null,
        occupation: null,
        incomeLevel: null,
        regionId: 'busan',
        familyStatus: null,
        hasChildren: false,
        isDisabled: false,
        isVeteran: false,
      } as never,
    ]);
    vi.mocked(prisma.policy.findMany).mockResolvedValue([
      { id: 'policy-1', eligibilityCriteria: null, regionId: 'seoul' } as never,
    ]);

    const result = await matchPoliciesForUsers();

    expect(result.matched).toBe(0);
    expect(prisma.matchingResult.upsert).not.toHaveBeenCalled();
  });
});
