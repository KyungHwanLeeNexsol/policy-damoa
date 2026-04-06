'use client';

import Link from 'next/link';
import { markAsRead } from '@/features/notifications/actions/notification.actions';
import type { NotificationLogItem } from '@/features/notifications/types';

interface NotificationItemProps {
  notification: NotificationLogItem;
}

/**
 * 개별 알림 항목 컴포넌트
 */
export function NotificationItem({ notification }: NotificationItemProps) {
  const isUnread = !notification.readAt;

  const handleClick = async () => {
    if (isUnread) {
      await markAsRead(notification.id);
    }
  };

  const content = (
    <div
      className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
        isUnread ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="mt-0.5 flex-shrink-0">
        {notification.type === 'new_match' && <span className="text-xl">🎯</span>}
        {notification.type === 'deadline_7d' && <span className="text-xl">📅</span>}
        {notification.type === 'deadline_1d' && <span className="text-xl">⚠️</span>}
        {notification.type === 'digest' && <span className="text-xl">📋</span>}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${isUnread ? 'text-gray-900' : 'text-gray-600'}`}>
          {notification.title}
        </p>
        <p className="mt-1 text-sm text-gray-500">{notification.body}</p>
        <p className="mt-2 text-xs text-gray-400">
          {new Date(notification.createdAt).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
      {isUnread && <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />}
    </div>
  );

  if (notification.policyId) {
    return (
      <Link href={`/policies/${notification.policyId}`} onClick={handleClick}>
        {content}
      </Link>
    );
  }

  return <div onClick={handleClick}>{content}</div>;
}
