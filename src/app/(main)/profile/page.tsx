import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getMyProfile } from '@/features/user/actions/profile.actions';

/**
 * 프로필 메인 페이지 (Pencil 디자인 기반)
 */
export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const profile = await getMyProfile();

  if (!profile) {
    redirect('/profile/setup');
  }

  return (
    <div className="px-6 py-8 lg:px-[170px]">
      <div className="mx-auto max-w-3xl">
        {/* 타이틀 */}
        <div className="flex items-center gap-3">
          <div className="h-6 w-1 rounded-full bg-[#4F6EF7]" />
          <h1 className="text-[22px] font-bold text-[#191F28]">내 프로필</h1>
        </div>

        {/* 기본 정보 카드 */}
        <div
          className="mt-6 rounded-[16px] bg-white p-6 shadow-sm"
          style={{ border: '1px solid #F2F3F6' }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-[#191F28]">기본 정보</h2>
            <Link
              href="/profile/setup"
              className="text-[13px] font-medium text-[#4F6EF7] hover:underline"
            >
              수정
            </Link>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <dt className="text-[13px] text-[#8B95A1]">출생연도</dt>
              <dd className="mt-1 text-[15px] font-semibold text-[#191F28]">
                {profile.birthYear}년
              </dd>
            </div>
            <div>
              <dt className="text-[13px] text-[#8B95A1]">거주 지역</dt>
              <dd className="mt-1 text-[15px] font-semibold text-[#191F28]">{profile.regionId}</dd>
            </div>
          </dl>
        </div>

        {/* 알림 설정 카드 */}
        <div
          className="mt-4 rounded-[16px] bg-white p-6 shadow-sm"
          style={{ border: '1px solid #F2F3F6' }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-[#191F28]">알림 설정</h2>
            <Link
              href="/profile/notifications"
              className="text-[13px] font-medium text-[#4F6EF7] hover:underline"
            >
              설정
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
