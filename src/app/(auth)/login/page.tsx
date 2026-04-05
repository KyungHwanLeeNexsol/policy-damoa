'use client';

// 소셜 로그인 페이지
// 카카오, 네이버, 구글 OAuth 로그인 버튼 제공
import { signIn } from 'next-auth/react';

export default function LoginPage(): React.ReactNode {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-lg">
      <h1 className="mb-8 text-center text-2xl font-bold text-gray-900">로그인</h1>

      <div className="flex flex-col gap-3">
        {/* 카카오 로그인 */}
        <button
          type="button"
          onClick={() => signIn('kakao')}
          className="flex w-full items-center justify-center rounded-lg bg-[#FEE500] px-4 py-3 font-medium text-[#191919] transition-opacity hover:opacity-90"
        >
          카카오로 시작하기
        </button>

        {/* 네이버 로그인 */}
        <button
          type="button"
          onClick={() => signIn('naver')}
          className="flex w-full items-center justify-center rounded-lg bg-[#03C75A] px-4 py-3 font-medium text-white transition-opacity hover:opacity-90"
        >
          네이버로 시작하기
        </button>

        {/* 구글 로그인 */}
        <button
          type="button"
          onClick={() => signIn('google')}
          className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          구글로 시작하기
        </button>
      </div>
    </div>
  );
}
