'use client';

// Pencil 디자인 기반 상단 헤더
// 로고 + 중앙 네비게이션 + 로그인/알림
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Bell } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navLinks = [
  { href: '/', label: '홈' },
  { href: '/policies', label: '정책공색' },
  { href: '/profile', label: '관심정책' },
  { href: '/profile/notifications', label: '알림설정' },
  { href: '/profile', label: '마이페이지' },
] as const;

export function Header(): React.ReactNode {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-40 w-full bg-white"
      style={{ borderBottom: '1px solid #F2F3F6' }}
    >
      <div className="flex h-[60px] items-center justify-between px-6 lg:px-[170px]">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2.5" aria-label="정책다모아 홈으로 이동">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4F6EF7] text-white font-bold">
            정
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[16px] font-bold text-[#191F28]">정책다모아</span>
            <span className="text-[11px] text-[#8B95A1]">범정부 정책정보 포털</span>
          </span>
        </Link>

        {/* 중앙 네비게이션 */}
        <nav className="hidden md:flex items-center gap-9" aria-label="주요 메뉴">
          {navLinks.map((link) => {
            const isActive =
              link.href === '/' ? pathname === '/' : pathname?.startsWith(link.href);
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`text-[15px] transition-colors ${
                  isActive
                    ? 'font-semibold text-[#4F6EF7]'
                    : 'font-medium text-[#191F28] hover:text-[#4F6EF7]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* 우측 */}
        <div className="flex items-center gap-4">
          {session?.user ? (
            <>
              <button aria-label="알림" className="text-[#191F28] hover:text-[#4F6EF7]">
                <Bell className="size-5" />
              </button>
              <Avatar className="size-8">
                <AvatarImage
                  src={session.user.image ?? undefined}
                  alt={session.user.name ?? '사용자'}
                />
                <AvatarFallback>{session.user.name?.charAt(0) ?? 'U'}</AvatarFallback>
              </Avatar>
            </>
          ) : (
            <Link
              href="/login"
              className="text-[15px] font-medium text-[#191F28] hover:text-[#4F6EF7]"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
