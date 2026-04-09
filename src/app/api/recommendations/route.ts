// @MX:NOTE [AUTO] 추천 조회 API (SPEC-AI-001 REQ-AI-010)
// 401 Unauthorized / 422 프로필 미완성 / 200 성공

import { auth } from '@/lib/auth';
import {
  generateRecommendations,
  ProfileIncompleteError,
} from '@/services/ai/recommendation.service';

export const maxDuration = 60;

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await generateRecommendations(session.user.id);
    return Response.json(result, { status: 200 });
  } catch (err) {
    if (err instanceof ProfileIncompleteError) {
      return Response.json({ error: 'ProfileIncomplete', message: err.message }, { status: 422 });
    }
    console.error('[api/recommendations] 내부 오류', err);
    return Response.json({ error: 'InternalError' }, { status: 500 });
  }
}
