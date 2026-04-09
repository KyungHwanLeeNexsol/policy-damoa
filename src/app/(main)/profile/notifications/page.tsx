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
      <div className="mx-auto max-w-3xl">
        {/* 타이틀 */}
        <div className="flex items-center gap-3">
          <div className="h-6 w-1 rounded-full bg-[#4F6EF7]" />
          <h1 className="text-[22px] font-bold text-[#191F28]">알림 설정</h1>
        </div>
        <p className="mt-2 text-[14px] text-[#8B95A1]">정책 알림 수신 방법을 설정해주세요.</p>

        {/* 설정 카드 */}
        <div
          className="mt-6 rounded-[16px] bg-white p-6 shadow-sm"
          style={{ border: '1px solid #F2F3F6' }}
        >
          <NotificationPreferences initialPreferences={preferences} />
        </div>
      </div>
    </div>
  );
}
