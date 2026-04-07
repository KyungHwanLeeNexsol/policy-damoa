// send-digest 라우트 핸들러 테스트
// CRON_SECRET 인증 및 다이제스트 이메일 발송 로직 검증

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/notification/email.service', () => ({
  sendDigestEmail: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    notificationPreference: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    matchingResult: {
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    policy: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    notificationLog: {
      create: vi.fn().mockResolvedValue({}),
    },
  },
}));

function createRequest(authHeader?: string) {
  return new Request('https://policy-damoa.vercel.app/api/cron/send-digest', {
    headers: authHeader ? { authorization: authHeader } : {},
  });
}

describe('GET /api/cron/send-digest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'test-secret';
  });

  it('Authorization 헤더가 없으면 401을 반환해야 한다', async () => {
    const { GET } = await import('../route');
    const response = await GET(createRequest());
    expect(response.status).toBe(401);
  });

  it('잘못된 CRON_SECRET이면 401을 반환해야 한다', async () => {
    const { GET } = await import('../route');
    const response = await GET(createRequest('Bearer wrong-secret'));
    expect(response.status).toBe(401);
  });

  it('올바른 인증으로 다이제스트 처리를 실행해야 한다', async () => {
    const { GET } = await import('../route');
    const response = await GET(createRequest('Bearer test-secret'));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it('서비스 오류 시 500을 반환해야 한다', async () => {
    const { prisma } = await import('@/lib/db');
    vi.mocked(prisma.notificationPreference.findMany).mockRejectedValueOnce(
      new Error('DB 연결 실패')
    );

    const { GET } = await import('../route');
    const response = await GET(createRequest('Bearer test-secret'));

    expect(response.status).toBe(500);
  });
});
