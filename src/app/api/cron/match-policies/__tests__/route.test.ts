import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';

// 서비스 모킹
vi.mock('@/services/notification/matching.service', () => ({
  matchPoliciesForUsers: vi.fn().mockResolvedValue({ matched: 5, notified: 0, skipped: 0 }),
}));

vi.mock('@/services/notification/push.service', () => ({
  sendPushNotification: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/services/notification/email.service', () => ({
  sendEmailNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    matchingResult: {
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn(),
    },
    notificationPreference: {
      findUnique: vi.fn(),
    },
    policy: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

function createRequest(authHeader?: string) {
  return new Request('https://policy-damoa.kr/api/cron/match-policies', {
    headers: authHeader ? { authorization: authHeader } : {},
  });
}

describe('GET /api/cron/match-policies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'test-secret';
  });

  it('CRON_SECRET 없는 요청은 401을 반환한다', async () => {
    const response = await GET(createRequest());
    expect(response.status).toBe(401);
  });

  it('잘못된 CRON_SECRET은 401을 반환한다', async () => {
    const response = await GET(createRequest('Bearer wrong-secret'));
    expect(response.status).toBe(401);
  });

  it('올바른 인증으로 매칭을 실행하고 결과를 반환한다', async () => {
    const response = await GET(createRequest('Bearer test-secret'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.matched).toBe(5);
  });

  it('서비스 오류 시 500을 반환한다', async () => {
    const { matchPoliciesForUsers } = await import('@/services/notification/matching.service');
    vi.mocked(matchPoliciesForUsers).mockRejectedValueOnce(new Error('DB connection failed'));

    const response = await GET(createRequest('Bearer test-secret'));
    expect(response.status).toBe(500);
  });
});
