import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getNotifications, getUnreadCount } from '../notification.queries';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'user-1', email: 'test@test.com' } }),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    notificationLog: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

const mockNotification = {
  id: 'notif-1',
  type: 'new_match',
  title: '새 정책 매칭',
  body: '관심 정책이 매칭되었습니다.',
  policyId: 'policy-1',
  status: 'sent',
  readAt: null,
  createdAt: new Date(),
};

describe('getNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('알림 목록을 반환한다', async () => {
    const { prisma } = await import('@/lib/db');
    vi.mocked(prisma.notificationLog.findMany).mockResolvedValue([mockNotification] as never);

    const result = await getNotifications();

    expect(result.items).toHaveLength(1);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });

  it('21개 이상이면 hasMore가 true이고 nextCursor가 설정된다', async () => {
    const { prisma } = await import('@/lib/db');
    const items = Array.from({ length: 21 }, (_, i) => ({
      ...mockNotification,
      id: `notif-${i + 1}`,
    }));
    vi.mocked(prisma.notificationLog.findMany).mockResolvedValue(items as never);

    const result = await getNotifications();

    expect(result.items).toHaveLength(20);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBe('notif-20');
  });

  it('인증되지 않은 사용자는 빈 목록을 반환한다', async () => {
    const { auth } = await import('@/lib/auth');
    (
      vi.mocked(auth) as unknown as { mockResolvedValueOnce: (v: unknown) => void }
    ).mockResolvedValueOnce(null);

    const result = await getNotifications();

    expect(result.items).toHaveLength(0);
    expect(result.hasMore).toBe(false);
  });
});

describe('getUnreadCount', () => {
  it('읽지 않은 알림 수를 반환한다', async () => {
    const { prisma } = await import('@/lib/db');
    vi.mocked(prisma.notificationLog.count).mockResolvedValue(5);

    const count = await getUnreadCount();

    expect(count).toBe(5);
  });

  it('인증되지 않은 사용자는 0을 반환한다', async () => {
    const { auth } = await import('@/lib/auth');
    (
      vi.mocked(auth) as unknown as { mockResolvedValueOnce: (v: unknown) => void }
    ).mockResolvedValueOnce(null);

    const count = await getUnreadCount();

    expect(count).toBe(0);
  });
});
