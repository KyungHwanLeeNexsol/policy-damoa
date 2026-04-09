// Pencil 디자인 기반 푸터
import Link from 'next/link';

export function Footer(): React.ReactNode {
  return (
    <footer className="bg-white" style={{ borderTop: '1px solid #E5E8EB' }} role="contentinfo">
      {/* 상단 3-컬럼 */}
      <div className="flex flex-col gap-8 px-6 py-6 md:flex-row lg:px-[170px] lg:py-8">
        {/* Col 1 */}
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-[#111111]">정책다모아</p>
          <p className="mt-2 text-[11px] text-[#666666]">범정부 정책정보 통합 플랫폼</p>
        </div>

        {/* Col 2: 관련 사이트 */}
        <div className="flex-1">
          <p className="text-[11px] font-semibold text-[#333333]">관련 사이트</p>
          <ul className="mt-2 space-y-1.5">
            <li>
              <a
                href="https://www.gov.kr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[#666666] hover:text-[#4F6EF7]"
              >
                정부24 (gov.kr)
              </a>
            </li>
            <li>
              <a
                href="https://www.bokjiro.go.kr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[#666666] hover:text-[#4F6EF7]"
              >
                보조금24
              </a>
            </li>
            <li>
              <a
                href="https://www.moel.go.kr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[#666666] hover:text-[#4F6EF7]"
              >
                고용노동부
              </a>
            </li>
          </ul>
        </div>

        {/* Col 3: 고객센터 */}
        <div className="flex-1">
          <p className="text-[11px] font-semibold text-[#333333]">고객센터</p>
          <ul className="mt-2 space-y-1.5">
            <li className="text-[11px] text-[#666666]">전화: 1588-0000</li>
            <li className="text-[11px] text-[#666666]">평일 09:00 ~ 18:00</li>
          </ul>
        </div>
      </div>

      {/* 하단 바 */}
      <div style={{ borderTop: '1px solid #E5E8EB' }}>
        <div className="flex flex-col items-start justify-between gap-2 px-6 py-4 text-[10px] text-[#999999] sm:flex-row sm:items-center lg:px-[170px]">
          <p>© 2026 정책다모아. 본 사이트는 대한민국 정부가 운영하는 정책정보 포털입니다.</p>
          <div className="flex items-center gap-3">
            <Link
              href="/privacy"
              className="text-[11px] font-medium text-[#666666] hover:text-[#4F6EF7]"
            >
              개인정보처리방침
            </Link>
            <span className="text-[#999999]">|</span>
            <Link href="/terms" className="text-[11px] text-[#999999] hover:text-[#4F6EF7]">
              이용약관
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
