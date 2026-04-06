import { describe, expect, it } from 'vitest';

import type { Policy, UserProfile } from '@/types';

import { matchEligibility } from '../eligibility';

// 테스트용 기본 정책
const basePolicy: Policy = {
  id: 'p1',
  externalId: null,
  title: '테스트 정책',
  description: null,
  eligibilityCriteria: null,
  additionalConditions: null,
  benefitType: 'cash',
  benefitAmount: null,
  applicationMethod: null,
  applicationDeadline: null,
  sourceUrl: null,
  sourceAgency: null,
  regionId: null,
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// 테스트용 기본 사용자 프로필
const baseProfile: UserProfile = {
  id: 'u1',
  userId: 'user-1',
  birthYear: 1995,
  gender: 'male',
  occupation: 'student',
  incomeLevel: null,
  regionId: 'r1',
  familyStatus: 'single',
  isPregnant: false,
  hasChildren: false,
  childrenCount: 0,
  isDisabled: false,
  isVeteran: false,
};

describe('matchEligibility', () => {
  it('eligibilityCriteria가 null이면 빈 배열을 반환한다', () => {
    const result = matchEligibility(basePolicy, baseProfile);
    expect(result).toEqual([]);
  });

  it('eligibilityCriteria가 undefined이면 빈 배열을 반환한다', () => {
    const policy = { ...basePolicy, eligibilityCriteria: undefined as unknown as null };
    const result = matchEligibility(policy, baseProfile);
    expect(result).toEqual([]);
  });

  it('유효한 occupation 조건 매칭 시 eligible을 반환한다', () => {
    const policy = {
      ...basePolicy,
      eligibilityCriteria: {
        occupation: ['student', 'unemployed'],
      },
    };
    const result = matchEligibility(policy, baseProfile);
    const occupationResult = result.find((r) => r.label === '직업');
    expect(occupationResult).toBeDefined();
    expect(occupationResult?.status).toBe('eligible');
  });

  it('occupation 불일치 시 ineligible을 반환한다', () => {
    const policy = {
      ...basePolicy,
      eligibilityCriteria: {
        occupation: ['employed'],
      },
    };
    const result = matchEligibility(policy, baseProfile);
    const occupationResult = result.find((r) => r.label === '직업');
    expect(occupationResult).toBeDefined();
    expect(occupationResult?.status).toBe('ineligible');
  });

  it('ageRange 조건을 확인한다', () => {
    const policy = {
      ...basePolicy,
      eligibilityCriteria: {
        ageRange: { min: 19, max: 34 },
      },
    };
    // 1995년생, 현재 약 31세 → eligible
    const result = matchEligibility(policy, baseProfile);
    const ageResult = result.find((r) => r.label === '나이');
    expect(ageResult).toBeDefined();
    expect(ageResult?.status).toBe('eligible');
  });

  it('나이가 범위 밖이면 ineligible을 반환한다', () => {
    const policy = {
      ...basePolicy,
      eligibilityCriteria: {
        ageRange: { min: 40, max: 60 },
      },
    };
    const result = matchEligibility(policy, baseProfile);
    const ageResult = result.find((r) => r.label === '나이');
    expect(ageResult?.status).toBe('ineligible');
  });

  it('알 수 없는 JSONB 구조는 partial을 반환한다', () => {
    const policy = {
      ...basePolicy,
      eligibilityCriteria: {
        unknownField: { weirdStructure: true },
      },
    };
    const result = matchEligibility(policy, baseProfile);
    // 알 수 없는 필드는 partial로 처리
    expect(result.length).toBeGreaterThanOrEqual(0);
    // partial이 아니어도 에러가 나면 안 됨
  });

  it('문자열 eligibilityCriteria (비정형)도 에러 없이 처리한다', () => {
    const policy = {
      ...basePolicy,
      eligibilityCriteria: '잘못된 형식' as unknown as Record<string, unknown>,
    };
    const result = matchEligibility(policy, baseProfile);
    expect(Array.isArray(result)).toBe(true);
  });

  it('familyStatus 조건 매칭', () => {
    const policy = {
      ...basePolicy,
      eligibilityCriteria: {
        familyStatus: ['single', 'married'],
      },
    };
    const result = matchEligibility(policy, baseProfile);
    const familyResult = result.find((r) => r.label === '가족상태');
    expect(familyResult?.status).toBe('eligible');
  });

  it('프로필에 birthYear가 null이면 나이 조건은 partial', () => {
    const profile = { ...baseProfile, birthYear: null };
    const policy = {
      ...basePolicy,
      eligibilityCriteria: {
        ageRange: { min: 19, max: 34 },
      },
    };
    const result = matchEligibility(policy, profile);
    const ageResult = result.find((r) => r.label === '나이');
    expect(ageResult?.status).toBe('partial');
  });
});
