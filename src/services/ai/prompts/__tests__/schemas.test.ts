// Zod 스키마 단위 테스트 (SPEC-AI-001 M2)
// Gemini 구조화 출력의 런타임 검증 계약

import { describe, expect, it } from 'vitest';

import {
  RecommendationItemSchema,
  RecommendationsResponseSchema,
  SimilarPoliciesResponseSchema,
} from '../schemas';

describe('RecommendationItemSchema', () => {
  it('유효한 항목을 통과시켜야 한다', () => {
    const valid = {
      policyId: 'policy-1',
      score: 0.85,
      rank: 1,
      reason: '프로필 연령/지역과 일치',
    };
    expect(() => RecommendationItemSchema.parse(valid)).not.toThrow();
  });

  it('score 가 0-1 범위를 벗어나면 거부해야 한다', () => {
    expect(() =>
      RecommendationItemSchema.parse({
        policyId: 'p',
        score: 1.2,
        rank: 1,
        reason: 'r',
      })
    ).toThrow();
  });

  it('reason 200자 초과 시 거부해야 한다', () => {
    expect(() =>
      RecommendationItemSchema.parse({
        policyId: 'p',
        score: 0.5,
        rank: 1,
        reason: 'a'.repeat(201),
      })
    ).toThrow();
  });

  it('policyId 가 빈 문자열이면 거부해야 한다', () => {
    expect(() =>
      RecommendationItemSchema.parse({
        policyId: '',
        score: 0.5,
        rank: 1,
        reason: 'r',
      })
    ).toThrow();
  });
});

describe('RecommendationsResponseSchema', () => {
  it('recommendations 배열을 가진 응답을 통과시켜야 한다', () => {
    const valid = {
      recommendations: [{ policyId: 'p1', score: 0.9, rank: 1, reason: '매칭' }],
    };
    expect(() => RecommendationsResponseSchema.parse(valid)).not.toThrow();
  });

  it('recommendations 키가 없으면 거부해야 한다 (AC-012)', () => {
    expect(() => RecommendationsResponseSchema.parse({})).toThrow();
  });

  it('빈 배열도 유효로 취급해야 한다', () => {
    expect(() => RecommendationsResponseSchema.parse({ recommendations: [] })).not.toThrow();
  });
});

describe('SimilarPoliciesResponseSchema', () => {
  it('similar 배열을 가진 응답을 통과시켜야 한다', () => {
    const valid = {
      similar: [{ policyId: 'p1', score: 0.7, rank: 1 }],
    };
    expect(() => SimilarPoliciesResponseSchema.parse(valid)).not.toThrow();
  });

  it('similar 키가 없으면 거부해야 한다', () => {
    expect(() => SimilarPoliciesResponseSchema.parse({})).toThrow();
  });
});
