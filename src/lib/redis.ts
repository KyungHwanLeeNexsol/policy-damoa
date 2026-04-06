// Upstash Redis 싱글턴 초기화
// Redis 연결 실패 시 null 반환 (graceful degradation)

import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

/** Redis 인스턴스 반환. 초기화 실패 시 null 반환 (예외 없음) */
export function getRedis(): Redis | null {
  if (redis) return redis;
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    return redis;
  } catch {
    return null;
  }
}
