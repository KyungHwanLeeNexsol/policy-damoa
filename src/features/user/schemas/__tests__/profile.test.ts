import { describe, it, expect } from 'vitest';
import {
  stepBasicInfoSchema,
  stepOccupationSchema,
  stepRegionSchema,
  stepFamilySchema,
  stepSpecialConditionsSchema,
  profileUpsertSchema,
} from '../profile';

describe('stepBasicInfoSchema', () => {
  it('유효한 기본 정보를 통과시킨다', () => {
    const result = stepBasicInfoSchema.safeParse({ birthYear: 1990, gender: 'male' });
    expect(result.success).toBe(true);
  });

  it('미래 출생연도를 거부한다', () => {
    const result = stepBasicInfoSchema.safeParse({
      birthYear: new Date().getFullYear() + 1,
      gender: 'female',
    });
    expect(result.success).toBe(false);
  });

  it('1900년 이전 출생연도를 거부한다', () => {
    const result = stepBasicInfoSchema.safeParse({ birthYear: 1899, gender: 'male' });
    expect(result.success).toBe(false);
  });

  it('잘못된 성별 값을 거부한다', () => {
    const result = stepBasicInfoSchema.safeParse({ birthYear: 1990, gender: 'unknown' });
    expect(result.success).toBe(false);
  });
});

describe('stepOccupationSchema', () => {
  it('유효한 직업/소득을 통과시킨다', () => {
    const result = stepOccupationSchema.safeParse({
      occupation: 'student',
      incomeLevel: 'below-50',
    });
    expect(result.success).toBe(true);
  });

  it('잘못된 직업 값을 거부한다', () => {
    const result = stepOccupationSchema.safeParse({
      occupation: 'invalid-job',
      incomeLevel: 'below-50',
    });
    expect(result.success).toBe(false);
  });
});

describe('stepRegionSchema', () => {
  it('유효한 지역 정보를 통과시킨다', () => {
    const result = stepRegionSchema.safeParse({
      regionId: 'region-123',
      parentRegionId: 'parent-456',
    });
    expect(result.success).toBe(true);
  });

  it('빈 regionId를 거부한다', () => {
    const result = stepRegionSchema.safeParse({ regionId: '', parentRegionId: 'parent-456' });
    expect(result.success).toBe(false);
  });
});

describe('stepFamilySchema', () => {
  it('유효한 가구 상황을 통과시킨다', () => {
    const result = stepFamilySchema.safeParse({
      familyStatus: 'married',
      isPregnant: false,
      hasChildren: true,
      childrenCount: 2,
    });
    expect(result.success).toBe(true);
  });

  it('자녀 있음이지만 자녀 수 0명이면 거부한다', () => {
    const result = stepFamilySchema.safeParse({
      familyStatus: 'married',
      isPregnant: false,
      hasChildren: true,
      childrenCount: 0,
    });
    expect(result.success).toBe(false);
  });

  it('자녀 없으면 자녀 수 0 허용', () => {
    const result = stepFamilySchema.safeParse({
      familyStatus: 'single',
      isPregnant: false,
      hasChildren: false,
      childrenCount: 0,
    });
    expect(result.success).toBe(true);
  });
});

describe('stepSpecialConditionsSchema', () => {
  it('기본값으로 통과시킨다', () => {
    const result = stepSpecialConditionsSchema.safeParse({
      isDisabled: false,
      isVeteran: false,
    });
    expect(result.success).toBe(true);
  });
});

describe('profileUpsertSchema', () => {
  it('완전한 프로필 데이터를 통과시킨다', () => {
    const result = profileUpsertSchema.safeParse({
      birthYear: 1990,
      gender: 'male',
      occupation: 'employee',
      incomeLevel: '80-100',
      regionId: 'region-123',
      familyStatus: 'single',
      isPregnant: false,
      hasChildren: false,
      childrenCount: 0,
      isDisabled: false,
      isVeteran: false,
    });
    expect(result.success).toBe(true);
  });
});
