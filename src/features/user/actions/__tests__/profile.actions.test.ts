import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveProfile, getMyProfile } from '../profile.actions';

// next/navigation 모킹
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// auth 모킹
vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'user-1', email: 'test@test.com' } }),
}));

// Prisma 모킹
vi.mock('@/lib/db', () => ({
  default: {
    userProfile: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

const validProfileData = {
  birthYear: 1990,
  gender: 'male' as const,
  occupation: 'employee' as const,
  incomeLevel: '80-100' as const,
  regionId: 'region-123',
  familyStatus: 'single' as const,
  isPregnant: false,
  hasChildren: false,
  childrenCount: 0,
  isDisabled: false,
  isVeteran: false,
};

describe('saveProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('유효한 데이터로 프로필을 저장한다', async () => {
    const { default: prisma } = await import('@/lib/db');
    vi.mocked(prisma.userProfile.upsert).mockResolvedValue({
      id: 'profile-1',
      userId: 'user-1',
      ...validProfileData,
      additionalInfo: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const result = await saveProfile(validProfileData);

    expect(result.success).toBe(true);
    expect(prisma.userProfile.upsert).toHaveBeenCalledOnce();
  });

  it('인증되지 않은 사용자는 실패를 반환한다', async () => {
    const { auth } = await import('@/lib/auth');
    vi.mocked(auth).mockResolvedValueOnce(null);

    const result = await saveProfile(validProfileData);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('유효하지 않은 데이터는 거부한다', async () => {
    const result = await saveProfile({
      ...validProfileData,
      birthYear: 1800, // 너무 오래된 연도
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('기존 프로필이 있으면 업데이트한다', async () => {
    const { default: prisma } = await import('@/lib/db');
    vi.mocked(prisma.userProfile.upsert).mockResolvedValue({
      id: 'profile-1',
      userId: 'user-1',
      ...validProfileData,
      birthYear: 1995, // 변경된 값
      additionalInfo: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const result = await saveProfile({ ...validProfileData, birthYear: 1995 });

    expect(result.success).toBe(true);
    expect(result.data?.birthYear).toBe(1995);
  });
});

describe('getMyProfile', () => {
  it('현재 사용자의 프로필을 반환한다', async () => {
    const { default: prisma } = await import('@/lib/db');
    vi.mocked(prisma.userProfile.findUnique).mockResolvedValue({
      id: 'profile-1',
      userId: 'user-1',
      ...validProfileData,
      additionalInfo: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const result = await getMyProfile();

    expect(result).not.toBeNull();
    expect(result?.userId).toBe('user-1');
  });

  it('인증되지 않은 사용자는 null을 반환한다', async () => {
    const { auth } = await import('@/lib/auth');
    vi.mocked(auth).mockResolvedValueOnce(null);

    const result = await getMyProfile();
    expect(result).toBeNull();
  });
});
