'use client';

// Pencil 디자인 기반 상단 헤더
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Bell, Search } from 'lucide-react';

const navLinks = [
  { href: '/', label: '홈' },
  { href: '/policies', label: '정책검색' },
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
      style={{ borderBottom: '1px solid #F2F3F6' }}
    >
      <div className="flex h-[60px] items-center justify-between px-6 lg:px-[170px]">
        {/* 왼쪽: 로고 + 구분선 + 네비게이션 */}
        <div className="flex h-full items-center gap-6">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2.5" aria-label="정책다모아 홈으로 이동">
            <Image
              src="/logo-icon.svg"
              width={42}
              height={42}
              alt="정책다모아"
              className="shrink-0"
              style={{ boxShadow: '0 3px 10px rgba(79,110,247,0.2)' }}
            />
            <div className="flex flex-col gap-px">
              <span
                className="text-[21px] font-bold leading-none"
                style={{ color: '#1A1F36', letterSpacing: '-0.5px' }}
              >
                정책다모아
              </span>
              <span
                className="text-[10px] font-medium leading-none"
                style={{ color: '#8B95A1', letterSpacing: '0.5px' }}
              >
                범정부 정책정보 포털
              </span>
            </div>
          </Link>

          {/* 구분선 */}
          <div className="hidden h-7 w-px md:block" style={{ background: '#F2F3F6' }} />

          {/* 네비게이션 */}
          <nav className="hidden h-full items-center md:flex" aria-label="주요 메뉴">
            {navLinks.map((link) => {
              const isActive =
                link.href === '/' ? pathname === '/' : pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`flex h-full items-center px-5 text-[15px] transition-colors ${
                    isActive
                      ? 'font-semibold text-[#4F6EF7]'
                      : 'font-medium text-[#6B7684] hover:text-[#4F6EF7]'
                  }`}
                  style={isActive ? { borderBottom: '2px solid #4F6EF7' } : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 우측: 통합검색 버튼 + 알림 */}
        <div className="flex items-center gap-3">
          {/* 통합검색 버튼 */}
          <button
            type="button"
            aria-label="통합검색"
            onClick={() => router.push('/policies')}
            className="hidden h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] transition-colors hover:border-[#4F6EF7] md:flex"
            style={{ border: '1px solid #E5E8EB' }}
          >
            <Search size={14} color="#4F6EF7" />
            <span style={{ color: '#8B95A1' }}>통합검색</span>
          </button>

          {/* 알림 아이콘 */}
          <Link
            href={session?.user ? '/profile/notifications' : '/login'}
            aria-label="알림"
            className="text-[#666666] hover:text-[#4F6EF7]"
          >
            <Bell size={20} />
          </Link>

          {/* 로그인 */}
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
