// @MX:ANCHOR fan_in:3 이메일 알림 전송 서비스 - Cron, 매칭 엔진, API에서 호출
import { Resend } from 'resend';
import { prisma } from '@/lib/db';
import type { EmailNotificationData, DigestEmailData } from '@/features/notifications/types';

// 빌드 타임이 아닌 런타임에 인스턴스 생성 (환경변수 미설정 시 빌드 오류 방지)
function getResend(): Resend {
  return new Resend(process.env.RESEND_API_KEY);
}
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@policy-damoa.kr';

/**
 * exponential backoff 재시도 유틸리티
 * 최대 maxRetries회 시도, 실패 시 마지막 에러를 던짐
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        // exponential backoff: 1초, 2초, 4초
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError;
}

/**
 * 단일 정책 매칭 이메일 전송 (즉시 발송 모드)
 */
export async function sendMatchEmail(
  data: EmailNotificationData
): Promise<{ success: boolean; error?: string }> {
  try {
    await withRetry(async () => {
      const result = await getResend().emails.send({
        from: FROM_EMAIL,
        to: data.to,
        subject: data.subject,
        html: buildMatchEmailHtml(data),
      });

      if (result.error) {
        throw new Error(result.error.message);
      }
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * 다이제스트 이메일 전송 (일간/주간)
 */
export async function sendDigestEmail(
  data: DigestEmailData
): Promise<{ success: boolean; error?: string }> {
  if (data.policies.length === 0) {
    return { success: true }; // 발송할 내용 없음
  }

  try {
    await withRetry(async () => {
      const result = await getResend().emails.send({
        from: FROM_EMAIL,
        to: data.to,
        subject: `[정책다모아] 매칭된 정책 ${data.policies.length}건을 확인하세요`,
        html: buildDigestEmailHtml(data),
      });

      if (result.error) {
        throw new Error(result.error.message);
      }
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * 사용자에게 이메일 알림 발송 + NotificationLog 기록
 * 실패 시 3회 재시도 후 failed 상태로 기록
 */
export async function sendEmailNotification(
  userId: string,
  userEmail: string,
  policyId: string,
  policyTitle: string,
  policyDescription: string
): Promise<void> {
  const emailData: EmailNotificationData = {
    to: userEmail,
    subject: `[정책다모아] 새로운 맞춤 정책: ${policyTitle}`,
    policyTitle,
    policyDescription,
    policyUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/policies/${policyId}`,
  };

  const result = await sendMatchEmail(emailData);

  await prisma.notificationLog.create({
    data: {
      userId,
      type: 'email',
      title: policyTitle,
      body: policyDescription,
      policyId,
      status: result.success ? 'sent' : 'failed',
    },
  });
}

// HTML 이메일 빌더
function buildMatchEmailHtml(data: EmailNotificationData): string {
  return `
<!DOCTYPE html>
<html lang="ko">
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1a56db;">새로운 맞춤 정책이 있습니다</h1>
  <h2>${data.policyTitle}</h2>
  <p>${data.policyDescription}</p>
  ${data.deadline ? `<p><strong>신청 마감:</strong> ${data.deadline}</p>` : ''}
  <a href="${data.policyUrl}" style="background: #1a56db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
    정책 상세 보기
  </a>
  <hr style="margin-top: 32px;" />
  <p style="color: #6b7280; font-size: 12px;">정책다모아 - 나에게 맞는 정책을 찾아드립니다.</p>
</body>
</html>`;
}

function buildDigestEmailHtml(data: DigestEmailData): string {
  const policyList = data.policies
    .map(
      (p) => `
    <li style="margin-bottom: 16px;">
      <strong>${p.title}</strong>
      ${p.benefit ? `<p>${p.benefit}</p>` : ''}
      ${p.deadline ? `<p>마감: ${new Date(p.deadline).toLocaleDateString('ko-KR')}</p>` : ''}
      <a href="${p.url}">상세 보기</a>
    </li>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="ko">
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1a56db;">맞춤 정책 다이제스트</h1>
  <p>총 <strong>${data.policies.length}건</strong>의 맞춤 정책이 있습니다.</p>
  <ul style="padding: 0; list-style: none;">${policyList}</ul>
  <hr style="margin-top: 32px;" />
  <p style="color: #6b7280; font-size: 12px;">정책다모아 알림 설정에서 수신 주기를 변경할 수 있습니다.</p>
</body>
</html>`;
}
