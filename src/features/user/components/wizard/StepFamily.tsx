'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { stepFamilySchema } from '@/features/user/schemas/profile';
import type { StepFamilyData } from '@/features/user/types';

interface StepFamilyProps {
  defaultValues?: Partial<StepFamilyData>;
  onNext: (data: StepFamilyData) => void;
  onPrev: () => void;
}

const FAMILY_STATUS_OPTIONS = [
  { value: 'single', label: '미혼' },
  { value: 'married', label: '기혼' },
  { value: 'single-parent', label: '한부모가정' },
  { value: 'multicultural', label: '다문화가정' },
];

/**
 * 위자드 4단계: 가족 현황
 */
export function StepFamily({ defaultValues, onNext, onPrev }: StepFamilyProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<StepFamilyData>({
    resolver: zodResolver(stepFamilySchema),
    defaultValues: {
      familyStatus: 'single',
      isPregnant: false,
      hasChildren: false,
      childrenCount: 0,
      ...defaultValues,
    },
  });

  const hasChildren = useWatch({ control, name: 'hasChildren' });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">가족 현황</h2>
        <p className="mt-1 text-sm text-gray-500">가족 관계 현황을 선택해주세요.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">혼인 상태</label>
        <select
          {...register('familyStatus')}
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
        >
          {FAMILY_STATUS_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" {...register('isPregnant')} className="h-4 w-4 rounded" />
          <span className="text-sm text-gray-700">임신 중</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" {...register('hasChildren')} className="h-4 w-4 rounded" />
          <span className="text-sm text-gray-700">자녀 있음</span>
        </label>
      </div>

      {hasChildren && (
        <div>
          <label className="block text-sm font-medium text-gray-700">자녀 수</label>
          <input
            type="number"
            min={1}
            max={10}
            {...register('childrenCount', { valueAsNumber: true })}
            className="mt-1 w-32 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
          />
          {errors.childrenCount && (
            <p className="mt-1 text-sm text-red-500">{errors.childrenCount.message}</p>
          )}
        </div>
      )}

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
