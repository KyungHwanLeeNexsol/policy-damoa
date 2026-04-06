import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { pushUnsubscribeSchema } from '@/features/notifications/schemas/preferences';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = pushUnsubscribeSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: '유효하지 않은 엔드포인트입니다.' }, { status: 400 });
    }

    // 구독 비활성화 (soft-delete)
    await prisma.pushSubscription.updateMany({
      where: {
        userId: session.user.id,
        endpoint: parsed.data.endpoint,
      },
      data: { isActive: false },
    });

    // 활성 구독이 없으면 Push 설정 비활성화
    const activeCount = await prisma.pushSubscription.count({
      where: { userId: session.user.id, isActive: true },
    });

    if (activeCount === 0) {
      await prisma.notificationPreference.updateMany({
        where: { userId: session.user.id },
        data: { pushEnabled: false },
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('[Push] 구독 해지 오류:', error);
    return Response.json({ error: '구독 해지 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
