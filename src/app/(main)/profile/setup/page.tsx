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
    <div
      className="flex min-h-[calc(100vh-60px)] items-center justify-center px-6 py-10"
      style={{ background: '#F7F8FA' }}
    >
      <div
        className="w-full max-w-[680px] rounded-[16px] bg-white p-9"
        style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
      >
        <h1 className="text-[20px] font-bold text-[#111111]">맞춤 정책 프로필 설정</h1>
        <div className="mt-6">
          <ProfileWizard initialProfile={profile} />
        </div>
      </div>
    </div>
  );
}
