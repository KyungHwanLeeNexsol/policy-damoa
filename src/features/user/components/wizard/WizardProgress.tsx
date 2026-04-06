interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
}

const STEP_LABELS = ['기본 정보', '직업/소득', '거주 지역', '가족 현황', '특수 조건', '확인'];

/**
 * 위자드 진행률 표시 컴포넌트
 */
export function WizardProgress({ currentStep, totalSteps }: WizardProgressProps) {
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="mb-8">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          {currentStep}단계 / {totalSteps}단계
        </span>
        <span className="text-sm text-gray-500">{progressPercent}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <div className="mt-4 flex justify-between">
        {STEP_LABELS.map((label, idx) => {
          const step = idx + 1;
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;

          return (
            <div key={step} className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  isCompleted
                    ? 'bg-blue-500 text-white'
                    : isCurrent
                      ? 'border-2 border-blue-500 text-blue-500'
                      : 'bg-gray-200 text-gray-400'
                }`}
              >
                {isCompleted ? '✓' : step}
              </div>
              <span className={`mt-1 text-xs ${isCurrent ? 'text-blue-500 font-medium' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
