// @MX:WARN Cron 900초 타임아웃 주의 - 대량 처리 시 배치 분할 필수
import { matchPoliciesForUsers } from '@/services/notification/matching.service';
import { sendPushNotification } from '@/services/notification/push.service';
import { sendEmailNotification } from '@/services/notification/email.service';
import prisma from '@/lib/db';

export const maxDuration = 900;

export async function GET(request: Request) {
  // Cron 인증 (CRON_SECRET Bearer 토큰)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 1단계: 정책-사용자 매칭 실행
    const matchResult = await matchPoliciesForUsers();

    // 2단계: 미알림 매칭 결과 조회 (알림 설정에 따라 발송)
    const unnotifiedMatches = await prisma.matchingResult.findMany({
      where: { notified: false },
      include: {
        // 관련 사용자 정보 조회를 위해 직접 쿼리
      },
      take: 500, // 1회 실행당 최대 500건
    });

    let notifiedCount = 0;

    for (const match of unnotifiedMatches) {
      // 사용자 알림 설정 조회
      const preference = await prisma.notificationPreference.findUnique({
        where: { userId: match.userId },
      });

      if (!preference) continue;

      // 정책 정보 조회
      const policy = await prisma.policy.findUnique({
        where: { id: match.policyId },
        select: { title: true, description: true },
      });

      if (!policy) continue;

      // 사용자 이메일 조회
      const user = await prisma.user.findUnique({
        where: { id: match.userId },
        select: { email: true },
      });

      // Web Push 알림
      if (preference.pushEnabled && preference.newPolicyMatch) {
        await sendPushNotification(match.userId, {
          title: '새로운 맞춤 정책',
          body: policy.title,
          url: `/policies/${match.policyId}`,
          policyId: match.policyId,
        });
      }

      // 이메일 알림 (즉시 발송 모드만)
      if (
        preference.emailEnabled &&
        preference.newPolicyMatch &&
        preference.digestFrequency === 'immediate' &&
        user?.email
      ) {
        await sendEmailNotification(
          match.userId,
          user.email,
          match.policyId,
          policy.title,
          policy.description ?? ''
        );
      }

      // 알림 완료 표시
      await prisma.matchingResult.update({
        where: { id: match.id },
        data: { notified: true },
      });

      notifiedCount++;
    }

    return Response.json({
      success: true,
      matched: matchResult.matched,
      notified: notifiedCount,
      skipped: matchResult.skipped,
    });
  } catch (error) {
    console.error('[Cron] match-policies 오류:', error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}
