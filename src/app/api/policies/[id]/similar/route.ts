// @MX:NOTE [AUTO] 유사 정책 API (SPEC-AI-001 REQ-AI-017)
// 인증 선택. limit 쿼리 파라미터(기본 5, 최대 10).

import { getSimilarPolicies } from '@/services/ai/similar-policies.service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
  const url = new URL(request.url);
  const rawLimit = Number(url.searchParams.get('limit') ?? '5');
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.trunc(rawLimit), 1), 10) : 5;

  try {
    const similar = await getSimilarPolicies(id, limit);
    return Response.json({ similar }, { status: 200 });
  } catch (err) {
    console.error('[api/policies/[id]/similar] 실패', err);
    return Response.json({ error: 'InternalError' }, { status: 500 });
  }
}
