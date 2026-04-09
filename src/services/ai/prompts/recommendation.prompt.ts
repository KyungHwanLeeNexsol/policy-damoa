// @MX:NOTE Gemini 추천 프롬프트 빌더 (SPEC-AI-001 M2)
// PII (이메일/이름/전화) 는 절대 포함하지 않는다 - 프로필 필드 화이트리스트 방식

export interface PromptProfile {
  userId: string; // 로깅/디버깅용 - 프롬프트에는 포함하지 않음
  birthYear: number | null;
  regionId: string | null;
  occupation: string | null;
  incomeLevel: string | null;
  familyStatus: string | null;
  hasChildren: boolean;
  isDisabled: boolean;
  isVeteran: boolean;
}

export interface PromptBehavior {
  views: Array<{ policyId: string; source: string; viewedAt: Date }>;
  searches: Array<{ query: string; filters: unknown; searchedAt: Date }>;
}

export interface PromptCandidate {
  id: string;
  title: string;
  description: string | null;
  regionId: string | null;
  applicationDeadline: Date | null;
  categories: string[];
}

export interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

const MAX_CANDIDATES = 50;

/**
 * 추천 프롬프트 생성.
 * 반환: [system, user] 메시지 튜플.
 */
export function buildRecommendationPrompt(
  profile: PromptProfile,
  behavior: PromptBehavior,
  candidates: PromptCandidate[]
): ChatMessage[] {
  const system: ChatMessage = {
    role: 'system',
    content: [
      '당신은 한국 정부 정책을 추천하는 전문 조언자입니다.',
      '주어진 사용자 프로필과 최근 행동 신호를 바탕으로 후보 정책 중 최대 10개를 선별하세요.',
      '각 추천에는 score(0.0~1.0), rank(1부터), reason(200자 이하 한국어 설명)을 포함해야 합니다.',
      '후보 정책에 없는 사실을 지어내지 마세요 (hallucination 금지, AC-021).',
      '출력은 반드시 JSON 스키마(recommendations 배열)를 준수해야 합니다.',
    ].join('\n'),
  };

  // 화이트리스트 필드만 직렬화 - 이름/이메일/전화 등은 구조적으로 차단
  const profileSummary = [
    `- 생년: ${profile.birthYear ?? '미상'}`,
    `- 지역ID: ${profile.regionId ?? '미상'}`,
    `- 직업: ${profile.occupation ?? '미상'}`,
    `- 소득수준: ${profile.incomeLevel ?? '미상'}`,
    `- 가구형태: ${profile.familyStatus ?? '미상'}`,
    `- 자녀유무: ${profile.hasChildren ? '있음' : '없음'}`,
    `- 장애: ${profile.isDisabled ? '해당' : '비해당'}`,
    `- 보훈: ${profile.isVeteran ? '해당' : '비해당'}`,
  ].join('\n');

  const recentViews = behavior.views
    .slice(0, 10)
    .map((v) => `  · ${v.policyId} (${v.source})`)
    .join('\n');

  const recentSearches = behavior.searches
    .slice(0, 10)
    .map((s) => `  · "${s.query}"`)
    .join('\n');

  const truncated = candidates.slice(0, MAX_CANDIDATES);
  const candidateLines = truncated
    .map((c) => {
      const deadline = c.applicationDeadline
        ? c.applicationDeadline.toISOString().slice(0, 10)
        : '상시';
      const cats = c.categories.length > 0 ? c.categories.join(',') : '-';
      return `- [${c.id}] ${c.title} | 지역=${c.regionId ?? '전국'} | 마감=${deadline} | 분류=${cats}`;
    })
    .join('\n');

  const user: ChatMessage = {
    role: 'user',
    content: [
      '## 사용자 프로필',
      profileSummary,
      '',
      '## 최근 조회',
      recentViews || '  (없음)',
      '',
      '## 최근 검색',
      recentSearches || '  (없음)',
      '',
      `## 후보 정책 (${truncated.length}개)`,
      candidateLines || '  (없음)',
      '',
      '위 후보에서 사용자에게 가장 적합한 정책을 최대 10개 선별하여 JSON으로 응답하세요.',
    ].join('\n'),
  };

  return [system, user];
}
