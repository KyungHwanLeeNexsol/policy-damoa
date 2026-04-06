// @MX:NOTE [AUTO] 추천 기능 공용 타입 (SPEC-AI-001)

export interface RecommendationItem {
  policyId: string;
  score: number;
  rank: number;
  reason: string;
  title?: string;
  category?: string | null;
  region?: string | null;
  deadline?: string | null;
}

export interface RecommendationsResult {
  recommendations: RecommendationItem[];
  generatedAt: string;
  cached: boolean;
  fallback?: boolean;
}

export type FeedbackRating = 'UP' | 'DOWN';

export interface FeedbackPayload {
  policyId: string;
  rating: FeedbackRating;
}

export interface SimilarPolicyItem {
  id: string;
  title: string;
  category: string | null;
  region: string | null;
  deadline: string | null;
}
