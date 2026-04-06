// @MX:ANCHOR fan_in:3 AI 추천 엔진 - API 라우트/크론/내부 서비스에서 호출되는 핵심 진입점
// @MX:REASON: 추천 전체 파이프라인(캐시→프로필→후보조회→Gemini→폴백→저장)의 단일 진입점
// @MX:SPEC: SPEC-AI-001 (REQ-AI-006 ~ REQ-AI-012)

import { CACHE_TTL } from '@/lib/cache-ttl';
import { prisma } from '@/lib/db';
import gemini from '@/lib/openai';
import { getRedis } from '@/lib/redis';
import { getRecentBehavior } from '@/services/ai/behavior-tracking.service';

import {
  buildRecommendationPrompt,
  type PromptCandidate,
  type PromptProfile,
} from './prompts/recommendation.prompt';
import {
  RecommendationsResponseSchema,
  recommendationsJsonSchema,
} from './prompts/schemas';

// 프로필 불완전 상태를 나타내는 센티널 에러 (API 라우트에서 422 로 매핑)
export class ProfileIncompleteError extends Error {
  constructor(message = '프로필이 불완전합니다') {
    super(message);
    this.name = 'ProfileIncompleteError';
  }
}

export interface RecommendationResultItem {
  policyId: string;
  score: number;
  rank: number;
  reason: string;
}

export interface RecommendationsResult {
  recommendations: RecommendationResultItem[];
  generatedAt: string; // ISO-8601
  cached: boolean;
}

const CACHE_KEY = (userId: string): string => `recommendations:user:${userId}`;
const FALLBACK_TTL_SECONDS = 15 * 60;
const MAX_CANDIDATES = 50;
const MAX_RESULTS = 10;
const GEMINI_MODEL = 'gemini-2.0-flash';
const FALLBACK_REASON = '프로필과 일치하는 카테고리 및 지역 조건';

/**
 * 사용자별 AI 추천 생성 (SPEC-AI-001 핵심).
 *
 * 파이프라인:
 *   1) Redis 캐시 hit → 즉시 반환 (cached: true)
 *   2) 프로필 완성 검사 → 불완전이면 ProfileIncompleteError
 *   3) 후보 정책 조회 (최대 50, 마감일 유효)
 *   4) Gemini 호출 + Zod 검증
 *   5) 실패 시 규칙 기반 폴백 + DataSyncLog 기록
 *   6) PolicyRecommendation 테이블 저장 + Redis 캐시
 */
