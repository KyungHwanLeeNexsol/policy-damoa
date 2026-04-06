'use client';

// 사이드바 컴포넌트 (데스크톱 전용)
// 정책 카테고리 네비게이션
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Briefcase, Rocket, Baby, GraduationCap, HeartPulse, Palette } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

// 정책 카테고리 목록
interface Category {
  readonly href: string;
  readonly label: string;
  readonly icon: LucideIcon;
}

const categories: readonly Category[] = [
  { href: '/policies?category=housing', label: '주거·주택', icon: Home },
  { href: '/policies?category=employment', label: '일자리·고용', icon: Briefcase },
  { href: '/policies?category=startup', label: '창업·사업', icon: Rocket },
  { href: '/policies?category=childcare', label: '육아·보육', icon: Baby },
  { href: '/policies?category=education', label: '교육·장학', icon: GraduationCap },
  { href: '/policies?category=welfare', label: '복지·의료', icon: HeartPulse },
  { href: '/policies?category=culture', label: '문화·생활', icon: Palette },
] as const;

export function Sidebar(): React.ReactNode {
  const pathname = usePathname();

  return (
    <aside
      className="hidden lg:flex w-56 shrink-0 flex-col border-r bg-background"
      aria-label="카테고리 메뉴"
    >
      <div className="flex flex-col gap-1 p-4">
        <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          카테고리
        </h2>
        <nav className="flex flex-col gap-0.5">
          {categories.map((category) => {
            // 현재 URL이 해당 카테고리와 일치하는지 확인
            const isActive =
              pathname?.includes(category.href.split('?')[0] ?? '') &&
              category.href.includes(
                new URLSearchParams(category.href.split('?')[1] ?? '').get('category') ?? ''
              );

            return (
              <Link
                key={category.href}
                href={category.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <category.icon className="size-4 shrink-0" />
                {category.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
