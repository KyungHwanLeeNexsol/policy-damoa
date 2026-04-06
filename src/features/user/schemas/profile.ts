// 프로필 위자드 Zod 스키마 정의
import { z } from 'zod';

const currentYear = new Date().getFullYear();

// Step 1: 기본 정보
export const stepBasicInfoSchema = z.object({
  birthYear: z
    .number({ message: '출생연도를 입력해주세요.' })
    .int()
    .min(1900, '유효한 출생연도를 입력해주세요.')
    .max(currentYear, `출생연도는 ${currentYear}년 이하여야 합니다.`),
  gender: z.enum(['male', 'female', 'other'], {
    message: '성별을 선택해주세요.',
  }),
});

// Step 2: 직업 및 소득
export const stepOccupationSchema = z.object({
  occupation: z.enum(
    ['employee', 'self-employed', 'student', 'unemployed', 'farmer', 'freelancer', 'other'],
    { message: '직업을 선택해주세요.' }
  ),
  incomeLevel: z.enum(['below-50', '50-80', '80-100', '100-150', 'above-150'], {
    message: '소득 수준을 선택해주세요.',
  }),
});

// Step 3: 지역 선택
export const stepRegionSchema = z.object({
  regionId: z.string({ message: '거주 지역을 선택해주세요.' }).min(1, '거주 지역을 선택해주세요.'),
  parentRegionId: z.string().min(1, '시도를 선택해주세요.'),
});

// Step 4: 가구 상황
export const stepFamilySchema = z
  .object({
    familyStatus: z.enum(['single', 'married', 'single-parent', 'multicultural'], {
      message: '혼인 여부를 선택해주세요.',
    }),
    isPregnant: z.boolean().default(false),
    hasChildren: z.boolean().default(false),
    childrenCount: z.number().int().min(0).max(20).default(0),
  })
  .refine(
    (data) => {
      // 자녀 있음 선택 시 자녀 수 1명 이상
      if (data.hasChildren && data.childrenCount === 0) return false;
      return true;
    },
    { message: '자녀 수를 1명 이상 입력해주세요.', path: ['childrenCount'] }
  );

// Step 5: 특수 조건
export const stepSpecialConditionsSchema = z.object({
  isDisabled: z.boolean().default(false),
  isVeteran: z.boolean().default(false),
});

// 전체 프로필 스키마 (upsert 용)
export const profileUpsertSchema = z.object({
  birthYear: z.number().int().min(1900).max(currentYear),
  gender: z.enum(['male', 'female', 'other']),
  occupation: z.enum([
    'employee',
    'self-employed',
    'student',
    'unemployed',
    'farmer',
    'freelancer',
    'other',
  ]),
  incomeLevel: z.enum(['below-50', '50-80', '80-100', '100-150', 'above-150']),
  regionId: z.string().min(1),
  familyStatus: z.enum(['single', 'married', 'single-parent', 'multicultural']),
  isPregnant: z.boolean().default(false),
  hasChildren: z.boolean().default(false),
  childrenCount: z.number().int().min(0).max(20).default(0),
  isDisabled: z.boolean().default(false),
  isVeteran: z.boolean().default(false),
});

export type StepBasicInfoInput = z.infer<typeof stepBasicInfoSchema>;
export type StepOccupationInput = z.infer<typeof stepOccupationSchema>;
export type StepRegionInput = z.infer<typeof stepRegionSchema>;
export type StepFamilyInput = z.infer<typeof stepFamilySchema>;
export type StepSpecialConditionsInput = z.infer<typeof stepSpecialConditionsSchema>;
export type ProfileUpsertInput = z.infer<typeof profileUpsertSchema>;
