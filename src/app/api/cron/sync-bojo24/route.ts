// @MX:WARN Vercel 300s maxDuration 제약
// @MX:REASON Vercel Cron 900s 하드 타임아웃; cursor 기반 페이지네이션 재시작은 @MX:TODO

import { invalidatePolicyCaches } from '@/services/cache/policy.cache';
import { syncAll } from '@/services/data-collection/bojo24.service';
import { AuthError } from '@/services/data-collection/utils';

export const maxDuration = 300;

/** 보조금24 동기화 Cron 핸들러 */
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
      source: 'BOJO24',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const isAuthError = error instanceof AuthError;
    const message = error instanceof Error ? error.message : String(error);
    console.error('[cron/sync-bojo24] 동기화 실패:', message);

    return Response.json(
      {
        success: false,
        source: 'BOJO24',
        error: message,
        authFailed: isAuthError,
        timestamp: new Date().toISOString(),
      },
      { status: isAuthError ? 403 : 500 }
    );
  }
}
