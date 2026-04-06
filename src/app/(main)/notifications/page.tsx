import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getNotifications } from '@/features/notifications/actions/notification.queries';
import { NotificationList } from '@/features/notifications/components/NotificationList';

/**
 * 알림 목록 페이지
 * - 최신순 정렬
 * - 읽음/안읽음 구분
 * - 커서 기반 페이지네이션
 */
export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const initialData = await getNotifications();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">알림</h1>
        <div className="mt-6">
          <NotificationList initialData={initialData} />
        </div>
      </div>
    </main>
  );
}
