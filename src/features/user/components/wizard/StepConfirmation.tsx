'use client';

import type { ProfileWizardData } from '@/features/user/types';

interface StepConfirmationProps {
  wizardData: ProfileWizardData;
  onConfirm: () => void;
  onPrev: () => void;
  isSubmitting: boolean;
  error: string | null;
}

const OCCUPATION_LABELS: Record<string, string> = {
  employee: '직장인',
  'self-employed': '자영업자',
  student: '학생',
  unemployed: '미취업자',
  farmer: '농업/어업종사자',
  freelancer: '프리랜서',
  other: '기타',
};

const INCOME_LABELS: Record<string, string> = {
  'below-50': '중위소득 50% 이하',
  '50-80': '중위소득 50~80%',
  '80-100': '중위소득 80~100%',
  '100-150': '중위소득 100~150%',
  'above-150': '중위소득 150% 초과',
};

const GENDER_LABELS: Record<string, string> = {
  male: '남성',
  female: '여성',
  other: '기타',
};

const FAMILY_LABELS: Record<string, string> = {
  single: '미혼',
  married: '기혼',
  'single-parent': '한부모가정',
  multicultural: '다문화가정',
};

/**
 * 위자드 6단계: 입력 내용 확인
 */
export function StepConfirmation({
  wizardData,
  onConfirm,
  onPrev,
  isSubmitting,
  error,
}: StepConfirmationProps) {
  const { step1, step2, step3, step4, step5 } = wizardData;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">입력 내용 확인</h2>
        <p className="mt-1 text-sm text-gray-500">입력한 정보를 확인하고 저장해주세요.</p>
      </div>

      <div className="rounded-lg border border-gray-200 divide-y">
        <div className="flex justify-between p-4">
          <span className="text-sm text-gray-500">출생연도</span>
          <span className="text-sm font-medium text-gray-900">{step1.birthYear}년생</span>
        </div>
        <div className="flex justify-between p-4">
          <span className="text-sm text-gray-500">성별</span>
          <span className="text-sm font-medium text-gray-900">
            {GENDER_LABELS[step1.gender] ?? step1.gender}
          </span>
        </div>
        <div className="flex justify-between p-4">
          <span className="text-sm text-gray-500">직업</span>
          <span className="text-sm font-medium text-gray-900">
            {OCCUPATION_LABELS[step2.occupation] ?? step2.occupation}
          </span>
        </div>
        <div className="flex justify-between p-4">
          <span className="text-sm text-gray-500">연 소득</span>
          <span className="text-sm font-medium text-gray-900">
            {INCOME_LABELS[step2.incomeLevel] ?? step2.incomeLevel}
          </span>
        </div>
        <div className="flex justify-between p-4">
          <span className="text-sm text-gray-500">거주 지역</span>
          <span className="text-sm font-medium text-gray-900">{step3.regionId}</span>
        </div>
        <div className="flex justify-between p-4">
          <span className="text-sm text-gray-500">혼인 상태</span>
          <span className="text-sm font-medium text-gray-900">
            {FAMILY_LABELS[step4.familyStatus] ?? step4.familyStatus}
          </span>
        </div>
        {step4.hasChildren && (
          <div className="flex justify-between p-4">
            <span className="text-sm text-gray-500">자녀 수</span>
            <span className="text-sm font-medium text-gray-900">{step4.childrenCount}명</span>
          </div>
        )}
        {(step5.isDisabled || step5.isVeteran) && (
          <div className="flex justify-between p-4">
            <span className="text-sm text-gray-500">특수 조건</span>
            <span className="text-sm font-medium text-gray-900">
              {[step5.isDisabled && '장애인', step5.isVeteran && '국가유공자']
                .filter(Boolean)
                .join(', ')}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={isSubmitting}
          className="flex-1 rounded-lg border border-gray-300 py-3 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          이전
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="flex-1 rounded-lg bg-blue-500 py-3 font-medium text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {isSubmitting ? '저장 중...' : '저장 완료'}
        </button>
      </div>
    </div>
  );
}
