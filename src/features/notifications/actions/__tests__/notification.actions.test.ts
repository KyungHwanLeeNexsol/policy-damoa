import { describe, it, expect, vi, beforeEach } from 'vitest';
import { markAsRead, markAllAsRead, saveNotificationPreferences } from '../notification.actions';

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'user-1', email: 'test@test.com' } }),
}));

vi.mock('@/lib/db', () => ({
  default: {
    notificationLog: {
      updateMany: vi.fn(),
    },
    notificationPreference: {
      upsert: vi.fn(),
    },
  },
}));

describe('markAsRead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('알림을 읽음으로 처리한다', async () => {
    const { default: prisma } = await import('@/lib/db');
    vi.mocked(prisma.notificationLog.updateMany).mockResolvedValue({ count: 1 });

    const result = await markAsRead('notif-1');

    expect(result.success).toBe(true);
    expect(prisma.notificationLog.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'notif-1', userId: 'user-1' }),
      })
    );
  });

  it('인증되지 않은 사용자는 실패를 반환한다', async () => {
    const { auth } = await import('@/lib/auth');
    vi.mocked(auth).mockResolvedValueOnce(null);

    const result = await markAsRead('notif-1');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });
});

describe('markAllAsRead', () => {
  it('모든 알림을 읽음으로 처리하고 count를 반환한다', async () => {
    const { default: prisma } = await import('@/lib/db');
    vi.mocked(prisma.notificationLog.updateMany).mockResolvedValue({ count: 3 });

    const result = await markAllAsRead();

    expect(result.success).toBe(true);
    expect(result.data?.count).toBe(3);
  });

  it('인증되지 않은 사용자는 실패를 반환한다', async () => {
    const { auth } = await import('@/lib/auth');
    vi.mocked(auth).mockResolvedValueOnce(null);

    const result = await markAllAsRead();

    expect(result.success).toBe(false);
  });
});

describe('saveNotificationPreferences', () => {
  it('알림 설정을 저장한다', async () => {
    const { default: prisma } = await import('@/lib/db');
    vi.mocked(prisma.notificationPreference.upsert).mockResolvedValue({} as never);

    const result = await saveNotificationPreferences({ emailEnabled: true, pushEnabled: false });

    expect(result.success).toBe(true);
    expect(prisma.notificationPreference.upsert).toHaveBeenCalledOnce();
  });
});
