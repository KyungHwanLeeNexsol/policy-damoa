// @MX:NOTE 사용자 행동 추적 서비스 - PolicyView/SearchLog 비차단 기록
// @MX:SPEC: SPEC-AI-001 (REQ-AI-001 ~ REQ-AI-005)
//
// fire-and-forget 패턴: 모든 함수는 예외를 던지지 않고 console에만 로그를 남긴다.
// 사용자 요청 경로를 절대 차단해서는 안 된다.

import { CACHE_TTL } from '@/lib/cache-ttl';
import { prisma } from '@/lib/db';
import { getRedis } from '@/lib/redis';

// 정책 조회 출처 (Prisma 스키마의 PolicyView.source 와 일치)
export type PolicyViewSource = 'detail' | 'search' | 'recommendation' | 'similar';

// 최근 행동 캐시 키 빌더 (단일 정의)
function recentBehaviorKey(userId: string): string {
  return `behavior:user:${userId}:recent`;
}

/**
 * 정책 상세 조회 이벤트 기록 (AC-001).
 * 실패 시 console.error 로 남기고 조용히 종료한다 (AC-005).
 * 성공 시 최근 행동 캐시를 무효화한다.
 */
export async function trackPolicyView(
  userId: string,
  policyId: string,
  source: PolicyViewSource,
): Promise<void> {
  try {
    await prisma.policyView.create({
      data: { userId, policyId, source },
    });

    // 캐시 무효화: 다음 추천 사이클이 최신 행동을 반영하도록
    const redis = getRedis();
    if (redis) {
      try {
        await redis.del(recentBehaviorKey(userId));
      } catch (cacheErr) {
        console.error('[behavior-tracking] 캐시 무효화 실패', cacheErr);
      }
    }
  } catch (err) {
    console.error('[behavior-tracking] trackPolicyView 실패', err);
  }
}

/**
 * 검색 이벤트 기록 (AC-004).
 * userId 가 null 이면 익명 검색으로 저장한다 (REQ-AI-005 의 예외:
 * 검색 자체는 비인증 트래픽도 허용; 이후 personalization 에는 사용하지 않음).
 */
export async function trackSearch(
  userId: string | null,
  query: string,
  filters: Record<string, unknown> | null | undefined,
): Promise<void> {
  try {
    await prisma.searchLog.create({
      data: {
        userId,
        query,
        // Prisma JSON 타입은 null 을 명시 입력으로 받지 않으므로
        // null/undefined 모두 undefined 로 정규화한다.
        filters: filters == null ? undefined : (filters as object),
      },
    });
  } catch (err) {
    console.error('[behavior-tracking] trackSearch 실패', err);
  }
}

// 최근 행동 조회 결과의 형태
export interface RecentBehavior {
  views: Array<{
    policyId: string;
    source: string;
    viewedAt: Date;
  }>;
  searches: Array<{
    query: string;
    filters: unknown;
    searchedAt: Date;
  }>;
}

/**
 * 추천 프롬프트용 최근 행동 조회.
 * 1) Redis 캐시 hit → 즉시 반환
 * 2) miss → DB에서 최근 20건씩 조회 후 30분 캐시
 * 3) DB 오류 → 빈 결과 반환 (절대 throw 하지 않음)
 */
export async function getRecentBehavior(userId: string): Promise<RecentBehavior> {
  const redis = getRedis();
  const key = recentBehaviorKey(userId);

  // 1) 캐시 hit
  if (redis) {
    try {
      const cached = (await redis.get(key)) as RecentBehavior | null;
      if (cached) {
        return cached;
      }
    } catch (err) {
      console.error('[behavior-tracking] 캐시 조회 실패', err);
    }
  }

  // 2) DB 조회
  let views: RecentBehavior['views'] = [];
  let searches: RecentBehavior['searches'] = [];

  try {
    const rawViews = await prisma.policyView.findMany({
      where: { userId },
      orderBy: { viewedAt: 'desc' },
      take: 20,
      select: { policyId: true, source: true, viewedAt: true },
    });
    views = rawViews;
  } catch (err) {
    console.error('[behavior-tracking] policyView 조회 실패', err);
  }

  try {
    const rawSearches = await prisma.searchLog.findMany({
      where: { userId },
      orderBy: { searchedAt: 'desc' },
      take: 20,
      select: { query: true, filters: true, searchedAt: true },
    });
    searches = rawSearches;
  } catch (err) {
    console.error('[behavior-tracking] searchLog 조회 실패', err);
  }

  const result: RecentBehavior = { views, searches };

  // 3) 캐시 저장 (실패해도 무시)
  if (redis) {
    try {
      await redis.set(key, result, { ex: CACHE_TTL.BEHAVIOR_RECENT });
    } catch (err) {
      console.error('[behavior-tracking] 캐시 저장 실패', err);
    }
  }

  return result;
}
