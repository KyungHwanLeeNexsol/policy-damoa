// @MX:ANCHOR normalize
// @MX:REASON fan_in >= 3: publicDataPortal.service, bojo24.service, deduplicator 모두 호출
// 불변: 항상 NormalizedPolicy | null 반환 — 예외 없음

import type { SyncSource } from '@/types/sync';

import { type NormalizedPolicy, RawBojo24PolicySchema, RawPublicDataPolicySchema } from './types';

/**
 * 원시 데이터를 NormalizedPolicy로 변환한다.
 * Zod 유효성 검증 실패 시 null 반환 (호출자가 skipCount 증가).
 */
export function normalize(source: SyncSource, raw: unknown): NormalizedPolicy | null {
  if (raw == null) return null;

  switch (source) {
    case 'PUBLIC_DATA_PORTAL':
      return normalizePublicData(raw);
    case 'BOJO24':
      return normalizeBojo24(raw);
    default:
      return null;
  }
}

/** 공공데이터포털 원시 데이터 → NormalizedPolicy */
function normalizePublicData(raw: unknown): NormalizedPolicy | null {
  const parsed = RawPublicDataPolicySchema.safeParse(raw);
  if (!parsed.success) return null;

  const d = parsed.data;

  return {
    externalId: `PUBLIC_DATA_PORTAL:${d.bizId}`,
    title: d.polyBizSjNm,
    description: d.polyItcnCn ?? null,
    eligibilityCriteria: d.majrRqisCn ? { mainRequirements: d.majrRqisCn } : null,
    additionalConditions: d.aditRscn ? { additionalInfo: d.aditRscn } : null,
    benefitType: d.polyBizTy ?? null,
    benefitAmount: d.sporCn ?? null,
    applicationMethod: d.rqutProcCn ?? null,
    applicationDeadline: null,
    sourceUrl: d.rfcSiteUrla1 ?? null,
    sourceAgency: d.rprsntOrgnNm ?? null,
    sourceSystem: 'PUBLIC_DATA_PORTAL',
    status: 'active',
  };
}

/** 보조금24 원시 데이터 → NormalizedPolicy */
function normalizeBojo24(raw: unknown): NormalizedPolicy | null {
  const parsed = RawBojo24PolicySchema.safeParse(raw);
  if (!parsed.success) return null;

  const d = parsed.data;

  return {
    externalId: `BOJO24:${d.svcId}`,
    title: d.svcNm,
    description: d.svcPurpsCn ?? null,
    eligibilityCriteria: d.sltCritCn ? { selectionCriteria: d.sltCritCn } : null,
    additionalConditions: null,
    benefitType: null,
    benefitAmount: d.alwServCn ?? null,
    applicationMethod: d.aplyMtdCn ?? null,
    applicationDeadline: null,
    sourceUrl: d.svcDtlLink ?? null,
    sourceAgency: d.jurMnofNm ?? null,
    sourceSystem: 'BOJO24',
    status: 'active',
  };
}
