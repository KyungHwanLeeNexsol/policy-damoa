// @MX:ANCHOR fan_in:3 매칭 엔진 핵심 서비스 - Cron Job, 테스트, 향후 API에서 호출됨
import prisma from '@/lib/db';

interface EligibilityCriteria {
  ageMin?: number;
  ageMax?: number;
  occupation?: string[];
  incomeLevel?: string[];
  regionIds?: string[];
  familyStatus?: string[];
  hasChildren?: boolean;
  isDisabled?: boolean;
  isVeteran?: boolean;
}

interface UserProfileForMatching {
  userId: string;
  birthYear: number | null;
  occupation: string | null;
  incomeLevel: string | null;
  regionId: string | null;
  familyStatus: string | null;
  hasChildren: boolean;
  isDisabled: boolean;
  isVeteran: boolean;
}

interface PolicyForMatching {
  id: string;
  eligibilityCriteria: unknown;
  regionId: string | null;
}

/**
 * 사용자 프로필이 정책의 수급 자격 조건에 매칭되는지 확인
 * null-safe: 조건이 없으면 해당 조건은 스킵 (폭넓게 매칭)
 */
export function matchUserToPolicy(
  profile: UserProfileForMatching,
  policy: PolicyForMatching
): { matched: boolean; score: number; matchedCriteria: string[] } {
  // policy.regionId 체크 - criteria보다 먼저 확인 (필수 조건)
  if (policy.regionId && policy.regionId !== profile.regionId) {
    return { matched: false, score: 0, matchedCriteria: [] };
  }

  const criteria = policy.eligibilityCriteria as EligibilityCriteria | null;

  if (!criteria) {
    // 조건 없는 정책 = 모든 사용자에게 해당 (지역 체크 이미 통과)
    return { matched: true, score: 1, matchedCriteria: ['no-criteria'] };
  }

  const matchedCriteria: string[] = [];
  let totalConditions = 0;
  let matchedCount = 0;

  // 지역 체크 (eligibilityCriteria.regionIds)
  if (criteria.regionIds && criteria.regionIds.length > 0) {
    totalConditions++;
    if (profile.regionId && criteria.regionIds.includes(profile.regionId)) {
      matchedCount++;
      matchedCriteria.push('region');
    } else {
      // 지역 불일치 = 매칭 실패 (필수 조건)
      return { matched: false, score: 0, matchedCriteria: [] };
    }
  }

  // 연령 체크
  if ((criteria.ageMin !== undefined || criteria.ageMax !== undefined) && profile.birthYear) {
    const age = new Date().getFullYear() - profile.birthYear;
    totalConditions++;
    const minOk = criteria.ageMin === undefined || age >= criteria.ageMin;
    const maxOk = criteria.ageMax === undefined || age <= criteria.ageMax;
    if (minOk && maxOk) {
      matchedCount++;
      matchedCriteria.push('age');
    }
  }

  // 직업 체크
  if (criteria.occupation && criteria.occupation.length > 0 && profile.occupation) {
    totalConditions++;
    if (criteria.occupation.includes(profile.occupation)) {
      matchedCount++;
      matchedCriteria.push('occupation');
    }
  }

  // 소득 수준 체크
  if (criteria.incomeLevel && criteria.incomeLevel.length > 0 && profile.incomeLevel) {
    totalConditions++;
    if (criteria.incomeLevel.includes(profile.incomeLevel)) {
      matchedCount++;
      matchedCriteria.push('incomeLevel');
    }
  }

  // 가구 상황 체크
  if (criteria.familyStatus && criteria.familyStatus.length > 0 && profile.familyStatus) {
    totalConditions++;
    if (criteria.familyStatus.includes(profile.familyStatus)) {
      matchedCount++;
      matchedCriteria.push('familyStatus');
    }
  }

  // 자녀 여부 체크
  if (criteria.hasChildren !== undefined) {
    totalConditions++;
    if (criteria.hasChildren === profile.hasChildren) {
      matchedCount++;
      matchedCriteria.push('hasChildren');
    }
  }

  // 장애 여부 체크
  if (criteria.isDisabled !== undefined) {
    totalConditions++;
    if (criteria.isDisabled === profile.isDisabled) {
      matchedCount++;
      matchedCriteria.push('isDisabled');
    }
  }

  // 보훈 여부 체크
  if (criteria.isVeteran !== undefined) {
    totalConditions++;
    if (criteria.isVeteran === profile.isVeteran) {
      matchedCount++;
      matchedCriteria.push('isVeteran');
    }
  }

  // 조건이 없으면 매칭
  if (totalConditions === 0) {
    return { matched: true, score: 1, matchedCriteria: ['no-criteria'] };
  }

  const score = matchedCount / totalConditions;
  // 50% 이상 조건 충족 시 매칭
  const matched = score >= 0.5 || matchedCount >= 2;

  return { matched, score, matchedCriteria };
}

/**
 * 배치 매칭 실행 - 사용자 100명 단위로 처리
 * @MX:ANCHOR fan_in:3 Cron 핸들러, 테스트, 향후 수동 트리거에서 호출
 */
export async function matchPoliciesForUsers(options?: {
  onlyNewPolicies?: boolean;
  batchSize?: number;
}): Promise<{ matched: number; notified: number; skipped: number }> {
  const batchSize = options?.batchSize ?? 100;
  let matched = 0;
  let notified = 0;
  let skipped = 0;

  // 활성 프로필 사용자 조회
  const users = await prisma.userProfile.findMany({
    select: {
      userId: true,
      birthYear: true,
      occupation: true,
      incomeLevel: true,
      regionId: true,
      familyStatus: true,
      hasChildren: true,
      isDisabled: true,
      isVeteran: true,
    },
  });

  // 활성 정책 조회
  const policies = await prisma.policy.findMany({
    where: { status: 'active' },
    select: {
      id: true,
      eligibilityCriteria: true,
      regionId: true,
    },
    take: 1000, // 최대 1000개 정책
  });

  // 100명 단위 배치 처리
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);

    const matchResults: Array<{
      userId: string;
      policyId: string;
      matchScore: number;
      matchedCriteria: string[];
    }> = [];

    for (const user of batch) {
      for (const policy of policies) {
        const { matched: isMatched, score, matchedCriteria } = matchUserToPolicy(user, policy);

        if (isMatched) {
          matchResults.push({
            userId: user.userId,
            policyId: policy.id,
            matchScore: score,
            matchedCriteria,
          });
        }
      }
    }

    // 기존 매칭 결과 확인 후 신규만 삽입
    for (const result of matchResults) {
      try {
        await prisma.matchingResult.upsert({
          where: {
            userId_policyId: {
              userId: result.userId,
              policyId: result.policyId,
            },
          },
          update: {
            matchScore: result.matchScore,
            matchedCriteria: result.matchedCriteria,
          },
          create: {
            userId: result.userId,
            policyId: result.policyId,
            matchScore: result.matchScore,
            matchedCriteria: result.matchedCriteria,
            notified: false,
          },
        });
        matched++;
      } catch {
        skipped++;
      }
    }
  }

  return { matched, notified, skipped };
}
