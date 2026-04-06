// @MX:NOTE [AUTO] 추천 피드백 upsert API (SPEC-AI-001 REQ-AI-014)
// RecommendationFeedback(@@unique [userId, policyId]) 업서트

import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

const BodySchema = z.object({
  policyId: z.string().min(1),
  rating: z.enum(['UP', 'DOWN']),
});

export async function POST(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let parsed: z.infer<typeof BodySchema>;
  try {
    const body = await request.json();
    parsed = BodySchema.parse(body);
  } catch {
    return Response.json({ error: 'InvalidBody' }, { status: 400 });
  }

  try {
    await prisma.recommendationFeedback.upsert({
      where: {
        userId_policyId: {
          userId: session.user.id,
          policyId: parsed.policyId,
        },
      },
      update: { rating: parsed.rating },
      create: {
        userId: session.user.id,
        policyId: parsed.policyId,
        rating: parsed.rating,
      },
    });
    return Response.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('[api/recommendations/feedback] upsert 실패', err);
    return Response.json({ error: 'InternalError' }, { status: 500 });
  }
}
