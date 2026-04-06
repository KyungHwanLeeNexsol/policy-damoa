import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendMatchEmail, sendDigestEmail, sendEmailNotification } from '../email.service';

// vi.mock은 호이스팅되므로 vi.hoisted()로 mockEmailSend 먼저 선언
const { mockEmailSend } = vi.hoisted(() => ({
  mockEmailSend: vi.fn().mockResolvedValue({ data: { id: 'email-123' }, error: null }),
}));

// Resend 모킹 - class constructor이므로 function 사용
vi.mock('resend', () => {
  return {
    Resend: vi.fn(function () {
      return { emails: { send: mockEmailSend } };
    }),
  };
});

// Prisma 모킹
vi.mock('@/lib/db', () => ({
  default: {
    notificationLog: {
      create: vi.fn(),
    },
  },
}));

describe('sendMatchEmail', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockEmailSend.mockResolvedValue({ data: { id: 'email-123' }, error: null });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('이메일을 성공적으로 전송한다', async () => {
    const result = await sendMatchEmail({
      to: 'user@example.com',
      subject: '[정책다모아] 새로운 맞춤 정책',
      policyTitle: '청년 지원금',
      policyDescription: '만 19-34세 청년 대상',
      policyUrl: 'https://policy-damoa.kr/policies/1',
    });

    expect(result.success).toBe(true);
  });

  it('Resend API 오류 시 실패를 반환한다', async () => {
    // 모든 재시도에서 실패하도록 설정
    mockEmailSend.mockResolvedValue({
      data: null,
      error: { message: 'API Error', name: 'api_error' },
    });

    const promise = sendMatchEmail({
      to: 'user@example.com',
      subject: '테스트',
      policyTitle: '테스트 정책',
      policyDescription: '설명',
      policyUrl: 'https://example.com',
    });

    // withRetry 지연을 빠르게 처리
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.success).toBe(false);
  });
});

describe('sendDigestEmail', () => {
  beforeEach(() => {
    mockEmailSend.mockResolvedValue({ data: { id: 'email-123' }, error: null });
  });

  it('정책이 없으면 발송하지 않고 성공 반환', async () => {
    const result = await sendDigestEmail({ to: 'user@example.com', policies: [] });
    expect(result.success).toBe(true);
  });

  it('여러 정책을 담은 다이제스트 이메일을 전송한다', async () => {
    const result = await sendDigestEmail({
      to: 'user@example.com',
      policies: [
        { id: '1', title: '청년 지원금', benefit: '월 50만원', deadline: new Date('2026-12-31'), url: '/policies/1' },
        { id: '2', title: '창업 지원금', benefit: '최대 500만원', deadline: null, url: '/policies/2' },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe('sendEmailNotification', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockEmailSend.mockResolvedValue({ data: { id: 'email-123' }, error: null });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('이메일 전송 성공 시 sent 상태로 NotificationLog를 생성한다', async () => {
    const { default: prisma } = await import('@/lib/db');
    vi.mocked(prisma.notificationLog.create).mockResolvedValue({} as never);

    await sendEmailNotification(
      'user-1',
      'user@example.com',
      'policy-1',
      '청년 취업 지원금',
      '만 19-34세 취업준비생 대상'
    );

    expect(prisma.notificationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          type: 'email',
          status: 'sent',
        }),
      })
    );
  });

  it('이메일 전송 실패 시 failed 상태로 NotificationLog를 생성한다', async () => {
    const { default: prisma } = await import('@/lib/db');
    // 모든 재시도에서 실패하도록 설정
    mockEmailSend.mockRejectedValue(new Error('Network error'));
    vi.mocked(prisma.notificationLog.create).mockResolvedValue({} as never);

    const promise = sendEmailNotification(
      'user-1',
      'user@example.com',
      'policy-1',
      '청년 취업 지원금',
      '설명'
    );

    await vi.runAllTimersAsync();
    await promise;

    expect(prisma.notificationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'failed' }),
      })
    );
  });
});
