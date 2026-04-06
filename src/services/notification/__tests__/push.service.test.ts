import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendPushNotification } from '../push.service';

// web-push 모킹
vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn().mockResolvedValue({ statusCode: 201 }),
  },
}));

// Prisma 모킹
vi.mock('@/lib/db', () => ({
  prisma: {
    pushSubscription: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    notificationLog: {
      create: vi.fn(),
    },
  },
}));

const mockPayload = {
  title: '새로운 정책 매칭',
  body: '서울시 청년 지원금 프로그램이 매칭되었습니다.',
  url: '/policies/policy-1',
  policyId: 'policy-1',
};

describe('sendPushNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('활성 구독이 없으면 실패를 반환한다', async () => {
    const { prisma } = await import('@/lib/db');
    vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue([]);

    const result = await sendPushNotification('user-1', mockPayload);

    expect(result.success).toBe(false);
    expect(result.error).toContain('활성 Push 구독이 없습니다');
  });

  it('Push 전송 성공 시 NotificationLog를 생성한다', async () => {
    const { prisma } = await import('@/lib/db');
    const webPush = await import('web-push');

    vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue([
      {
        id: 'sub-1',
        userId: 'user-1',
        endpoint: 'https://fcm.example.com/send/abc',
        p256dh: 'key1',
        auth: 'auth1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as never[]);

    vi.mocked(webPush.default.sendNotification).mockResolvedValue({ statusCode: 201 } as never);
    vi.mocked(prisma.notificationLog.create).mockResolvedValue({} as never);

    const result = await sendPushNotification('user-1', mockPayload);

    expect(result.success).toBe(true);
    expect(prisma.notificationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'delivered', type: 'push' }),
      })
    );
  });

  it('410 Gone 응답 시 구독을 비활성화한다', async () => {
    const { prisma } = await import('@/lib/db');
    const webPush = await import('web-push');

    vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue([
      {
        id: 'sub-1',
        userId: 'user-1',
        endpoint: 'https://fcm.example.com/expired',
        p256dh: 'key1',
        auth: 'auth1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as never[]);

    // 410 Gone 에러 시뮬레이션
    vi.mocked(webPush.default.sendNotification).mockRejectedValue({
      statusCode: 410,
      body: 'Gone',
    });
    vi.mocked(prisma.pushSubscription.updateMany).mockResolvedValue({ count: 1 } as never);
    vi.mocked(prisma.notificationLog.create).mockResolvedValue({} as never);

    await sendPushNotification('user-1', mockPayload);

    // 구독 비활성화 확인
    expect(prisma.pushSubscription.updateMany).toHaveBeenCalledWith({
      where: { endpoint: 'https://fcm.example.com/expired' },
      data: { isActive: false },
    });

    // 실패 로그 기록 확인
    expect(prisma.notificationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'failed' }),
      })
    );
  });
});
