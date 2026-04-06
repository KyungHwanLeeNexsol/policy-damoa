'use server';

import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import type { ActionResult } from '@/features/notifications/types';

/**
 * 단일 알림 읽음 처리
 */
export async function markAsRead(notificationId: string): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await prisma.notificationLog.updateMany({
      where: {
        id: notificationId,
        userId: session.user.id,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return { success: true };
  } catch (error) {
    console.error('[Notification] 읽음 처리 오류:', error);
    return { success: false, error: '알림 읽음 처리 중 오류가 발생했습니다.' };
  }
}

/**
 * 모든 알림 읽음 처리
 */
export async function markAllAsRead(): Promise<ActionResult<{ count: number }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const result = await prisma.notificationLog.updateMany({
      where: {
        userId: session.user.id,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return { success: true, data: { count: result.count } };
  } catch (error) {
    console.error('[Notification] 전체 읽음 처리 오류:', error);
    return { success: false, error: '알림 전체 읽음 처리 중 오류가 발생했습니다.' };
  }
}

/**
 * 알림 설정 저장
 */
export async function saveNotificationPreferences(data: {
  pushEnabled?: boolean;
  emailEnabled?: boolean;
  digestFrequency?: string;
  newPolicyMatch?: boolean;
  deadlineReminder?: boolean;
}): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: data,
      create: {
        userId: session.user.id,
        pushEnabled: data.pushEnabled ?? false,
        emailEnabled: data.emailEnabled ?? true,
        digestFrequency: data.digestFrequency ?? 'daily',
        newPolicyMatch: data.newPolicyMatch ?? true,
        deadlineReminder: data.deadlineReminder ?? true,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('[Notification] 설정 저장 오류:', error);
    return { success: false, error: '알림 설정 저장 중 오류가 발생했습니다.' };
  }
}

/**
 * 현재 사용자의 알림 설정 조회
 */
export async function getNotificationPreferences() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return prisma.notificationPreference.findUnique({
    where: { userId: session.user.id },
  });
}
