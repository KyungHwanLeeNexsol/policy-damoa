'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { stepSpecialConditionsSchema } from '@/features/user/schemas/profile';
import type { StepSpecialConditionsData } from '@/features/user/types';

interface StepSpecialConditionsProps {
  defaultValues?: Partial<StepSpecialConditionsData>;
  onNext: (data: StepSpecialConditionsData) => void;
  onPrev: () => void;
}

/**
 * 위자드 5단계: 특수 조건 (장애, 국가유공자)
 */
export function StepSpecialConditions({
  defaultValues,
  onNext,
  onPrev,
}: StepSpecialConditionsProps) {
  const { register, handleSubmit } = useForm<StepSpecialConditionsData>({
    resolver: zodResolver(stepSpecialConditionsSchema),
    defaultValues: {
      isDisabled: false,
      isVeteran: false,
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">특수 조건</h2>
        <p className="mt-1 text-sm text-gray-500">해당하는 항목을 선택해주세요.</p>
      </div>

      <div className="space-y-4">
        <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-gray-200 p-4 hover:bg-gray-50">
          <input type="checkbox" {...register('isDisabled')} className="mt-0.5 h-4 w-4 rounded" />
          <div>
            <p className="text-sm font-medium text-gray-900">장애인</p>
            <p className="text-sm text-gray-500">장애인등록증을 발급받은 분</p>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-gray-200 p-4 hover:bg-gray-50">
          <input type="checkbox" {...register('isVeteran')} className="mt-0.5 h-4 w-4 rounded" />
          <div>
            <p className="text-sm font-medium text-gray-900">국가유공자</p>
            <p className="text-sm text-gray-500">국가유공자 또는 그 유족</p>
          </div>
        </label>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onPrev}
          className="flex-1 rounded-lg border border-gray-300 py-3 font-medium text-gray-700 hover:bg-gray-50"
        >
          이전
        </button>
        <button
          type="submit"
          className="flex-1 rounded-lg bg-blue-500 py-3 font-medium text-white hover:bg-blue-600"
        >
          다음
        </button>
      </div>
    </form>
  );
}
