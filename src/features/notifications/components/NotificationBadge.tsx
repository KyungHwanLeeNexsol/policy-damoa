import { getUnreadCount } from '@/features/notifications/actions/notification.queries';

/**
 * 읽지 않은 알림 수를 표시하는 배지 컴포넌트 (Server Component)
 */
export async function NotificationBadge() {
  const count = await getUnreadCount();

  if (count === 0) return null;

  return (
    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}
