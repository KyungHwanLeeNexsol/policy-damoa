'use client';

import { useRouter } from 'next/navigation';
import { useProfileWizard } from '@/features/user/hooks/use-profile-wizard';
import { WizardProgress } from './wizard/WizardProgress';
import { StepBasicInfo } from './wizard/StepBasicInfo';
import { StepOccupation } from './wizard/StepOccupation';
import { StepRegion } from './wizard/StepRegion';
import { StepFamily } from './wizard/StepFamily';
import { StepSpecialConditions } from './wizard/StepSpecialConditions';
import { StepConfirmation } from './wizard/StepConfirmation';
import { saveProfile } from '@/features/user/actions/profile.actions';
import type { UserProfileData } from '@/features/user/types';

interface ProfileWizardProps {
  initialProfile?: UserProfileData | null;
}

/**
 * 프로필 설정 위자드 루트 컴포넌트
 */
export function ProfileWizard({ initialProfile }: ProfileWizardProps) {
  const router = useRouter();

  const {
    currentStep,
    totalSteps,
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
    handleComplete,
  } = useProfileWizard({
    initialData: initialProfile
      ? {
          step1: {
            birthYear: initialProfile.birthYear ?? new Date().getFullYear() - 25,
            gender: initialProfile.gender as 'male' | 'female' | 'other',
          },
          step2: {
            occupation: initialProfile.occupation as 'employee' | 'self-employed' | 'student' | 'unemployed' | 'farmer' | 'freelancer' | 'other',
            incomeLevel: initialProfile.incomeLevel as 'below-50' | '50-80' | '80-100' | '100-150' | 'above-150',
          },
          step3: { regionId: initialProfile.regionId ?? '', parentRegionId: initialProfile.regionId ?? '' },
          step4: {
            familyStatus: initialProfile.familyStatus as 'single' | 'married' | 'single-parent' | 'multicultural',
            isPregnant: initialProfile.isPregnant,
            hasChildren: initialProfile.hasChildren,
            childrenCount: initialProfile.childrenCount,
          },
          step5: {
            isDisabled: initialProfile.isDisabled,
            isVeteran: initialProfile.isVeteran,
          },
        }
      : undefined,
    onComplete: async (data) => {
      const result = await saveProfile({
        birthYear: data.step1.birthYear,
        gender: data.step1.gender,
        occupation: data.step2.occupation,
        incomeLevel: data.step2.incomeLevel,
        regionId: data.step3.regionId,
        familyStatus: data.step4.familyStatus,
        isPregnant: data.step4.isPregnant,
        hasChildren: data.step4.hasChildren,
        childrenCount: data.step4.childrenCount,
        isDisabled: data.step5.isDisabled,
        isVeteran: data.step5.isVeteran,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      router.push('/profile/notifications');
    },
  });

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <WizardProgress currentStep={currentStep} totalSteps={totalSteps} />

      <div className="mt-6">
        {currentStep === 1 && (
          <StepBasicInfo
            defaultValues={wizardData.step1}
            onNext={(data) => {
              updateStep1(data);
              goNext();
            }}
          />
        )}
        {currentStep === 2 && (
          <StepOccupation
            defaultValues={wizardData.step2}
            onNext={(data) => {
              updateStep2(data);
              goNext();
            }}
            onPrev={goPrev}
          />
        )}
        {currentStep === 3 && (
          <StepRegion
            defaultValues={wizardData.step3}
            onNext={(data) => {
              updateStep3(data);
              goNext();
            }}
            onPrev={goPrev}
          />
        )}
        {currentStep === 4 && (
          <StepFamily
            defaultValues={wizardData.step4}
            onNext={(data) => {
              updateStep4(data);
              goNext();
            }}
            onPrev={goPrev}
          />
        )}
        {currentStep === 5 && (
          <StepSpecialConditions
            defaultValues={wizardData.step5}
            onNext={(data) => {
              updateStep5(data);
              goNext();
            }}
            onPrev={goPrev}
          />
        )}
        {currentStep === 6 && (
          <StepConfirmation
            wizardData={wizardData}
            onConfirm={handleComplete}
            onPrev={goPrev}
            isSubmitting={isSubmitting}
            error={error}
          />
        )}
      </div>
    </div>
  );
}
