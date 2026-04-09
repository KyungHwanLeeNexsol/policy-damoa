// @MX:NOTE PolicyCacheService
// 모든 외부 API 응답이 이 캐시 레이어를 통과함
// Redis graceful degradation: 연결 실패 시 null 반환 (예외 없음)
// TTL 상수: src/lib/constants.ts CACHE_TTL 객체 참조

import { CACHE_TTL } from '@/lib/constants';
import { getRedis } from '@/lib/redis';

/**
 * API 응답 캐시 조회 (TTL: 6시간)
 * Redis 실패 시 null 반환
 */
export async function getCachedApiResponse<T>(source: string, page: number): Promise<T | null> {
  try {
    const redis = getRedis();
    if (!redis) return null;

    const key = `api:${source}:page:${page}`;
    const cached = await redis.get<T>(key);
    return cached ?? null;
  } catch (error) {
    console.warn('[policy.cache] API 응답 캐시 조회 실패:', error);
    return null;
  }
}

/**
 * API 응답 캐시 저장 (TTL: 6시간)
 * Redis 실패 시 조용히 무시
 */
export async function setCachedApiResponse(
  source: string,
  page: number,
  data: unknown
): Promise<void> {
  try {
    const redis = getRedis();
    if (!redis) return;

    const key = `api:${source}:page:${page}`;
    await redis.set(key, data, { ex: CACHE_TTL.API_RESPONSE });
  } catch (error) {
    console.warn('[policy.cache] API 응답 캐시 저장 실패:', error);
  }
}

/**
 * 정책 목록 캐시 조회 (TTL: 15분)
 * filterHash: 필터 조건의 해시값
 */
export async function getCachedPolicyList<T>(filterHash: string): Promise<T | null> {
  try {
    const redis = getRedis();
    if (!redis) return null;

    const key = `policy:list:filter:${filterHash}`;
    const cached = await redis.get<T>(key);
    return cached ?? null;
  } catch (error) {
    console.warn('[policy.cache] 정책 목록 캐시 조회 실패:', error);
    return null;
  }
}

/**
 * 정책 목록 캐시 저장 (TTL: 15분)
 */
export async function setCachedPolicyList(filterHash: string, data: unknown): Promise<void> {
  try {
    const redis = getRedis();
    if (!redis) return;

    const key = `policy:list:filter:${filterHash}`;
    await redis.set(key, data, { ex: CACHE_TTL.POLICY_LIST });
  } catch (error) {
    console.warn('[policy.cache] 정책 목록 캐시 저장 실패:', error);
  }
}

/**
 * 정책 상세 캐시 조회 (TTL: 30분)
 */
export async function getCachedPolicyDetail<T>(id: string): Promise<T | null> {
  try {
    const redis = getRedis();
    if (!redis) return null;

    const key = `policy:detail:${id}`;
    const cached = await redis.get<T>(key);
    return cached ?? null;
  } catch (error) {
    console.warn('[policy.cache] 정책 상세 캐시 조회 실패:', error);
    return null;
  }
}

/**
 * 정책 상세 캐시 저장 (TTL: 30분)
 */
export async function setCachedPolicyDetail(id: string, data: unknown): Promise<void> {
  try {
    const redis = getRedis();
    if (!redis) return;

    const key = `policy:detail:${id}`;
    await redis.set(key, data, { ex: CACHE_TTL.POLICY_DETAIL });
  } catch (error) {
    console.warn('[policy.cache] 정책 상세 캐시 저장 실패:', error);
  }
}

/**
 * 동기화 후 정책 캐시 무효화.
 * 목록/상세 캐시를 삭제하여 다음 요청에서 최신 데이터를 반환하도록 한다.
 */
export async function invalidatePolicyCaches(): Promise<void> {
  try {
    const redis = getRedis();
    if (!redis) return;

    // Upstash Redis의 SCAN으로 패턴 매칭 삭제
    const patterns = ['policy:list:*', 'policy:detail:*'];

    for (const pattern of patterns) {
      let cursor = 0;
      do {
        const scanResult = await redis.scan(cursor, {
          match: pattern,
          count: 100,
        });
        cursor = Number(scanResult[0]);
        const keys = scanResult[1] as string[];
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } while (cursor !== 0);
    }
  } catch (error) {
    console.warn('[policy.cache] 캐시 무효화 실패:', error);
  }
}
