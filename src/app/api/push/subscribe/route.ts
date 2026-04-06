import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { pushSubscribeSchema } from '@/features/notifications/schemas/preferences';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = pushSubscribeSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: '유효하지 않은 구독 데이터입니다.' }, { status: 400 });
    }

    const { endpoint, keys } = parsed.data;

    // 구독 정보 저장 (기존 endpoint 있으면 재활성화)
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId: session.user.id,
        p256dh: keys.p256dh,
        auth: keys.auth,
        isActive: true,
      },
      create: {
        userId: session.user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        isActive: true,
      },
    });

    // 알림 설정에서 Push 활성화
    await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: { pushEnabled: true },
      create: {
        userId: session.user.id,
        pushEnabled: true,
        emailEnabled: true,
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('[Push] 구독 저장 오류:', error);
    return Response.json({ error: '구독 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
