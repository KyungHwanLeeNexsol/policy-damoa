import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getNotificationPreferences } from '@/features/notifications/actions/notification.actions';
import { NotificationPreferences } from '@/features/user/components/NotificationPreferences';

/**
 * 알림 설정 페이지 (Pencil 디자인 기반)
 */
export default async function NotificationSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const preferences = await getNotificationPreferences();

  return (
    <div className="px-6 py-8 lg:px-[170px]">
      {/* 타이틀 */}
      <div className="flex items-center gap-[10px]">
        <div className="h-6 w-1 rounded-[2px] bg-[#4F6EF7]" />
        <h1 className="text-[22px] font-bold text-[#111111]">알림 설정</h1>
      </div>

      {/* 설정 카드 */}
      <div className="mt-5 flex flex-col gap-5">
        <div
          className="rounded-[16px] bg-white"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}
        >
          <NotificationPreferences initialPreferences={preferences} />
        </div>
      </div>
    </div>
  );
}
