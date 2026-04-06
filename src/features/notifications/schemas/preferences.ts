// 알림 환경설정 Zod 스키마
import { z } from 'zod';

export const notificationPreferenceSchema = z.object({
  pushEnabled: z.boolean().default(false),
  emailEnabled: z.boolean().default(true),
  digestFrequency: z.enum(['immediate', 'daily', 'weekly']).default('daily'),
  newPolicyMatch: z.boolean().default(true),
  deadlineReminder: z.boolean().default(true),
});

// Push 구독 API 요청 스키마
export const pushSubscribeSchema = z.object({
  endpoint: z.string().url('유효한 Push 엔드포인트 URL이 아닙니다.'),
  keys: z.object({
    p256dh: z.string().min(1, 'p256dh 키가 필요합니다.'),
    auth: z.string().min(1, 'auth 키가 필요합니다.'),
  }),
});

// Push 구독 해지 스키마
export const pushUnsubscribeSchema = z.object({
  endpoint: z.string().url('유효한 Push 엔드포인트 URL이 아닙니다.'),
});

export type NotificationPreferenceInput = z.infer<typeof notificationPreferenceSchema>;
export type PushSubscribeInput = z.infer<typeof pushSubscribeSchema>;
export type PushUnsubscribeInput = z.infer<typeof pushUnsubscribeSchema>;
