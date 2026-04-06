// @MX:NOTE 유사 정책 서비스 (SPEC-AI-001 REQ-AI-017~019)
// 1) category OR region 사전필터 → 2) AI 재순위 → 3) 6시간 캐시

import { CACHE_TTL } from '@/lib/cache-ttl';
import { prisma } from '@/lib/db';
import gemini from '@/lib/openai';
import { getRedis } from '@/lib/redis';

import { SimilarPoliciesResponseSchema, similarPoliciesJsonSchema } from './prompts/schemas';

const CACHE_KEY = (policyId: string): string => `similar:policy:${policyId}`;
const PREFILTER_LIMIT = 20;
const DEFAULT_RESULT_LIMIT = 5;
const GEMINI_MODEL = 'gemini-2.0-flash';

export interface SimilarPolicyDTO {
  id: string;
  title: string;
  category: string | null;
  region: string | null;
  deadline: string | null;
}

/**
 * 원본 정책과 유사한 정책 목록을 반환.
 * - 캐시 hit → 즉시 반환
 * - miss → category OR region 으로 20개 후보 조회 → Gemini 재순위 → 상위 N 반환
 * - Gemini 실패 → DB 순서 그대로 폴백
 */
export async function getSimilarPolicies(
  policyId: string,
  limit: number = DEFAULT_RESULT_LIMIT
): Promise<SimilarPolicyDTO[]> {
  const redis = getRedis();
  const cacheKey = CACHE_KEY(policyId);

  // 1) 캐시 hit
  if (redis) {
    try {
      const cached = (await redis.get(cacheKey)) as SimilarPolicyDTO[] | null;
      if (cached && Array.isArray(cached)) {
        return cached.slice(0, limit);
      }
    } catch (err) {
      console.error('[similar-policies] 캐시 조회 실패', err);
    }
  }

  // 2) 원본 정책 로드
  const source = await prisma.policy.findUnique({
    where: { id: policyId },
    include: {
      categories: { include: { category: true } },
    },
  });

  if (!source) {
    return [];
  }

  const sourceCategoryIds = source.categories.map(
    (rel: (typeof source.categories)[number]) => rel.categoryId
  );

  // 3) 사전필터 후보 조회 (category OR region, 원본 제외)
  const candidates = await prisma.policy.findMany({
    where: {
      id: { not: policyId },
      status: 'active',
      OR: [
        ...(sourceCategoryIds.length > 0
          ? [{ categories: { some: { categoryId: { in: sourceCategoryIds } } } }]
          : []),
        ...(source.regionId ? [{ regionId: source.regionId }] : []),
      ],
    },
    include: {
      categories: { include: { category: true } },
    },
    orderBy: [{ applicationDeadline: 'asc' }],
    take: PREFILTER_LIMIT,
  });

  if (candidates.length === 0) {
    return [];
  }

  // 4) AI 재순위 (실패 시 폴백)
  type CandidateType = (typeof candidates)[number];
  let orderedIds: string[] = candidates.map((c: CandidateType) => c.id);

  try {
    const candidateLines = candidates
      .map(
        (c: CandidateType) =>
          `- [${c.id}] ${c.title} | 지역=${c.regionId ?? '전국'} | 분류=${c.categories.map((r: CandidateType['categories'][number]) => r.category.name).join(',') || '-'}`
      )
      .join('\n');

    const response = await gemini.chat.completions.create({
      model: GEMINI_MODEL,
      messages: [
        {
          role: 'system',
          content:
            '당신은 한국 정부 정책 유사도 평가자입니다. 원본 정책과 가장 유사한 정책을 score(0~1)와 rank로 재정렬하세요. JSON 스키마(similar 배열)를 준수하세요.',
        },
        {
          role: 'user',
          content: [
            `## 원본 정책\n[${source.id}] ${source.title}`,
            '',
            `## 후보 정책 (${candidates.length}개)`,
            candidateLines,
            '',
            `위 후보를 유사도 기준으로 재정렬하여 상위 ${limit}개를 JSON으로 응답하세요.`,
          ].join('\n'),
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: {
        type: 'json_schema',
        json_schema: similarPoliciesJsonSchema,
      },
    });

    const rawContent = response.choices[0]?.message?.content ?? '';
    const parsed = JSON.parse(rawContent);
    const validated = SimilarPoliciesResponseSchema.parse(parsed);

    const candidateIdSet = new Set(candidates.map((c: CandidateType) => c.id));
    orderedIds = validated.similar
      .filter((s) => candidateIdSet.has(s.policyId))
      .sort((a, b) => a.rank - b.rank)
      .map((s) => s.policyId);
  } catch (err) {
    console.error('[similar-policies] Gemini 실패, DB 순서 폴백', err);
    // orderedIds 는 이미 candidates 순서로 초기화됨
  }

  // 5) DTO 매핑
  const byId = new Map(candidates.map((c: CandidateType) => [c.id, c] as const));
  const result: SimilarPolicyDTO[] = orderedIds
    .map((id) => byId.get(id))
    .filter((c): c is (typeof candidates)[number] => c !== undefined)
    .slice(0, limit)
    .map((c) => ({
      id: c.id,
      title: c.title,
      category: c.categories[0]?.category.name ?? null,
      region: c.regionId,
      deadline: c.applicationDeadline ? c.applicationDeadline.toISOString() : null,
    }));

  // 6) 캐시 저장 (6시간)
  if (redis && result.length > 0) {
    try {
      await redis.set(cacheKey, result, { ex: CACHE_TTL.SIMILAR_POLICIES });
    } catch (err) {
      console.error('[similar-policies] 캐시 저장 실패', err);
    }
  }

  return result;
}
