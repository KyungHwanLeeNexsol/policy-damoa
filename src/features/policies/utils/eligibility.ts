// @MX:WARN: [AUTO] matchEligibility - eligibilityCriteria JSONB 스키마 가변성
// @MX:REASON: 외부 API 두 곳에서 수집, 스키마 보장 불가 — 항상 방어적 파싱

import { z } from 'zod';

import type { Policy, UserProfile } from '@/types';

/**
 * 적격성 판단 결과 타입
 */
export interface EligibilityResult {
  label: string;
  status: 'eligible' | 'partial' | 'ineligible';
}

// eligibilityCriteria JSONB의 기대 스키마 (방어적 파싱)
const eligibilityCriteriaSchema = z
  .object({
    occupation: z.array(z.string()).optional(),
    ageRange: z
      .object({
        min: z.number(),
        max: z.number(),
      })
      .optional(),
    familyStatus: z.array(z.string()).optional(),
    region: z.array(z.string()).optional(),
  })
  .passthrough();

/**
 * 정책의 수급 자격 조건과 사용자 프로필을 비교하여 적격성을 판단한다.
 * eligibilityCriteria가 null/undefined이거나 비정형 데이터인 경우에도 에러 없이 처리한다.
 */
export function matchEligibility(policy: Policy, profile: UserProfile): EligibilityResult[] {
  const results: EligibilityResult[] = [];

  // null/undefined 방어
  if (!policy.eligibilityCriteria) {
    return results;
  }

  // Zod 방어적 파싱 — 실패 시 빈 배열 반환
  const parsed = eligibilityCriteriaSchema.safeParse(policy.eligibilityCriteria);
  if (!parsed.success) {
    return results;
  }

  const criteria = parsed.data;

  // 직업 매칭
  if (criteria.occupation && criteria.occupation.length > 0) {
    if (!profile.occupation) {
      results.push({ label: '직업', status: 'partial' });
    } else if (criteria.occupation.includes(profile.occupation)) {
      results.push({ label: '직업', status: 'eligible' });
    } else {
      results.push({ label: '직업', status: 'ineligible' });
    }
  }

  // 나이 매칭
  if (criteria.ageRange) {
    if (!profile.birthYear) {
      results.push({ label: '나이', status: 'partial' });
    } else {
      const currentYear = new Date().getFullYear();
      const age = currentYear - profile.birthYear;
      if (age >= criteria.ageRange.min && age <= criteria.ageRange.max) {
        results.push({ label: '나이', status: 'eligible' });
      } else {
        results.push({ label: '나이', status: 'ineligible' });
      }
    }
  }

  // 가족상태 매칭
  if (criteria.familyStatus && criteria.familyStatus.length > 0) {
    if (!profile.familyStatus) {
      results.push({ label: '가족상태', status: 'partial' });
    } else if (criteria.familyStatus.includes(profile.familyStatus)) {
      results.push({ label: '가족상태', status: 'eligible' });
    } else {
      results.push({ label: '가족상태', status: 'ineligible' });
    }
  }

  return results;
}