export async function generateRecommendations(
  userId: string,
): Promise<RecommendationsResult> {
  const redis = getRedis();
  const cacheKey = CACHE_KEY(userId);

  // 1) 캐시 hit
  if (redis) {
    try {
      const cached = (await redis.get(cacheKey)) as RecommendationsResult | null;
      if (cached) {
        return { ...cached, cached: true };
      }
    } catch (err) {
      console.error('[recommendation] 캐시 조회 실패', err);
    }
  }

  // 2) 프로필 완성 검사
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
  });

  if (!profile || profile.birthYear == null || profile.regionId == null) {
    throw new ProfileIncompleteError();
  }

  // 3) 후보 정책 조회
  // - 마감일이 남은 활성 정책
  // - 사용자 지역 또는 전국 정책
  // - 마감일 임박 순 정렬
  const now = new Date();
  const candidatePolicies = await prisma.policy.findMany({
    where: {
      status: 'active',
      OR: [
        { applicationDeadline: null },
        { applicationDeadline: { gt: now } },
      ],
      AND: [
        {
          OR: [
            { regionId: profile.regionId },
            { regionId: null },
          ],
        },
      ],
    },
    include: {
      categories: { include: { category: true } },
    },
    orderBy: [{ applicationDeadline: 'asc' }],
    take: MAX_CANDIDATES,
  });

  // 4) Gemini 호출 (실패 시 폴백으로 점프)
  const promptProfile: PromptProfile = {
    userId: profile.userId,
    birthYear: profile.birthYear,
    regionId: profile.regionId,
    occupation: profile.occupation,
    incomeLevel: profile.incomeLevel,
    familyStatus: profile.familyStatus,
    hasChildren: profile.hasChildren,
    isDisabled: profile.isDisabled,
    isVeteran: profile.isVeteran,
  };

  const behavior = await getRecentBehavior(userId);

  const promptCandidates: PromptCandidate[] = candidatePolicies.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    regionId: p.regionId,
    applicationDeadline: p.applicationDeadline,
    categories: p.categories.map((rel) => rel.category.name),
  }));

  let results: RecommendationResultItem[] = [];
  let usedFallback = false;
  let tokensUsed = 0;

  try {
    const messages = buildRecommendationPrompt(
      promptProfile,
      behavior,
      promptCandidates,
    );

    const geminiResponse = await gemini.chat.completions.create({
      model: GEMINI_MODEL,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: 0.3,
      max_tokens: 2000,
      response_format: {
        type: 'json_schema',
        json_schema: recommendationsJsonSchema,
      },
    });

    tokensUsed = geminiResponse.usage?.total_tokens ?? 0;
    const rawContent = geminiResponse.choices[0]?.message?.content ?? '';

    const parsed = JSON.parse(rawContent);
    const validated = RecommendationsResponseSchema.parse(parsed);

    // 후보에 없는 policyId 는 필터링 (hallucination 방어, AC-021)
    const candidateIdSet = new Set(promptCandidates.map((c) => c.id));
    results = validated.recommendations
      .filter((r) => candidateIdSet.has(r.policyId))
      .slice(0, MAX_RESULTS)
      .map((r, idx) => ({ ...r, rank: idx + 1 }));

    if (results.length === 0) {
      throw new Error('Gemini 결과가 모두 후보에 없음');
    }
  } catch (err) {
    console.error('[recommendation] Gemini 실패, 폴백 사용', err);
    usedFallback = true;
    results = buildFallbackResults(promptCandidates);

    // DataSyncLog 기록 (AC-009)
    try {
      await prisma.dataSyncLog.create({
        data: {
          source: 'ai-recommendations',
          status: 'PARTIAL',
          totalCount: promptCandidates.length,
          upsertCount: results.length,
          errorCount: 1,
          errorMessage: `Gemini fallback: ${(err as Error).message}`,
          startedAt: new Date(),
          completedAt: new Date(),
        },
      });
    } catch (logErr) {
      console.error('[recommendation] DataSyncLog 기록 실패', logErr);
    }
  }

  // 5) DB 저장 (upsert 대신 삭제 후 재삽입으로 단순화)
  try {
    await prisma.policyRecommendation.deleteMany({
      where: { userId },
    });

    const expiresAt = new Date(Date.now() + CACHE_TTL.RECOMMENDATIONS * 1000);
    await prisma.policyRecommendation.createMany({
      data: results.map((r) => ({
        userId,
        policyId: r.policyId,
        score: r.score,
        rank: r.rank,
        reason: r.reason,
        expiresAt,
      })),
      skipDuplicates: true,
    });
  } catch (err) {
    console.error('[recommendation] DB 저장 실패', err);
  }

  const result: RecommendationsResult = {
    recommendations: results,
    generatedAt: new Date().toISOString(),
    cached: false,
  };

  // 6) 캐시 저장 (폴백이면 단축 TTL)
  if (redis) {
    try {
      await redis.set(cacheKey, result, {
        ex: usedFallback ? FALLBACK_TTL_SECONDS : CACHE_TTL.RECOMMENDATIONS,
      });
    } catch (err) {
      console.error('[recommendation] 캐시 저장 실패', err);
    }
  }

  // tokens 필드는 내부 로깅용이라 반환값에는 포함하지 않음
  void tokensUsed;

  return result;
}

/**
 * 규칙 기반 폴백: 후보 정책을 마감일 임박 순으로 정렬해 상위 10개 반환.
 * 모든 항목에 동일한 정적 reason 을 부여한다 (SPEC 4.6).
 */
function buildFallbackResults(
  candidates: PromptCandidate[],
): RecommendationResultItem[] {
  return candidates
    .slice(0, MAX_RESULTS)
    .map((c, idx) => ({
      policyId: c.id,
      score: Math.max(0.1, 1 - idx * 0.05),
      rank: idx + 1,
      reason: FALLBACK_REASON,
    }));
}
