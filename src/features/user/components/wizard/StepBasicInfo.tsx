'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { stepBasicInfoSchema } from '@/features/user/schemas/profile';
import type { StepBasicInfoData } from '@/features/user/types';

interface StepBasicInfoProps {
  defaultValues?: Partial<StepBasicInfoData>;
  onNext: (data: StepBasicInfoData) => void;
}

const currentYear = new Date().getFullYear();

/**
 * 위자드 1단계: 기본 정보 (출생연도, 성별)
 */
export function StepBasicInfo({ defaultValues, onNext }: StepBasicInfoProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StepBasicInfoData>({
    resolver: zodResolver(stepBasicInfoSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">기본 정보</h2>
        <p className="mt-1 text-sm text-gray-500">출생연도와 성별을 입력해주세요.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">출생연도</label>
        <input
          type="number"
          min={1900}
          max={currentYear}
          {...register('birthYear', { valueAsNumber: true })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
          placeholder="예: 1990"
        />
        {errors.birthYear && (
          <p className="mt-1 text-sm text-red-500">{errors.birthYear.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">성별</label>
        <div className="mt-2 flex gap-4">
          {[
            { value: 'male', label: '남성' },
            { value: 'female', label: '여성' },
            { value: 'other', label: '기타' },
          ].map(({ value, label }) => (
            <label key={value} className="flex cursor-pointer items-center gap-2">
              <input type="radio" value={value} {...register('gender')} className="h-4 w-4" />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
        {errors.gender && <p className="mt-1 text-sm text-red-500">{errors.gender.message}</p>}
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-blue-500 py-3 font-medium text-white hover:bg-blue-600"
      >
        다음
      </button>
    </form>
  );
}
