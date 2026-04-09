'use client';

// 로그인 페이지 - Pencil 디자인 기반 (카카오 간편인증)
import Link from 'next/link';
import { signIn } from 'next-auth/react';

export default function LoginPage(): React.ReactNode {
  return (
    <div className="flex min-h-screen flex-col bg-[#F7F8FA]">
      {/* 상단 파란 스트라이프 */}
      <div className="h-[3px] w-full bg-[#4F6EF7]" />

      {/* 중앙 카드 */}
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div
          className="w-full max-w-[440px] rounded-[24px] bg-white px-11 pb-11 pt-[52px]"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}
        >
          {/* 로고 */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2.5">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#4F6EF7] text-[18px] font-bold text-white">
                정
              </span>
              <span className="text-[22px] font-bold text-[#191F28]">정책다모아</span>
            </div>
            <p className="mt-3 text-[16px] text-[#191F28]">범정부 정책정보 포털</p>
            <p className="mt-1 text-[13px] text-[#8B95A1]">
              내 상황에 맞는 정책정보를 쉽게 찾아보세요
            </p>
          </div>

          {/* 구분선 */}
          <div className="my-8 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#E5E8EB]" />
            <span className="text-[12px] text-[#8B95A1]">SNS 로그인</span>
            <div className="h-px flex-1 bg-[#E5E8EB]" />
          </div>

          {/* 카카오 버튼 */}
          <button
            type="button"
            onClick={() => signIn('kakao')}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#FEE500] text-[15px] font-semibold text-[#191919] transition-opacity hover:opacity-90"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 1.5C4.58 1.5 1 4.31 1 7.77c0 2.22 1.48 4.17 3.71 5.28l-.76 2.8c-.07.26.22.47.45.32L7.74 14.3c.41.04.83.06 1.26.06 4.42 0 8-2.81 8-6.29C17 4.31 13.42 1.5 9 1.5z"
                fill="#191919"
              />
            </svg>
            카카오 계정으로 로그인
          </button>

          {/* 안내 문구 */}
          <p className="mt-5 text-center text-[12px] leading-relaxed text-[#8B95A1]">
            본 서비스는 카카오 간편인증을 통해 로그인됩니다.
            <br />
            로그인 시 이용약관 및 개인정보처리방침에 동의하게 됩니다.
          </p>
        </div>
      </div>

      {/* 하단 푸터 */}
      <div className="flex flex-col items-center gap-2 px-4 pb-8 text-[12px] text-[#8B95A1]">
        <div className="flex items-center gap-4">
          <Link href="/terms" className="hover:text-[#4F6EF7]">
            이용약관
          </Link>
          <span>|</span>
          <Link href="/privacy" className="hover:text-[#4F6EF7]">
            개인정보처리방침
          </Link>
          <span>|</span>
          <Link href="/contact" className="hover:text-[#4F6EF7]">
            고객센터
          </Link>
        </div>
        <p>&copy; 2026 정책다모아. All rights reserved.</p>
      </div>
    </div>
  );
}
