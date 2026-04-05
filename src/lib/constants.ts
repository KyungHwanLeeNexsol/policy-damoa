// 앱 상수
export const APP_NAME = '정책다모아';
export const APP_DESCRIPTION = '모든 정부 정책, 한곳에';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// 정책 카테고리
export const POLICY_CATEGORIES = [
  { id: 'housing', name: '주거·주택', slug: 'housing', icon: 'Home' },
  {
    id: 'employment',
    name: '일자리·고용',
    slug: 'employment',
    icon: 'Briefcase',
  },
  { id: 'startup', name: '창업·사업', slug: 'startup', icon: 'Rocket' },
  { id: 'childcare', name: '육아·보육', slug: 'childcare', icon: 'Baby' },
  {
    id: 'education',
    name: '교육·장학',
    slug: 'education',
    icon: 'GraduationCap',
  },
  { id: 'welfare', name: '복지·의료', slug: 'welfare', icon: 'Heart' },
  { id: 'culture', name: '문화·생활', slug: 'culture', icon: 'Palette' },
] as const;

// 페이지네이션
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// 캐시 TTL (seconds)
export const CACHE_TTL = {
  POLICY_LIST: 15 * 60, // 15분
  POLICY_DETAIL: 60 * 60, // 1시간
  RECOMMENDATIONS: 60 * 60, // 1시간
  CATEGORIES: 24 * 60 * 60, // 24시간
} as const;

// 알림 설정
export const NOTIFICATION_DEFAULTS = {
  DEADLINE_REMINDER_DAYS: [7, 1],
  MAX_DAILY_NOTIFICATIONS: 10,
} as const;
