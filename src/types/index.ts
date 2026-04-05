// 정책 관련 타입
export interface Policy {
  id: string;
  externalId: string | null;
  title: string;
  description: string | null;
  eligibilityCriteria: Record<string, unknown> | null;
  additionalConditions: Record<string, unknown> | null;
  benefitType: string | null;
  benefitAmount: string | null;
  applicationMethod: string | null;
  applicationDeadline: Date | null;
  sourceUrl: string | null;
  sourceAgency: string | null;
  regionId: string | null;
  status: 'active' | 'expired' | 'upcoming';
  createdAt: Date;
  updatedAt: Date;
}

export interface PolicyCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
}

export interface Region {
  id: string;
  name: string;
  code: string;
  level: number;
  parentId: string | null;
}

// 사용자 프로필
export interface UserProfile {
  id: string;
  userId: string;
  birthYear: number | null;
  gender: string | null;
  occupation: string | null;
  incomeLevel: string | null;
  regionId: string | null;
  familyStatus: string | null;
  isPregnant: boolean;
  hasChildren: boolean;
  childrenCount: number;
  isDisabled: boolean;
  isVeteran: boolean;
}

// API 응답 타입
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 검색 필터
export interface PolicySearchFilters {
  query?: string;
  categoryId?: string;
  regionCode?: string;
  ageRange?: { min: number; max: number };
  benefitType?: string;
  status?: 'active' | 'expired' | 'upcoming';
  sortBy?: 'newest' | 'deadline' | 'relevance';
}
