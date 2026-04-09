import { prisma } from '@/lib/db';
import { sendPushNotification } from '@/services/notification/push.service';
import { sendEmailNotification } from '@/services/notification/email.service';

export const maxDuration = 300;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in1Day = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // 7일 이내 마감 정책 조회
    const policiesDeadlineSoon = await prisma.policy.findMany({
      where: {
        status: 'active',
        applicationDeadline: {
          gte: now,
          lte: in7Days,
        },
      },
      select: { id: true, title: true, description: true, applicationDeadline: true },
    });

    let notifiedCount = 0;

    for (const policy of policiesDeadlineSoon) {
      const isUrgent = policy.applicationDeadline! <= in1Day;
      const notifType = isUrgent ? 'deadline_1d' : 'deadline_7d';
      const notifTitle = isUrgent ? `[마감 임박] ${policy.title}` : `[마감 7일 전] ${policy.title}`;

      // 이 정책에 매칭된 사용자 목록 조회
      const matchedUsers = await prisma.matchingResult.findMany({
        where: { policyId: policy.id },
        select: { userId: true },
      });

      for (const { userId } of matchedUsers) {
        // 중복 알림 방지: 이미 같은 유형 마감 알림 전송 여부 확인
        const existing = await prisma.notificationLog.findFirst({
          where: {
            userId,
            policyId: policy.id,
            type: notifType,
          },
        });

        if (existing) continue; // 이미 전송됨

        // 알림 설정 확인
        const preference = await prisma.notificationPreference.findUnique({
          where: { userId },
        });

        if (!preference?.deadlineReminder) continue;

        // Push 알림
        if (preference.pushEnabled) {
          await sendPushNotification(userId, {
            title: notifTitle,
            body: `${policy.title} 신청 마감이 다가왔습니다.`,
            url: `/policies/${policy.id}`,
            policyId: policy.id,
          });
        }

        // 이메일 알림 (즉시 모드)
        if (preference.emailEnabled && preference.digestFrequency === 'immediate') {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true },
          });
          if (user?.email) {
            await sendEmailNotification(
              userId,
              user.email,
              policy.id,
              notifTitle,
              policy.description ?? ''
            );
          }
        } else if (preference.emailEnabled) {
          // 다이제스트 모드: NotificationLog만 생성 (send-digest Cron에서 발송)
          await prisma.notificationLog.create({
            data: {
              userId,
              type: notifType,
              title: notifTitle,
              body: `신청 마감: ${policy.applicationDeadline?.toLocaleDateString('ko-KR')}`,
              policyId: policy.id,
              status: 'sent',
            },
          });
        }

        notifiedCount++;
      }
    }

    return Response.json({ success: true, notified: notifiedCount });
  } catch (error) {
    console.error('[Cron] deadline-reminder 오류:', error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}
