'use client';

import { useState } from 'react';
import type {
  ProfileWizardData,
  StepBasicInfoData,
  StepOccupationData,
  StepRegionData,
  StepFamilyData,
  StepSpecialConditionsData,
} from '@/features/user/types';

const TOTAL_STEPS = 6;

const defaultWizardData: ProfileWizardData = {
  step1: {
    birthYear: new Date().getFullYear() - 25,
    gender: 'male',
  },
  step2: {
    occupation: 'employee',
    incomeLevel: '80-100',
  },
  step3: {
    regionId: '',
    parentRegionId: '',
  },
  step4: {
    familyStatus: 'single',
    isPregnant: false,
    hasChildren: false,
    childrenCount: 0,
  },
  step5: {
    isDisabled: false,
    isVeteran: false,
  },
};

interface UseProfileWizardOptions {
  initialData?: Partial<ProfileWizardData>;
  onComplete?: (data: ProfileWizardData) => Promise<void>;
}

/**
 * 프로필 설정 위자드 상태 관리 훅
 */
export function useProfileWizard({ initialData, onComplete }: UseProfileWizardOptions = {}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<ProfileWizardData>({
    ...defaultWizardData,
    ...initialData,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStep1 = (data: StepBasicInfoData) => {
    setWizardData((prev) => ({ ...prev, step1: data }));
  };

  const updateStep2 = (data: StepOccupationData) => {
    setWizardData((prev) => ({ ...prev, step2: data }));
  };

  const updateStep3 = (data: StepRegionData) => {
    setWizardData((prev) => ({ ...prev, step3: data }));
  };

  const updateStep4 = (data: StepFamilyData) => {
    setWizardData((prev) => ({ ...prev, step4: data }));
  };

  const updateStep5 = (data: StepSpecialConditionsData) => {
    setWizardData((prev) => ({ ...prev, step5: data }));
  };

  const goNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const goPrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= TOTAL_STEPS) {
      setCurrentStep(step);
    }
  };

  const handleComplete = async () => {
    if (!onComplete) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onComplete(wizardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    currentStep,
    totalSteps: TOTAL_STEPS,
    wizardData,
    isSubmitting,
    error,
    updateStep1,
    updateStep2,
    updateStep3,
    updateStep4,
    updateStep5,
    goNext,
    goPrev,
    goToStep,
    handleComplete,
  };
}
