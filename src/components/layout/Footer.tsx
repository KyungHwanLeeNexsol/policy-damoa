// 하단 푸터 컴포넌트
// 서비스 정보, 저작권, 관련 링크 표시
import Link from 'next/link';

// 푸터 링크 목록
const footerLinks = [
  { href: '/terms', label: '이용약관' },
  { href: '/privacy', label: '개인정보처리방침' },
  { href: '/contact', label: '문의하기' },
] as const;

export function Footer(): React.ReactNode {
  return (
    <footer className="border-t bg-background" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          {/* 서비스 설명 */}
          <div className="text-center sm:text-left">
            <p className="text-sm font-medium text-foreground">
              정책다모아 - 모든 정부 정책, 한곳에
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              &copy; 2026 정책다모아. All rights reserved.
            </p>
          </div>

          {/* 링크 */}
          <nav className="flex items-center gap-4" aria-label="푸터 링크">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
