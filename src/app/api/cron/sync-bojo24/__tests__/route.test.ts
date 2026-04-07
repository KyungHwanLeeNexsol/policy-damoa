// sync-bojo24 라우트 핸들러 테스트
// CRON_SECRET 인증 및 동기화 로직 검증

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/data-collection/bojo24.service', () => ({
  syncAll: vi.fn(),
}));

vi.mock('@/services/cache/policy.cache', () => ({
  invalidatePolicyCaches: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/services/data-collection/utils', () => ({
  AuthError: class AuthError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AuthError';
    }
  },
}));

describe('GET /api/cron/sync-bojo24', () => {
  beforeEach(() => {
    process.env.CRON_SECRET = 'test-cron-secret';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Authorization 헤더가 없으면 401을 반환해야 한다', async () => {
    const { GET } = await import('../route');

    const request = new Request('http://localhost/api/cron/sync-bojo24');
    const response = await GET(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('잘못된 CRON_SECRET이면 401을 반환해야 한다', async () => {
    const { GET } = await import('../route');

    const request = new Request('http://localhost/api/cron/sync-bojo24', {
      headers: { Authorization: 'Bearer wrong-secret' },
    });
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('올바른 CRON_SECRET으로 동기화를 실행해야 한다', async () => {
    const { syncAll } = await import('@/services/data-collection/bojo24.service');
    vi.mocked(syncAll).mockResolvedValue(undefined);

    const { GET } = await import('../route');

    const request = new Request('http://localhost/api/cron/sync-bojo24', {
      headers: { Authorization: 'Bearer test-cron-secret' },
    });
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.source).toBe('BOJO24');
    expect(syncAll).toHaveBeenCalled();
  });

  it('동기화 실패 시 500을 반환해야 한다', async () => {
    const { syncAll } = await import('@/services/data-collection/bojo24.service');
    vi.mocked(syncAll).mockRejectedValue(new Error('API 오류'));

    const { GET } = await import('../route');

    const request = new Request('http://localhost/api/cron/sync-bojo24', {
      headers: { Authorization: 'Bearer test-cron-secret' },
    });
    const response = await GET(request);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('API 오류');
  });
});
