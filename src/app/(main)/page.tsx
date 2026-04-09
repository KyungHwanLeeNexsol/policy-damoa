// 메인 홈 페이지 - Pencil 디자인 기반
import { RecommendationFeed } from '@/features/recommendations/components/recommendation-feed';

const categories = [
  { key: 'all', label: '전체' },
  { key: 'housing', label: '주거' },
  { key: 'startup', label: '창업' },
  { key: 'job', label: '취업' },
  { key: 'business', label: '상업' },
  { key: 'welfare', label: '복지' },
];

export default function HomePage(): React.ReactNode {
  return (
    <div>
      {/* Hero 배너 */}
      <section
        className="px-6 py-10 lg:px-[170px] lg:py-14"
        style={{
          background: 'linear-gradient(135deg, #4F6EF7 0%, #6B8AFF 100%)',
        }}
      >
        <div className="max-w-3xl">
          <h1 className="text-[28px] font-bold leading-tight text-white">
            나에게 맞는 정책을 찾아보세요
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/80">
            정부·지자체에서 제공하는 수많은 정책 정보를 한곳에서 확인하고,
            <br className="hidden sm:block" />내 상황에 맞는 맞춤 정책을 추천받을 수 있습니다.
          </p>

          {/* 검색 바 */}
          <form
            action="/policies"
            method="get"
            className="mt-8 flex items-center gap-2 rounded-full bg-white p-2 shadow-lg"
          >
            <input
              type="text"
              name="keyword"
              placeholder="어떤 정책을 찾고 계세요?"
              className="flex-1 bg-transparent px-5 py-3 text-[15px] text-[#191F28] placeholder:text-[#8B95A1] focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-full bg-[#4F6EF7] px-7 py-3 text-[15px] font-semibold text-white hover:bg-[#4058D8]"
            >
              검색
            </button>
          </form>
        </div>
      </section>

      {/* 콘텐츠 영역 */}
      <section className="px-6 py-8 lg:px-[170px]">
        {/* 카테고리 필터 */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat, idx) => (
            <button
              key={cat.key}
              type="button"
              className={`rounded-full px-5 py-2 text-[14px] font-medium transition-colors ${
                idx === 0
                  ? 'bg-[#4F6EF7] text-white'
                  : 'bg-white text-[#8B95A1] hover:bg-[#F2F3F6]'
              }`}
              style={idx !== 0 ? { border: '1px solid #E5E8EB' } : undefined}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* 추천 정책 리스트 */}
        <div className="mt-8 space-y-4">
          <h2 className="text-[20px] font-bold text-[#191F28]">맞춤 추천 정책</h2>
          <RecommendationFeed />
        </div>
      </section>
    </div>
  );
}
