// @MX:ANCHOR fan_in:3 Web Push 알림 전송 서비스 - Cron, 매칭 엔진, API 라우트에서 호출
import webPush from 'web-push';
import { prisma } from '@/lib/db';
import type { PushPayload } from '@/features/notifications/types';

// VAPID 설정 초기화
if (
  process.env.VAPID_SUBJECT &&
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY
) {
  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

/**
 * 단일 사용자에게 Web Push 알림 전송
 * 410 Gone 응답 시 구독 자동 비활성화
 */
export async function sendPushNotification(
  userId: string,
  payload: PushPayload
): Promise<{ success: boolean; error?: string }> {
  // 활성 Push 구독 조회
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId, isActive: true },
  });

  if (subscriptions.length === 0) {
    return { success: false, error: '활성 Push 구독이 없습니다.' };
  }

  let successCount = 0;

  for (const sub of subscriptions) {
    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        JSON.stringify(payload)
      );

      // 성공 시 NotificationLog 생성
      await prisma.notificationLog.create({
        data: {
          userId,
          type: 'push',
          title: payload.title,
          body: payload.body,
          policyId: payload.policyId,
          status: 'delivered',
        },
      });

      successCount++;
    } catch (error) {
      const webPushError = error as { statusCode?: number; body?: string };

      // 410 Gone = 구독 만료, 자동 비활성화
      if (webPushError?.statusCode === 410) {
        await prisma.pushSubscription.updateMany({
          where: { endpoint: sub.endpoint },
          data: { isActive: false },
        });
      }

      // 실패 로그 기록
      await prisma.notificationLog.create({
        data: {
          userId,
          type: 'push',
          title: payload.title,
          body: payload.body,
          policyId: payload.policyId,
          status: 'failed',
        },
      });
    }
  }

  return {
    success: successCount > 0,
    error: successCount === 0 ? 'Push 전송 실패' : undefined,
  };
}

/**
 * 여러 사용자에게 배치로 Push 알림 전송
 */
export async function sendBulkPushNotifications(
  notifications: Array<{ userId: string; payload: PushPayload }>
): Promise<{ successCount: number; failCount: number }> {
  let successCount = 0;
  let failCount = 0;

  for (const { userId, payload } of notifications) {
    const result = await sendPushNotification(userId, payload);
    if (result.success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  return { successCount, failCount };
}
