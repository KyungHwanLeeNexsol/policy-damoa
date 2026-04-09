import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getNotificationPreferences } from '@/features/notifications/actions/notification.actions';
import { NotificationPreferences } from '@/features/user/components/NotificationPreferences';

/**
 * 알림 설정 페이지
 */
export default async function NotificationSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const preferences = await getNotificationPreferences();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">알림 설정</h1>
        <p className="mt-2 text-gray-500">정책 알림 수신 방법을 설정해주세요.</p>
        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
          <NotificationPreferences initialPreferences={preferences} />
        </div>
      </div>
    </main>
  );
}
