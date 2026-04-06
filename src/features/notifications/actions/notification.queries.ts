import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import type { PaginatedNotifications, NotificationLogItem } from '@/features/notifications/types';

const PAGE_SIZE = 20;

/**
 * 현재 사용자의 알림 목록 조회 (커서 기반 페이지네이션)
 */
export async function getNotifications(cursor?: string): Promise<PaginatedNotifications> {
  const session = await auth();
  if (!session?.user?.id) {
    return { items: [], hasMore: false, nextCursor: null };
  }

  const items = await prisma.notificationLog.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: PAGE_SIZE + 1,
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1,
        }
      : {}),
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      policyId: true,
      status: true,
      readAt: true,
      createdAt: true,
    },
  });

  const hasMore = items.length > PAGE_SIZE;
  const pageItems = hasMore ? items.slice(0, PAGE_SIZE) : items;
  const nextCursor = hasMore ? pageItems[pageItems.length - 1].id : null;

  return {
    items: pageItems as NotificationLogItem[],
    hasMore,
    nextCursor,
  };
}

/**
 * 읽지 않은 알림 수 조회
 */
export async function getUnreadCount(): Promise<number> {
  const session = await auth();
  if (!session?.user?.id) return 0;

  return prisma.notificationLog.count({
    where: {
      userId: session.user.id,
      readAt: null,
      status: 'sent',
    },
  });
}
