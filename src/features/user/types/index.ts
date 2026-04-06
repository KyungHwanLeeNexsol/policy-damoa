// 사용자 프로필 관련 타입 정의

export type DigestFrequency = 'immediate' | 'daily' | 'weekly';

export type FamilyStatus = 'single' | 'married' | 'single-parent' | 'multicultural';

export type Gender = 'male' | 'female' | 'other';

export type OccupationType =
  | 'employee'      // 직장인
  | 'self-employed' // 자영업자
  | 'student'       // 학생
  | 'unemployed'    // 미취업
  | 'farmer'        // 농업/어업
  | 'freelancer'    // 프리랜서
  | 'other';        // 기타

// 중위소득 기준 소득 수준
export type IncomeLevel =
  | 'below-50'  // 중위소득 50% 이하
  | '50-80'     // 중위소득 50~80%
  | '80-100'    // 중위소득 80~100%
  | '100-150'   // 중위소득 100~150%
  | 'above-150'; // 중위소득 150% 초과

// 위자드 각 단계 데이터 타입
export interface StepBasicInfoData {
  birthYear: number;
  gender: Gender;
}

export interface StepOccupationData {
  occupation: OccupationType;
  incomeLevel: IncomeLevel;
}

export interface StepRegionData {
  regionId: string;
  parentRegionId: string;
}

export interface StepFamilyData {
  familyStatus: FamilyStatus;
  isPregnant: boolean;
  hasChildren: boolean;
  childrenCount: number;
}

export interface StepSpecialConditionsData {
  isDisabled: boolean;
  isVeteran: boolean;
}

// 위자드 전체 폼 데이터 타입 (step1~step5 구조)
export interface ProfileWizardData {
  step1: StepBasicInfoData;
  step2: StepOccupationData;
  step3: StepRegionData;
  step4: StepFamilyData;
  step5: StepSpecialConditionsData;
}

// 위자드 단계 인덱스
export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

// DB 모델 타입 (Prisma 결과)
export interface UserProfileData {
  id: string;
  userId: string;
  birthYear: number;
  gender: string;
  occupation: string;
  incomeLevel: string;
  regionId: string;
  familyStatus: string;
  isPregnant: boolean;
  hasChildren: boolean;
  childrenCount: number;
  isDisabled: boolean;
  isVeteran: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Server Action 응답 타입
export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
