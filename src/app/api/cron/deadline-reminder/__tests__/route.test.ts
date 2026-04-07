// deadline-reminder 라우트 핸들러 테스트
// CRON_SECRET 인증 및 마감 알림 발송 로직 검증

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  prisma: {
    policy: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    matchingResult: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    notificationLog: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
    },
    notificationPreference: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}));

vi.mock('@/services/notification/push.service', () => ({
  sendPushNotification: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/services/notification/email.service', () => ({
  sendEmailNotification: vi.fn().mockResolvedValue(undefined),
}));

function createRequest(authHeader?: string) {
  return new Request('https://policy-damoa.vercel.app/api/cron/deadline-reminder', {
    headers: authHeader ? { authorization: authHeader } : {},
  });
}

describe('GET /api/cron/deadline-reminder', () => {
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

  it('올바른 인증으로 마감 알림 처리를 실행해야 한다', async () => {
    const { GET } = await import('../route');
    const response = await GET(createRequest('Bearer test-secret'));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(typeof body.notified).toBe('number');
  });

  it('서비스 오류 시 500을 반환해야 한다', async () => {
    const { prisma } = await import('@/lib/db');
    vi.mocked(prisma.policy.findMany).mockRejectedValueOnce(new Error('DB 연결 실패'));

    const { GET } = await import('../route');
    const response = await GET(createRequest('Bearer test-secret'));

    expect(response.status).toBe(500);
  });
});
