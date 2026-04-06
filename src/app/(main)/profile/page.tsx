import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getMyProfile } from '@/features/user/actions/profile.actions';

/**
 * 프로필 메인 페이지 - 프로필 요약 및 링크 제공
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
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">내 프로필</h1>

        <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">기본 정보</h2>
            <Link
              href="/profile/setup"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              수정
            </Link>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-500">출생연도</dt>
              <dd className="mt-1 font-medium">{profile.birthYear}년</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">거주 지역</dt>
              <dd className="mt-1 font-medium">{profile.regionId}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-4 rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">알림 설정</h2>
            <Link
              href="/profile/notifications"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              설정
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
