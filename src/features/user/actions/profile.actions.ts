'use server';

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { profileUpsertSchema } from '@/features/user/schemas/profile';
import type { ProfileUpsertInput } from '@/features/user/schemas/profile';
import type { ActionResult, UserProfileData } from '@/features/user/types';

/**
 * 사용자 프로필 저장 (생성 또는 업데이트)
 * 위자드 완료 시 호출됨
 */
export async function saveProfile(
  data: ProfileUpsertInput
): Promise<ActionResult<UserProfileData>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = profileUpsertSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((e) => e.message).join(', '),
    };
  }

  try {
    const profile = await prisma.userProfile.upsert({
      where: { userId: session.user.id },
      update: {
        birthYear: parsed.data.birthYear,
        gender: parsed.data.gender,
        occupation: parsed.data.occupation,
        incomeLevel: parsed.data.incomeLevel,
        regionId: parsed.data.regionId,
        familyStatus: parsed.data.familyStatus,
        isPregnant: parsed.data.isPregnant,
        hasChildren: parsed.data.hasChildren,
        childrenCount: parsed.data.childrenCount,
        isDisabled: parsed.data.isDisabled,
        isVeteran: parsed.data.isVeteran,
      },
      create: {
        userId: session.user.id,
        birthYear: parsed.data.birthYear,
        gender: parsed.data.gender,
        occupation: parsed.data.occupation,
        incomeLevel: parsed.data.incomeLevel,
        regionId: parsed.data.regionId,
        familyStatus: parsed.data.familyStatus,
        isPregnant: parsed.data.isPregnant,
        hasChildren: parsed.data.hasChildren,
        childrenCount: parsed.data.childrenCount,
        isDisabled: parsed.data.isDisabled,
        isVeteran: parsed.data.isVeteran,
      },
    });

    return { success: true, data: profile };
  } catch (error) {
    console.error('[Profile] 저장 오류:', error);
    return { success: false, error: '프로필 저장 중 오류가 발생했습니다.' };
  }
}

/**
 * 위자드 완료 후 알림 설정 페이지로 리다이렉트
 */
export async function saveProfileAndRedirect(data: ProfileUpsertInput): Promise<void> {
  const result = await saveProfile(data);
  if (result.success) {
    redirect('/profile/notifications');
  }
}

/**
 * 현재 사용자 프로필 조회
 */
export async function getMyProfile(): Promise<UserProfileData | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  return prisma.userProfile.findUnique({
    where: { userId: session.user.id },
  });
}
