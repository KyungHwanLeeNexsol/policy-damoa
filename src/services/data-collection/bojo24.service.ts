// 보조금24 API 클라이언트
// 401/403 → AuthError 즉시 중단 (재시도 없음)
// 시간당 500건 요청 제한

import { prisma } from '@/lib/db';
import {
  getCachedApiResponse,
  setCachedApiResponse,
} from '@/services/cache/policy.cache';
import type { SyncSource } from '@/types/sync';

import { upsertPolicies } from './deduplicator';
import { normalize } from './normalizer';
import type { NormalizedPolicy, RawBojo24Policy } from './types';
import { AuthError, withRetry } from './utils';

const SOURCE: SyncSource = 'BOJO24';
const PAGE_SIZE = 100;
const RATE_LIMIT_PER_HOUR = 500;
const API_BASE_URL = 'https://api.odcloud.kr/api/gov24/v3/serviceList';

/** 시간당 요청 카운터 */
let requestCount = 0;
let requestHourStart = Date.now();

/** 시간당 요청 제한 확인 및 리셋 */
function checkRateLimit(): boolean {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  // 1시간 경과 시 카운터 리셋
  if (now - requestHourStart >= oneHour) {
    requestCount = 0;
    requestHourStart = now;
  }

  if (requestCount >= RATE_LIMIT_PER_HOUR) {
    return false; // 제한 초과
  }

  requestCount++;
  return true;
}

/** 요청 카운터 리셋 (테스트용) */
export function resetRateLimit(): void {
  requestCount = 0;
  requestHourStart = Date.now();
}

/** 보조금24 API 응답 구조 */
interface Bojo24ApiResponse {
  data: RawBojo24Policy[];
  totalCount: number;
  currentCount: number;
  matchCount: number;
  page: number;
  perPage: number;
}

/** 단일 페이지 조회 (캐시 확인 → API 호출) */
async function fetchPage(
  page: number,
): Promise<{ items: RawBojo24Policy[]; totalCount: number }> {
  // 캐시 조회
  const cached = await getCachedApiResponse<{
    items: RawBojo24Policy[];
    totalCount: number;
  }>(SOURCE, page);
  if (cached) return cached;

  // 요청 제한 확인
  if (!checkRateLimit()) {
    throw new Error('보조금24 시간당 요청 제한 초과 (500건/시간)');
  }

  const apiKey = process.env.BOJO24_API_KEY;
  const url = `${API_BASE_URL}?serviceKey=${apiKey}&page=${page}&perPage=${PAGE_SIZE}`;

  const result = await withRetry(async () => {
    const response = await fetch(url);

    // 401/403은 AuthError → 즉시 중단 (withRetry가 재시도하지 않음)
    if (response.status === 401 || response.status === 403) {
      throw new AuthError(
        `보조금24 인증 오류: ${response.status}`,
        response.status,
      );
    }

    if (!response.ok) {
      throw new Error(`보조금24 API 오류: ${response.status}`);
    }

    const data = (await response.json()) as Bojo24ApiResponse;
    return {
      items: data.data ?? [],
      totalCount: data.matchCount ?? 0,
    };
  });

  // 캐시 저장
  await setCachedApiResponse(SOURCE, page, result);

  return result;
}

/**
 * 보조금24 전체 동기화.
 * DataSyncLog를 RUNNING → SUCCESS/FAILED/AUTH_FAILED로 업데이트한다.
 */
export async function syncAll(): Promise<void> {
  const startedAt = new Date();

  const log = await prisma.dataSyncLog.create({
    data: {
      source: SOURCE,
      status: 'RUNNING',
      startedAt,
    },
  });

  let totalCount = 0;
  let upsertCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  try {
    const firstPage = await fetchPage(1);
    totalCount = firstPage.totalCount;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    // 첫 페이지 처리
    const firstNormalized = firstPage.items.map(
      (item): NormalizedPolicy | null => normalize(SOURCE, item),
    );
    const firstResult = await upsertPolicies(firstNormalized);
    upsertCount += firstResult.upsertCount;
    skipCount += firstResult.skipCount;
    errorCount += firstResult.errorCount;

    // 나머지 페이지 순차 처리
    for (let page = 2; page <= totalPages; page++) {
      // 요청 제한 도달 시 중단 (나머지는 다음 동기화에서 처리)
      if (!checkRateLimit()) {
        console.warn(
          `[bojo24] 시간당 요청 제한 도달. ${page}/${totalPages} 페이지까지 처리.`,
        );
        // PARTIAL 상태로 기록
        requestCount--; // checkRateLimit에서 증가한 카운터 복원
        break;
      }
      requestCount--; // checkRateLimit에서 증가한 카운터를 복원 (fetchPage 내에서 다시 증가)

      const pageData = await fetchPage(page);
      const normalized = pageData.items.map(
        (item): NormalizedPolicy | null => normalize(SOURCE, item),
      );
      const result = await upsertPolicies(normalized);
      upsertCount += result.upsertCount;
      skipCount += result.skipCount;
      errorCount += result.errorCount;
    }

    const completedAt = new Date();
    const status = errorCount > 0 ? 'PARTIAL' : 'SUCCESS';

    await prisma.dataSyncLog.update({
      where: { id: log.id },
      data: {
        status,
        totalCount,
        upsertCount,
        skipCount,
        errorCount,
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
      },
    });
  } catch (error) {
    const completedAt = new Date();
    const isAuthError = error instanceof AuthError;
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    await prisma.dataSyncLog.update({
      where: { id: log.id },
      data: {
        status: isAuthError ? 'AUTH_FAILED' : 'FAILED',
        totalCount,
        upsertCount,
        skipCount,
        errorCount,
        errorMessage,
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
      },
    });

    throw error;
  }
}
