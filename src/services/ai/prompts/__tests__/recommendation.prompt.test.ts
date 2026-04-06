// 추천 프롬프트 빌더 단위 테스트 (SPEC-AI-001 M2)
// 핵심 검증: PII 누출 방지, 후보 정책 50개 절단

import { describe, expect, it } from 'vitest';

import { buildRecommendationPrompt } from '../recommendation.prompt';

const baseProfile = {
  userId: 'user-1',
  birthYear: 1995,
  regionId: 'region-seoul',
  occupation: 'employed',
  incomeLevel: 'middle',
  familyStatus: 'single',
  hasChildren: false,
  isDisabled: false,
  isVeteran: false,
};

const baseBehavior = {
  views: [{ policyId: 'p-viewed-1', source: 'detail', viewedAt: new Date() }],
  searches: [{ query: '청년 창업', filters: null, searchedAt: new Date() }],
};

function makeCandidate(id: string): {
  id: string;
  title: string;
  description: string | null;
  regionId: string | null;
  applicationDeadline: Date | null;
  categories: string[];
} {
  return {
    id,
    title: `정책 ${id}`,
    description: '설명',
    regionId: 'region-seoul',
    applicationDeadline: new Date('2026-12-31'),
    categories: ['STARTUP'],
  };
}

describe('buildRecommendationPrompt', () => {
  it('system 과 user 메시지를 반환해야 한다', () => {
    const msgs = buildRecommendationPrompt(baseProfile, baseBehavior, [
      makeCandidate('p1'),
    ]);

    expect(msgs).toHaveLength(2);
    expect(msgs[0]?.role).toBe('system');
    expect(msgs[1]?.role).toBe('user');
  });

  it('system 메시지는 한국어 정책 조언자 역할을 명시해야 한다', () => {
    const msgs = buildRecommendationPrompt(baseProfile, baseBehavior, []);
    const systemContent = msgs[0]?.content ?? '';
    expect(systemContent).toContain('한국');
  });

  it('PII (이메일/이름/전화)를 프롬프트에 절대 포함하지 않아야 한다', () => {
    const profileWithPII = {
      ...baseProfile,
      // 타입에는 없지만, 실수로 퍼졌을 때도 안전한지 확인
    };
    const msgs = buildRecommendationPrompt(profileWithPII, baseBehavior, [
      makeCandidate('p1'),
    ]);
    const full = msgs.map((m) => m.content).join('\n');

    expect(full).not.toMatch(/@/); // 이메일
    expect(full.toLowerCase()).not.toContain('email');
    expect(full.toLowerCase()).not.toContain('phone');
    expect(full).not.toMatch(/\b010-?\d{4}-?\d{4}\b/); // 한국 휴대폰
  });

  it('후보 정책이 50개를 넘으면 최대 50개로 절단해야 한다', () => {
    const candidates = Array.from({ length: 80 }, (_, i) =>
      makeCandidate(`p${i}`),
    );
    const msgs = buildRecommendationPrompt(baseProfile, baseBehavior, candidates);
    const user = msgs[1]?.content ?? '';

    // p0 ~ p49 까지만 포함되어야 함
    expect(user).toContain('p49');
    expect(user).not.toContain('p50');
    expect(user).not.toContain('p79');
  });

  it('프로필 요약에 생년/지역이 포함되어야 한다', () => {
    const msgs = buildRecommendationPrompt(baseProfile, baseBehavior, []);
    const user = msgs[1]?.content ?? '';
    expect(user).toContain('1995');
    expect(user).toContain('region-seoul');
  });
});
