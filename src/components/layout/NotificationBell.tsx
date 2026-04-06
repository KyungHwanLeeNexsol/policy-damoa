import { Suspense } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { NotificationBadge } from '@/features/notifications/components/NotificationBadge';

/**
 * 알림 벨 아이콘 + 읽지 않은 수 배지 (Server Component)
 * Header('use client')에서 직접 사용 불가하므로 layout에서 children으로 주입
 */
export function NotificationBell() {
  return (
    <Link href="/notifications" className="relative inline-flex items-center p-2" aria-label="알림">
      <Bell className="size-5" />
      <Suspense fallback={null}>
        <NotificationBadge />
      </Suspense>
    </Link>
  );
}
