'use client';

import { useState, useTransition } from 'react';
import { NotificationItem } from './NotificationItem';
import { NotificationEmptyState } from './NotificationEmptyState';
import { markAllAsRead } from '@/features/notifications/actions/notification.actions';
import type { NotificationLogItem, PaginatedNotifications } from '@/features/notifications/types';

interface NotificationListProps {
  initialData: PaginatedNotifications;
}

/**
 * 알림 목록 컴포넌트 (무한 스크롤 + 전체 읽음 처리)
 */
export function NotificationList({ initialData }: NotificationListProps) {
  const [items, setItems] = useState<NotificationLogItem[]>(initialData.items);
  const [hasMore, setHasMore] = useState(initialData.hasMore);
  const [cursor, setCursor] = useState(initialData.nextCursor);
  const [isPending, startTransition] = useTransition();

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllAsRead();
      setItems((prev) => prev.map((item) => ({ ...item, readAt: new Date() })));
    });
  };

  const handleLoadMore = () => {
    if (!cursor) return;

    startTransition(async () => {
      const { getNotifications } = await import(
        '@/features/notifications/actions/notification.queries'
      );
      const next = await getNotifications(cursor);
      setItems((prev) => [...prev, ...next.items]);
      setHasMore(next.hasMore);
      setCursor(next.nextCursor);
    });
  };

  if (items.length === 0) {
    return <NotificationEmptyState />;
  }

  const hasUnread = items.some((item) => !item.readAt);

  return (
    <div className="space-y-4">
      {hasUnread && (
        <div className="flex justify-end">
          <button
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            모두 읽음으로 표시
          </button>
        </div>
      )}

      <div className="space-y-2">
        {items.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleLoadMore}
            disabled={isPending}
            className="rounded-lg border border-gray-300 px-6 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            {isPending ? '로딩 중...' : '더 보기'}
          </button>
        </div>
      )}
    </div>
  );
}
