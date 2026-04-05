'use client';

// 상단 헤더 컴포넌트
// 로고, 네비게이션, 인증 상태, 다크모드 토글 포함
// 모바일에서는 햄버거 메뉴(Sheet) 사용
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Menu, Moon, Sun, Search, Sparkles, Bell } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

// 데스크톱 네비게이션 링크 목록
const navLinks = [
  { href: '/policies', label: '정책 검색', icon: Search },
  { href: '/recommendations', label: '추천', icon: Sparkles },
  { href: '/notifications', label: '알림', icon: Bell },
] as const;

export function Header(): React.ReactNode {
  const { data: session } = useSession();
  const { setTheme, resolvedTheme } = useTheme();

  // 다크모드 토글 핸들러
  const toggleTheme = (): void => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 lg:px-6">
        {/* 로고 */}
        <Link
          href="/"
          className="mr-6 flex items-center gap-2 font-bold text-lg"
          aria-label="정책다모아 홈으로 이동"
        >
          <span className="text-primary">정책다모아</span>
        </Link>

        {/* 데스크톱 네비게이션 */}
        <nav className="hidden md:flex items-center gap-1" aria-label="주요 메뉴">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
            >
              <link.icon className="size-4" />
              {link.label}
            </Link>
          ))}
        </nav>

        {/* 우측 영역: 다크모드 토글 + 인증 */}
        <div className="ml-auto flex items-center gap-2">
          {/* 다크모드 토글 */}
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="테마 전환">
            <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* 인증 상태에 따른 표시 */}
          {session?.user ? (
            <div className="flex items-center gap-2">
              <Avatar className="size-8">
                <AvatarImage
                  src={session.user.image ?? undefined}
                  alt={session.user.name ?? '사용자'}
                />
                <AvatarFallback>{session.user.name?.charAt(0) ?? 'U'}</AvatarFallback>
              </Avatar>
              <span className="hidden md:inline text-sm font-medium">{session.user.name}</span>
            </div>
          ) : (
            <Button asChild variant="default" size="sm">
              <Link href="/login">로그인</Link>
            </Button>
          )}

          {/* 모바일 햄버거 메뉴 */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="메뉴 열기">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>메뉴</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4" aria-label="모바일 메뉴">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
                  >
                    <link.icon className="size-4" />
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
