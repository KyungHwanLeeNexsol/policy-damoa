import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getMyProfile } from '@/features/user/actions/profile.actions';
import { ProfileWizard } from '@/features/user/components/ProfileWizard';

/**
 * 프로필 설정 위자드 페이지
 * - 미설정 사용자: 1단계부터 시작
 * - 기존 프로필: 현재 값으로 미리 채움
 */
export default async function ProfileSetupPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const profile = await getMyProfile();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">프로필 설정</h1>
        <p className="mt-2 text-gray-500">
          맞춤 정책 추천을 위해 기본 정보를 입력해주세요.
        </p>
        <ProfileWizard initialProfile={profile} />
      </div>
    </main>
  );
}
