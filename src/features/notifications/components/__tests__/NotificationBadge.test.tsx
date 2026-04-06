import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NotificationBadge } from '../NotificationBadge';

vi.mock('@/features/notifications/actions/notification.queries', () => ({
  getUnreadCount: vi.fn(),
}));

describe('NotificationBadge', () => {
  it('읽지 않은 알림이 있으면 배지를 표시한다', async () => {
    const { getUnreadCount } = await import(
      '@/features/notifications/actions/notification.queries'
    );
    vi.mocked(getUnreadCount).mockResolvedValue(3);

    const jsx = await NotificationBadge();
    render(jsx!);

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('읽지 않은 알림이 없으면 null을 반환한다', async () => {
    const { getUnreadCount } = await import(
      '@/features/notifications/actions/notification.queries'
    );
    vi.mocked(getUnreadCount).mockResolvedValue(0);

    const result = await NotificationBadge();

    expect(result).toBeNull();
  });

  it('100개 이상이면 99+로 표시한다', async () => {
    const { getUnreadCount } = await import(
      '@/features/notifications/actions/notification.queries'
    );
    vi.mocked(getUnreadCount).mockResolvedValue(150);

    const jsx = await NotificationBadge();
    render(jsx!);

    expect(screen.getByText('99+')).toBeInTheDocument();
  });
});
