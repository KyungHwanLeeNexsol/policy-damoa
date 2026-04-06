// @MX:NOTE Gemini 구조화 출력용 Zod 스키마 (SPEC-AI-001 M2)
// 런타임 검증 실패 시 폴백 경로로 전환된다 (AC-012)

import { z } from 'zod';

// 단일 추천 항목 계약
export const RecommendationItemSchema = z.object({
  policyId: z.string().min(1),
  score: z.number().min(0).max(1),
  rank: z.number().int().min(1),
  reason: z.string().max(200), // 한국어 설명 (AC-008)
});

export type RecommendationItem = z.infer<typeof RecommendationItemSchema>;

// 추천 API 응답 래퍼 (Gemini 가 반환하는 최상위 구조)
export const RecommendationsResponseSchema = z.object({
  recommendations: z.array(RecommendationItemSchema),
});

export type RecommendationsResponse = z.infer<typeof RecommendationsResponseSchema>;

// 유사 정책 재순위 항목 (reason 은 선택적)
export const SimilarPolicyItemSchema = z.object({
  policyId: z.string().min(1),
  score: z.number().min(0).max(1),
  rank: z.number().int().min(1),
});

export type SimilarPolicyItem = z.infer<typeof SimilarPolicyItemSchema>;

export const SimilarPoliciesResponseSchema = z.object({
  similar: z.array(SimilarPolicyItemSchema),
});

export type SimilarPoliciesResponse = z.infer<typeof SimilarPoliciesResponseSchema>;

// Gemini OpenAI 호환 엔드포인트용 JSON 스키마 (구조화 출력)
// response_format: { type: 'json_schema', json_schema: { schema: ... } }
export const recommendationsJsonSchema = {
  name: 'recommendations_response',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['recommendations'],
    properties: {
      recommendations: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['policyId', 'score', 'rank', 'reason'],
          properties: {
            policyId: { type: 'string' },
            score: { type: 'number' },
            rank: { type: 'integer' },
            reason: { type: 'string' },
          },
        },
      },
    },
  },
} as const;

export const similarPoliciesJsonSchema = {
  name: 'similar_policies_response',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['similar'],
    properties: {
      similar: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['policyId', 'score', 'rank'],
          properties: {
            policyId: { type: 'string' },
            score: { type: 'number' },
            rank: { type: 'integer' },
          },
        },
      },
    },
  },
} as const;
