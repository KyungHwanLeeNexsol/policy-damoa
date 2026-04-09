'use server';

// @MX:NOTE [AUTO] 추천 피드백 서버 액션 (SPEC-AI-001)

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

import type { FeedbackRating } from '../types';

export async function submitFeedbackAction(
  policyId: string,
  rating: FeedbackRating
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }
  try {
    await prisma.recommendationFeedback.upsert({
      where: {
        userId_policyId: {
          userId: session.user.id,
          policyId,
        },
      },
      update: { rating },
      create: {
        userId: session.user.id,
        policyId,
        rating,
      },
    });
    return { success: true };
  } catch (err) {
    console.error('[feedback.action] upsert 실패', err);
    return { success: false, error: 'InternalError' };
  }
}
