// 데이터 수집 서비스 타입 및 Zod 스키마 정의
// 공공데이터포털 + 보조금24 원시 데이터와 정규화된 정책 타입

import { z } from 'zod/v4';

// ============================================
// 공공데이터포털 (data.go.kr) 원시 데이터
// ============================================

/** 공공데이터포털 API 원시 응답 항목 스키마 */
export const RawPublicDataPolicySchema = z.object({
  bizId: z.string(), // 정책 ID
  polyBizSjNm: z.string(), // 정책명 (title)
  polyBizTy: z.string().optional(), // 정책 유형 (category)
  polyItcnCn: z.string().optional(), // 정책 소개 (description)
  sporCn: z.string().optional(), // 지원 내용
  rqutPrdCn: z.string().optional(), // 신청 기간
  majrRqisCn: z.string().optional(), // 주요 요건
  cherCtpcSiteName: z.string().optional(), // 담당 부서명
  cnsgNmor: z.string().optional(), // 담당자명
  tintCherCn: z.string().optional(), // 전화번호
  rfcSiteUrla1: z.string().optional(), // 참고 사이트 URL
  rprsntOrgnNm: z.string().optional(), // 대표 기관명 (sourceAgency)
  mngtMson: z.string().optional(), // 주관 기관
  empmSttsCn: z.string().optional(), // 취업 상태
  accrRqisCn: z.string().optional(), // 학력 요건
  prcpCn: z.string().optional(), // 거주지/소득 조건
  aditRscn: z.string().optional(), // 추가 조건
  prcpLmttTrgtCn: z.string().optional(), // 참여 제한 대상
  rqutUrla: z.string().optional(), // 신청 URL
  jdgnPresCn: z.string().optional(), // 심사/발표 내용
  rqutProcCn: z.string().optional(), // 신청 절차 내용
  ageInfo: z.string().optional(), // 연령 정보
  splzRlmRqisCn: z.string().optional(), // 특화 분야 요건
});

export type RawPublicDataPolicy = z.infer<typeof RawPublicDataPolicySchema>;

// ============================================
// 보조금24 원시 데이터
// ============================================

/** 보조금24 API 원시 응답 항목 스키마 */
export const RawBojo24PolicySchema = z.object({
  svcId: z.string(), // 서비스 ID
  svcNm: z.string(), // 서비스명 (title)
  jurMnofNm: z.string().optional(), // 소관 부처명 (sourceAgency)
  jurOrgNm: z.string().optional(), // 소관 기관명
  svcPurpsCn: z.string().optional(), // 서비스 목적 (description)
  aplyMtdCn: z.string().optional(), // 신청 방법 (applicationMethod)
  svcDtlLink: z.string().optional(), // 상세 링크 (sourceUrl)
  sprtCycNm: z.string().optional(), // 지원 주기
  sltCritCn: z.string().optional(), // 선정 기준
  alwServCn: z.string().optional(), // 지원 내용 (benefitAmount)
  trgterIndvdlArray: z.string().optional(), // 지원 대상 개인
  lifeNmArray: z.string().optional(), // 생애 주기
  bizChrDeptNm: z.string().optional(), // 사업 담당 부서
  inqNum: z.string().optional(), // 문의 번호
  lastModYmd: z.string().optional(), // 최종 수정일
});

export type RawBojo24Policy = z.infer<typeof RawBojo24PolicySchema>;

// ============================================
// 정규화된 정책 데이터
// ============================================

/** 정규화된 정책 스키마 — 두 소스 공통 포맷 */
export const NormalizedPolicySchema = z.object({
  externalId: z.string(), // {SOURCE}:{originalId} (예: PUBLIC_DATA_PORTAL:POL-12345)
  title: z.string(),
  description: z.string().nullable(),
  eligibilityCriteria: z.record(z.string(), z.unknown()).nullable(),
  additionalConditions: z.record(z.string(), z.unknown()).nullable(),
  benefitType: z.string().nullable(),
  benefitAmount: z.string().nullable(),
  applicationMethod: z.string().nullable(),
  applicationDeadline: z.date().nullable(),
  sourceUrl: z.string().nullable(),
  sourceAgency: z.string().nullable(),
  sourceSystem: z.enum(['PUBLIC_DATA_PORTAL', 'BOJO24']),
  status: z.enum(['active', 'expired', 'upcoming']).default('active'),
});

export type NormalizedPolicy = z.infer<typeof NormalizedPolicySchema>;
