'use client';

// Pencil 디자인 기반 상단 헤더
// 로고 + 구분선 + 네비게이션 링크 | 검색버튼 + 알림
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Bell, Search } from 'lucide-react';

const navLinks = [
  { href: '/', label: '홈' },
  { href: '/policies', label: '정책찾기' },
  { href: '/recommendations', label: '관심정책' },
  { href: '/profile/notifications', label: '알림설정' },
  { href: '/profile', label: '마이페이지' },
] as const;

export function Header(): React.ReactNode {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header
      className="sticky top-0 z-40 w-full bg-white"
      style={{ borderBottom: '1px solid #E5E8EB' }}
    >
      <div className="flex h-[60px] items-center justify-between px-6 lg:px-[170px]">
        {/* 왼쪽: 로고 + 구분선 + 네비게이션 */}
        <div className="flex h-full items-center gap-6">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2.5" aria-label="정책다모아 홈으로 이동">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-[10px] text-[14px] font-bold text-white"
              style={{ background: 'linear-gradient(150deg, #4F6EF7 0%, #6B8AFF 100%)' }}
            >
              정
            </span>
            <span className="text-[16px] font-bold text-[#111111]">정책다모아</span>
          </Link>

          {/* 구분선 */}
          <div className="hidden h-7 w-px bg-[#E5E8EB] md:block" />

          {/* 네비게이션 */}
          <nav className="hidden md:flex h-full items-center gap-0" aria-label="주요 메뉴">
            {navLinks.map((link) => {
              const isActive =
                link.href === '/' ? pathname === '/' : pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`flex h-full items-center px-4 text-[14px] transition-colors ${
                    isActive
                      ? 'font-semibold text-[#4F6EF7]'
                      : 'font-normal text-[#333333] hover:text-[#4F6EF7]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 우측: 검색버튼 + 알림 */}
        <div className="flex items-center gap-3">
          {/* 검색 버튼 */}
          <button
            type="button"
            aria-label="정책 검색"
            onClick={() => router.push('/policies')}
            className="hidden md:flex items-center gap-1.5 h-9 rounded-full bg-white px-4 text-[13px] text-[#999999] transition-colors hover:border-[#4F6EF7] hover:text-[#4F6EF7]"
            style={{ border: '1px solid #E5E8EB' }}
          >
            <Search size={14} />
            <span>어떤 정책을 찾고 계세요?</span>
          </button>

          {/* 알림 아이콘 */}
          <Link
            href={session?.user ? '/profile/notifications' : '/login'}
            aria-label="알림"
            className="text-[#666666] hover:text-[#4F6EF7]"
          >
            <Bell size={20} />
          </Link>

          {/* 로그인 / 아바타 */}
          {!session?.user && (
            <Link
              href="/login"
              className="ml-1 hidden text-[14px] font-medium text-[#333333] hover:text-[#4F6EF7] md:block"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
