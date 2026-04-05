// 메인 레이아웃: Header + Sidebar + Content + Footer + 모바일 Navigation
// 인증된 사용자의 메인 콘텐츠 영역을 구성
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navigation } from '@/components/layout/Navigation';

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactNode {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 pb-14 lg:pb-0">
          <div className="mx-auto max-w-5xl px-4 py-6 lg:px-6">{children}</div>
        </main>
      </div>
      <Footer />
      <Navigation />
    </div>
  );
}
