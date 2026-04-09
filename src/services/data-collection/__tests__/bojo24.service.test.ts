// 보조금24 서비스 테스트
// AuthError 즉시 중단, 시간당 요청 제한 검증

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthError } from '../utils';

// Prisma 목업
vi.mock('@/lib/db', () => ({
  prisma: {
    dataSyncLog: {
      create: vi.fn().mockResolvedValue({ id: 'log-001' }),
      update: vi.fn().mockResolvedValue({}),
    },
    policy: {
      upsert: vi.fn().mockResolvedValue({}),
    },
  },
}));

// Redis 캐시 목업
vi.mock('@/services/cache/policy.cache', () => ({
  getCachedApiResponse: vi.fn().mockResolvedValue(null),
  setCachedApiResponse: vi.fn().mockResolvedValue(undefined),
}));

describe('bojo24.service — AuthError 처리', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    process.env.BOJO24_API_KEY = 'test-key';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('401 응답 시 AuthError를 던지고 DataSyncLog를 AUTH_FAILED로 업데이트해야 한다', async () => {
    const { prisma } = await import('@/lib/db');
    const { resetRateLimit, syncAll } = await import('../bojo24.service');

    resetRateLimit();

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: vi.fn(),
    });
    vi.stubGlobal('fetch', mockFetch);

    await expect(syncAll()).rejects.toThrow(AuthError);

    expect(prisma.dataSyncLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'AUTH_FAILED',
        }),
      })
    );
  });

  it('403 응답 시 AuthError를 던져야 한다', async () => {
    const { resetRateLimit, syncAll } = await import('../bojo24.service');

    resetRateLimit();

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: vi.fn(),
    });
    vi.stubGlobal('fetch', mockFetch);

    await expect(syncAll()).rejects.toThrow(AuthError);
  });

  it('정상 응답 시 정책을 upsert하고 SUCCESS로 업데이트해야 한다', async () => {
    const { prisma } = await import('@/lib/db');
    const { resetRateLimit, syncAll } = await import('../bojo24.service');

    resetRateLimit();

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        data: [
          {
            svcId: 'SVC-001',
            svcNm: '테스트 서비스',
            jurMnofNm: '보건복지부',
          },
        ],
        matchCount: 1,
        currentCount: 1,
        page: 1,
        perPage: 100,
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await syncAll();

    expect(prisma.dataSyncLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'SUCCESS',
        }),
      })
    );
  });
});
