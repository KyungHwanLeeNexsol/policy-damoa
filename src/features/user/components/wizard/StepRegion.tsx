'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { stepRegionSchema } from '@/features/user/schemas/profile';
import type { StepRegionData } from '@/features/user/types';

interface StepRegionProps {
  defaultValues?: Partial<StepRegionData>;
  onNext: (data: StepRegionData) => void;
  onPrev: () => void;
}

// 주요 지역 ID 매핑 (실제 DB region ID와 연동 필요)
const REGION_OPTIONS = [
  { value: 'seoul', label: '서울특별시' },
  { value: 'busan', label: '부산광역시' },
  { value: 'daegu', label: '대구광역시' },
  { value: 'incheon', label: '인천광역시' },
  { value: 'gwangju', label: '광주광역시' },
  { value: 'daejeon', label: '대전광역시' },
  { value: 'ulsan', label: '울산광역시' },
  { value: 'sejong', label: '세종특별자치시' },
  { value: 'gyeonggi', label: '경기도' },
  { value: 'gangwon', label: '강원도' },
  { value: 'chungbuk', label: '충청북도' },
  { value: 'chungnam', label: '충청남도' },
  { value: 'jeonbuk', label: '전라북도' },
  { value: 'jeonnam', label: '전라남도' },
  { value: 'gyeongbuk', label: '경상북도' },
  { value: 'gyeongnam', label: '경상남도' },
  { value: 'jeju', label: '제주특별자치도' },
];

/**
 * 위자드 3단계: 거주 지역 (시도 선택 → regionId로 저장)
 */
export function StepRegion({ defaultValues, onNext, onPrev }: StepRegionProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<StepRegionData>({
    resolver: zodResolver(stepRegionSchema),
    defaultValues: { parentRegionId: '', ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">거주 지역</h2>
        <p className="mt-1 text-sm text-gray-500">현재 거주하는 시도를 선택해주세요.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">시도</label>
        <select
          {...register('parentRegionId')}
          onChange={(e) => {
            setValue('parentRegionId', e.target.value);
            setValue('regionId', e.target.value);
          }}
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
        >
          <option value="">시도를 선택하세요</option>
          {REGION_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {errors.regionId && (
          <p className="mt-1 text-sm text-red-500">{errors.regionId.message}</p>
        )}
      </div>

      {/* regionId hidden field */}
      <input type="hidden" {...register('regionId')} />

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
