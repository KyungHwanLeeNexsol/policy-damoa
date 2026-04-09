// 메인 레이아웃: Header + Content + Footer (Sidebar 제거, 디자인 반영)
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactNode {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FA]">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
