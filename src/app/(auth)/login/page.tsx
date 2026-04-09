'use client';

// 로그인 페이지 - Pencil 디자인 기반 (카카오 간편인증)
import Image from 'next/image';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { MessageCircle } from 'lucide-react';

export default function LoginPage(): React.ReactNode {
  return (
    <div className="flex min-h-screen flex-col" style={{ background: '#F7F8FA' }}>
      {/* 상단 파란 스트라이프 */}
      <div className="h-[3px] w-full bg-[#4F6EF7]" />

      {/* 중앙 카드 */}
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div
          className="flex w-full max-w-[440px] flex-col gap-8 rounded-[24px] bg-white px-11 pb-11 pt-[52px]"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
        >
          {/* 로고 영역 */}
          <div className="flex flex-col items-center gap-1">
            <Image
              src="/logo-icon.svg"
              width={52}
              height={52}
              alt="정책다모아"
              style={{
                borderRadius: '16px',
                boxShadow: '0 4px 14px rgba(79,110,247,0.2)',
              }}
            />
            <span
              className="mt-1 text-[26px] font-bold"
              style={{ color: '#1A1F36', letterSpacing: '-0.3px' }}
            >
              정책다모아
            </span>
          </div>

          {/* 설명 */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-[16px] font-semibold" style={{ color: '#333333' }}>
              범정부 정책정보 통합 포털
            </p>
            <p className="text-[13px]" style={{ color: '#666666' }}>
              내 상황에 맞는 정부지원금을 한 곳에서 찾아보세요
            </p>
          </div>

          {/* 구분선 */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[#D9D9D9]" />
            <span className="text-[12px]" style={{ color: '#999999' }}>
              간편 로그인
            </span>
            <div className="h-px flex-1 bg-[#D9D9D9]" />
          </div>

          {/* 카카오 버튼 */}
          <button
            type="button"
            onClick={() => signIn('kakao')}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] transition-opacity hover:opacity-90"
            style={{
              background: '#FEE500',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            <MessageCircle size={20} color="#3C1E1E" />
            <span className="text-[15px] font-semibold" style={{ color: '#3C1E1E' }}>
              카카오 계정으로 로그인
            </span>
          </button>

          {/* 안내 문구 */}
          <p className="text-center text-[11px]" style={{ color: '#999999', lineHeight: 1.6 }}>
            본 서비스는 카카오 간편인증을 통해 로그인합니다.
            <br />
            회원가입 없이 바로 이용 가능합니다.
          </p>
        </div>
      </div>

      {/* 하단 푸터 */}
      <div className="flex flex-col items-center gap-2 px-4 pb-8">
        <div className="flex items-center gap-3 text-[11px]">
          <Link href="/terms" className="hover:text-[#4F6EF7]" style={{ color: '#999999' }}>
            이용약관
          </Link>
          <span style={{ color: '#D9D9D9' }}>|</span>
          <Link
            href="/privacy"
            className="font-medium hover:text-[#4F6EF7]"
            style={{ color: '#666666' }}
          >
            개인정보처리방침
          </Link>
          <span style={{ color: '#D9D9D9' }}>|</span>
          <span style={{ color: '#999999' }}>고객센터 1588-0000</span>
        </div>
        <p className="text-[10px]" style={{ color: '#999999' }}>
          © 2026 정책다모아. 대한민국 정부 운영
        </p>
      </div>
    </div>
  );
}
