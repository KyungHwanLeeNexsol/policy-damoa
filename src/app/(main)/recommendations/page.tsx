// @MX:NOTE [AUTO] 추천 전용 페이지
import { RecommendationFeed } from '@/features/recommendations/components/recommendation-feed';

export const metadata = {
  title: '맞춤 정책 추천',
};

export default function RecommendationsPage() {
  return (
    <main className="container mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">맞춤 정책 추천</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          프로필을 기반으로 AI가 선별한 정책이에요.
        </p>
      </header>
      <RecommendationFeed />
    </main>
  );
}
