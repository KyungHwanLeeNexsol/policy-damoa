// @MX:WARN Vercel 900s maxDuration 제약
// @MX:REASON Vercel Cron 900s 하드 타임아웃; cursor 기반 페이지네이션 재시작은 @MX:TODO

import { invalidatePolicyCaches } from '@/services/cache/policy.cache';
import { syncAll } from '@/services/data-collection/publicDataPortal.service';

export const maxDuration = 900;

/** 공공데이터포털 동기화 Cron 핸들러 */
export async function GET(request: Request): Promise<Response> {
  // CRON_SECRET Bearer 인증
  const secret = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await syncAll();
    await invalidatePolicyCaches();

    return Response.json({
      success: true,
      source: 'PUBLIC_DATA_PORTAL',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[cron/sync-public-data] 동기화 실패:', message);

    return Response.json(
      {
        success: false,
        source: 'PUBLIC_DATA_PORTAL',
        error: message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
