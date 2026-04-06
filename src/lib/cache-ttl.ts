// @MX:NOTE 캐시 TTL 상수 (SPEC-AI-001 P1.4)
// 모든 캐시 키의 만료 시간을 한 곳에서 관리한다.
//
// 본래 SPEC 은 redis.ts 에 추가하도록 명시했으나,
// redis.ts 는 변경 금지 정책이 걸려 있어 별도 파일로 분리한다.

export const CACHE_TTL = {
  /** 사용자별 AI 추천 결과 (1시간) */
  RECOMMENDATIONS: 3600,
  /** 정책별 유사 정책 (6시간) */
  SIMILAR_POLICIES: 21600,
  /** 사용자별 최근 행동 신호 (30분) */
  BEHAVIOR_RECENT: 1800,
} as const;

export type CacheTTLKey = keyof typeof CACHE_TTL;
