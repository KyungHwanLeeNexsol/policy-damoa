// @MX:ANCHOR [AUTO] 야간 추천 일괄 생성 크론 (SPEC-AI-001 REQ-AI-023)
// @MX:REASON: 인증 경계 + 외부 스케줄러 진입점. 레이트리밋/폴백 로직 집중.

import { prisma } from '@/lib/db';
import { generateRecommendations } from '@/services/ai/recommendation.service';

export const maxDuration = 60;

const BATCH_SIZE = 50;
const RETRY_DELAYS_MS = [1000, 2000, 4000];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { status?: number; code?: string | number };
  if (e.status === 429) return true;
  if (e.code === 429 || e.code === '429') return true;
  return false;
}

async function runWithBackoff(userId: string): Promise<'ok' | 'error'> {
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      await generateRecommendations(userId);
      return 'ok';
    } catch (err) {
      if (isRateLimitError(err) && attempt < RETRY_DELAYS_MS.length) {
        await sleep(RETRY_DELAYS_MS[attempt] ?? 1000);
        continue;
      }
      console.error('[cron/generate-recommendations] userId=%s 실패', userId, err);
      return 'error';
    }
  }
  return 'error';
}

export async function POST(request: Request): Promise<Response> {
  const secret = request.headers.get('x-cron-secret');
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = new Date();
  let totalCount = 0;
  let upsertCount = 0;
  let errorCount = 0;
  let lastError: string | null = null;

  try {
    let cursor: string | undefined;
    // 프로필 완성 사용자만 대상 (birthYear + regionId)
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const batch = await prisma.userProfile.findMany({
        where: {
          birthYear: { not: null },
          regionId: { not: null },
        },
        select: { userId: true },
        take: BATCH_SIZE,
        ...(cursor ? { skip: 1, cursor: { userId: cursor } } : {}),
        orderBy: { userId: 'asc' },
      });

      if (batch.length === 0) break;

      for (const { userId } of batch) {
        totalCount += 1;
        const result = await runWithBackoff(userId);
        if (result === 'ok') {
          upsertCount += 1;
        } else {
          errorCount += 1;
          lastError = `userId=${userId} 실패`;
        }
      }

      cursor = batch[batch.length - 1]?.userId;
      if (batch.length < BATCH_SIZE) break;
    }
  } catch (err) {
    console.error('[cron/generate-recommendations] 치명적 오류', err);
    lastError = err instanceof Error ? err.message : 'unknown';
  }

  const completedAt = new Date();
  const durationMs = completedAt.getTime() - startedAt.getTime();

  try {
    await prisma.dataSyncLog.create({
      data: {
        source: 'ai-recommendations-cron',
        status: errorCount === 0 ? 'SUCCESS' : upsertCount === 0 ? 'FAILED' : 'PARTIAL',
        totalCount,
        upsertCount,
        skipCount: 0,
        errorCount,
        errorMessage: lastError,
        startedAt,
        completedAt,
        durationMs,
      },
    });
  } catch (logErr) {
    console.error('[cron/generate-recommendations] DataSyncLog 저장 실패', logErr);
  }

  return Response.json({ totalCount, upsertCount, errorCount, durationMs }, { status: 200 });
}
