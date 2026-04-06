'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { stepOccupationSchema } from '@/features/user/schemas/profile';
import type { StepOccupationData } from '@/features/user/types';

interface StepOccupationProps {
  defaultValues?: Partial<StepOccupationData>;
  onNext: (data: StepOccupationData) => void;
  onPrev: () => void;
}

const OCCUPATION_OPTIONS = [
  { value: 'employee', label: '직장인' },
  { value: 'self-employed', label: '자영업자' },
  { value: 'student', label: '학생' },
  { value: 'unemployed', label: '미취업자' },
  { value: 'farmer', label: '농업/어업종사자' },
  { value: 'freelancer', label: '프리랜서' },
  { value: 'other', label: '기타' },
];

const INCOME_OPTIONS = [
  { value: 'below-50', label: '중위소득 50% 이하' },
  { value: '50-80', label: '중위소득 50~80%' },
  { value: '80-100', label: '중위소득 80~100%' },
  { value: '100-150', label: '중위소득 100~150%' },
  { value: 'above-150', label: '중위소득 150% 초과' },
];

/**
 * 위자드 2단계: 직업 및 소득 수준
 */
export function StepOccupation({ defaultValues, onNext, onPrev }: StepOccupationProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StepOccupationData>({
    resolver: zodResolver(stepOccupationSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">직업 및 소득</h2>
        <p className="mt-1 text-sm text-gray-500">현재 직업과 연 소득 수준을 선택해주세요.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">직업</label>
        <select
          {...register('occupation')}
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
        >
          {OCCUPATION_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {errors.occupation && (
          <p className="mt-1 text-sm text-red-500">{errors.occupation.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">연 소득 수준</label>
        <select
          {...register('incomeLevel')}
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
        >
          {INCOME_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {errors.incomeLevel && (
          <p className="mt-1 text-sm text-red-500">{errors.incomeLevel.message}</p>
        )}
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
