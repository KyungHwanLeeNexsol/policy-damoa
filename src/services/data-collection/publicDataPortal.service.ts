// 공공데이터포털 (data.go.kr) API 클라이언트
// pageNo/numOfRows 페이지네이션, 3회 지수 백오프 재시도, Redis 캐시

import { prisma } from '@/lib/db';
import { getCachedApiResponse, setCachedApiResponse } from '@/services/cache/policy.cache';
import type { SyncSource } from '@/types/sync';

import { upsertPolicies } from './deduplicator';
import { normalize } from './normalizer';
import type { NormalizedPolicy, RawPublicDataPolicy } from './types';
import { withRetry } from './utils';

const SOURCE: SyncSource = 'PUBLIC_DATA_PORTAL';
const NUM_OF_ROWS = 100;
const API_BASE_URL = 'https://www.youthcenter.go.kr/opi/youthPlcyList.do';

/** 공공데이터포털 API 응답 구조 */
interface PublicDataApiResponse {
  youthPolicy: RawPublicDataPolicy[];
  totalCnt: number;
  pageIndex: number;
}

/** 단일 페이지 조회 (캐시 확인 → API 호출) */
async function fetchPage(
  pageNo: number
): Promise<{ items: RawPublicDataPolicy[]; totalCount: number }> {
  // 캐시 조회
  const cached = await getCachedApiResponse<{
    items: RawPublicDataPolicy[];
    totalCount: number;
  }>(SOURCE, pageNo);
  if (cached) return cached;

  // API 호출 (재시도 포함)
  const apiKey = process.env.PUBLIC_DATA_PORTAL_API_KEY;
  const url = `${API_BASE_URL}?openApiVlak=${apiKey}&display=${NUM_OF_ROWS}&pageIndex=${pageNo}`;

  const result = await withRetry(async () => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`공공데이터포털 API 오류: ${response.status}`);
    }
    const data = (await response.json()) as PublicDataApiResponse;
    return {
      items: data.youthPolicy ?? [],
      totalCount: data.totalCnt ?? 0,
    };
  });

  // 캐시 저장
  await setCachedApiResponse(SOURCE, pageNo, result);

  return result;
}

/**
 * 공공데이터포털 전체 동기화.
 * DataSyncLog를 RUNNING → SUCCESS/FAILED로 업데이트한다.
 */
export async function syncAll(): Promise<void> {
  const startedAt = new Date();

  // DataSyncLog 생성 (RUNNING 상태)
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
    // 첫 페이지로 전체 건수 확인
    const firstPage = await fetchPage(1);
    totalCount = firstPage.totalCount;
    const totalPages = Math.ceil(totalCount / NUM_OF_ROWS);

    // 첫 페이지 처리
    const firstNormalized = firstPage.items.map((item): NormalizedPolicy | null =>
      normalize(SOURCE, item)
    );
    const firstResult = await upsertPolicies(firstNormalized);
    upsertCount += firstResult.upsertCount;
    skipCount += firstResult.skipCount;
    errorCount += firstResult.errorCount;

    // 나머지 페이지 순차 처리
    for (let page = 2; page <= totalPages; page++) {
      const pageData = await fetchPage(page);
      const normalized = pageData.items.map((item): NormalizedPolicy | null =>
        normalize(SOURCE, item)
      );
      const result = await upsertPolicies(normalized);
      upsertCount += result.upsertCount;
      skipCount += result.skipCount;
      errorCount += result.errorCount;
    }

    // 성공 상태 업데이트
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
    // 실패 상태 업데이트
    const completedAt = new Date();
    const errorMessage = error instanceof Error ? error.message : String(error);

    await prisma.dataSyncLog.update({
      where: { id: log.id },
      data: {
        status: 'FAILED',
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
