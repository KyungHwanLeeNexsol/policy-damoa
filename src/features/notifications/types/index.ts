// 알림 관련 타입 정의

export type NotificationType =
  | 'push'
  | 'email'
  | 'new_match'
  | 'deadline_7d'
  | 'deadline_1d'
  | 'digest';

export type NotificationStatus = 'sent' | 'delivered' | 'read' | 'failed';

export type DigestFrequency = 'immediate' | 'daily' | 'weekly';

// 알림 로그 항목 타입
export interface NotificationLogItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  policyId: string | null;
  readAt: Date | null;
  status: NotificationStatus;
  sentAt: Date;
}

// 알림 환경설정 타입
export interface NotificationPreferenceData {
  id: string;
  userId: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  digestFrequency: DigestFrequency;
  newPolicyMatch: boolean;
  deadlineReminder: boolean;
}

// Push 구독 정보 타입
export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Web Push 알림 페이로드 타입
export interface PushPayload {
  title: string;
  body: string;
  url: string;
  policyId?: string;
}

// 이메일 알림 데이터 타입
export interface EmailNotificationData {
  to: string;
  subject: string;
  policyTitle: string;
  policyDescription: string;
  policyUrl: string;
  deadline?: string;
}

// 다이제스트 이메일 데이터 타입
export interface DigestEmailData {
  to: string;
  policies: Array<{
    id: string;
    title: string;
    benefit: string | null;
    deadline: Date | null;
    url: string;
  }>;
}

// cursor 페이지네이션 결과 타입
export interface PaginatedNotifications {
  items: NotificationLogItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

// Server Action 응답 타입
export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
