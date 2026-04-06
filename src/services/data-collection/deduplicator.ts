// 중복 제거 및 Upsert 처리
// externalId 기준으로 정책을 upsert (생성 또는 업데이트)

import type { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';

import type { NormalizedPolicy } from './types';

/** upsert 결과 카운터 */
export interface UpsertResult {
  upsertCount: number;
  skipCount: number;
  errorCount: number;
}

/**
 * 정규화된 정책 목록을 externalId 기준으로 upsert한다.
 * null 항목은 skipCount에 포함된다.
 */
export async function upsertPolicies(
  policies: (NormalizedPolicy | null)[],
): Promise<UpsertResult> {
  let upsertCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const policy of policies) {
    if (policy === null) {
      skipCount++;
      continue;
    }

    try {
      // Prisma JSON 필드 타입 호환을 위한 변환
      const eligibility = (policy.eligibilityCriteria ?? undefined) as
        | Prisma.InputJsonValue
        | undefined;
      const conditions = (policy.additionalConditions ?? undefined) as
        | Prisma.InputJsonValue
        | undefined;

      await prisma.policy.upsert({
        where: { externalId: policy.externalId },
        create: {
          externalId: policy.externalId,
          title: policy.title,
          description: policy.description,
          eligibilityCriteria: eligibility,
          additionalConditions: conditions,
          benefitType: policy.benefitType,
          benefitAmount: policy.benefitAmount,
          applicationMethod: policy.applicationMethod,
          applicationDeadline: policy.applicationDeadline,
          sourceUrl: policy.sourceUrl,
          sourceAgency: policy.sourceAgency,
          status: policy.status,
        },
        update: {
          title: policy.title,
          description: policy.description,
          eligibilityCriteria: eligibility,
          additionalConditions: conditions,
          benefitType: policy.benefitType,
          benefitAmount: policy.benefitAmount,
          applicationMethod: policy.applicationMethod,
          applicationDeadline: policy.applicationDeadline,
          sourceUrl: policy.sourceUrl,
          sourceAgency: policy.sourceAgency,
          status: policy.status,
        },
      });
      upsertCount++;
    } catch (error) {
      console.error(
        `[deduplicator] upsert 실패 (externalId: ${policy.externalId}):`,
        error,
      );
      errorCount++;
    }
  }

  return { upsertCount, skipCount, errorCount };
}
