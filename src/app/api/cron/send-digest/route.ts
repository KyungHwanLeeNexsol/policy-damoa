import { sendDigestEmail } from '@/services/notification/email.service';
import prisma from '@/lib/db';

export const maxDuration = 900;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const now = new Date();
    const isMonday = now.getUTCDay() === 1; // 월요일 여부 (UTC 기준, 한국시간 +9)

    // 이메일 활성화 + 다이제스트 모드 사용자 조회
    const preferences = await prisma.notificationPreference.findMany({
      where: {
        emailEnabled: true,
        digestFrequency: { in: ['daily', ...(isMonday ? ['weekly'] : [])] },
        newPolicyMatch: true,
      },
      include: {
        user: { select: { id: true, email: true } },
      },
    });

    let sentCount = 0;
    let skippedCount = 0;

    for (const pref of preferences) {
      if (!pref.user.email) {
        skippedCount++;
        continue;
      }

      // 사용자의 미알림 매칭 결과 조회
      const matches = await prisma.matchingResult.findMany({
        where: {
          userId: pref.user.id,
          notified: false,
        },
        include: {
          // 정책 정보는 별도 쿼리
        },
      });

      if (matches.length === 0) {
        skippedCount++;
        continue;
      }

      // 정책 상세 조회
      const policyIds = matches.map((m) => m.policyId);
      const policies = await prisma.policy.findMany({
        where: { id: { in: policyIds } },
        select: { id: true, title: true, benefitAmount: true, applicationDeadline: true },
      });

      // 다이제스트 이메일 발송
      const result = await sendDigestEmail({
        to: pref.user.email,
        policies: policies.map((p) => ({
          id: p.id,
          title: p.title,
          benefit: p.benefitAmount,
          deadline: p.applicationDeadline,
          url: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/policies/${p.id}`,
        })),
      });

      if (result.success) {
        // 매칭 결과를 알림 완료로 표시
        await prisma.matchingResult.updateMany({
          where: { userId: pref.user.id, notified: false },
          data: { notified: true },
        });

        // 다이제스트 알림 로그 생성
        await prisma.notificationLog.create({
          data: {
            userId: pref.user.id,
            type: 'email',
            title: `맞춤 정책 다이제스트 (${policies.length}건)`,
            status: 'sent',
          },
        });

        sentCount++;
      } else {
        skippedCount++;
      }
    }

    return Response.json({ success: true, sent: sentCount, skipped: skippedCount });
  } catch (error) {
    console.error('[Cron] send-digest 오류:', error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}
