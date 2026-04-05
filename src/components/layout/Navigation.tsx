'use client';

// 모바일 하단 탭 네비게이션
// 모바일에서만 표시 (lg:hidden), 고정 하단 위치
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Sparkles, Bell, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

// 하단 네비게이션 탭 목록
interface Tab {
  readonly href: string;
  readonly label: string;
  readonly icon: LucideIcon;
}

const tabs: readonly Tab[] = [
  { href: '/', label: '홈', icon: Home },
  { href: '/policies', label: '검색', icon: Search },
  { href: '/recommendations', label: '추천', icon: Sparkles },
  { href: '/notifications', label: '알림', icon: Bell },
  { href: '/profile', label: '내정보', icon: User },
] as const;

export function Navigation(): React.ReactNode {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background lg:hidden"
      aria-label="하단 메뉴"
    >
      <div className="flex h-14 items-center justify-around">
        {tabs.map((tab) => {
          const isActive = tab.href === '/' ? pathname === '/' : pathname?.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 px-3 py-1 text-xs transition-colors',
                isActive ? 'text-primary font-medium' : 'text-muted-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <tab.icon className="size-5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
