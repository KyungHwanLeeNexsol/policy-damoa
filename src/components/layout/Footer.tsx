// Pencil 디자인 기반 푸터
import Link from 'next/link';

const relatedSites = [
  { href: 'https://www.open.go.kr', label: '정보공개포털' },
  { href: 'https://www.epeople.go.kr', label: '국민참여포털' },
  { href: 'https://www.data.go.kr', label: '공공데이터포털' },
];

const support = [
  { href: '/faq', label: '자주 묻는 질문' },
  { href: '/notice', label: '공지사항' },
  { href: '/contact', label: '문의하기' },
];

export function Footer(): React.ReactNode {
  return (
    <footer className="bg-white" style={{ borderTop: '1px solid #F2F3F6' }} role="contentinfo">
      <div className="px-6 py-6 lg:px-[170px] lg:py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Col 1: 서비스 정보 */}
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4F6EF7] text-white font-bold">
                정
              </span>
              <div className="flex flex-col leading-tight">
                <span className="text-[15px] font-bold text-[#191F28]">정책다모아</span>
                <span className="text-[11px] text-[#8B95A1]">범정부 정책정보 포털</span>
              </div>
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-[#8B95A1]">
              정부와 지자체에서 제공하는 모든 정책 정보를 한곳에서 확인하세요.
            </p>
            <p className="mt-3 text-[12px] text-[#8B95A1]">
              고객센터: 1588-0000
              <br />
              운영시간: 평일 09:00 - 18:00
            </p>
          </div>

          {/* Col 2: 관련 사이트 */}
          <div>
            <h3 className="text-[14px] font-semibold text-[#191F28]">관련 사이트</h3>
            <ul className="mt-3 space-y-2">
              {relatedSites.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] text-[#8B95A1] hover:text-[#4F6EF7]"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: 고객지원 */}
          <div>
            <h3 className="text-[14px] font-semibold text-[#191F28]">고객지원</h3>
            <ul className="mt-3 space-y-2">
              {support.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-[13px] text-[#8B95A1] hover:text-[#4F6EF7]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 하단 바 */}
      <div style={{ borderTop: '1px solid #F2F3F6' }}>
        <div className="flex flex-col items-center justify-between gap-3 px-6 py-4 text-[12px] text-[#8B95A1] sm:flex-row lg:px-[170px]">
          <p>&copy; 2026 정책다모아. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-[#4F6EF7]">
              이용약관
            </Link>
            <Link href="/privacy" className="hover:text-[#4F6EF7]">
              개인정보처리방침
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
