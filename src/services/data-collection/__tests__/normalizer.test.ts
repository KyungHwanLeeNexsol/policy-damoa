// normalizer 단위 테스트
// RED 단계: normalize 함수의 기대 동작 정의

import { describe, expect, it } from 'vitest';

import { normalize } from '../normalizer';
import type { RawBojo24Policy, RawPublicDataPolicy } from '../types';

// ============================================
// 공공데이터포털 정규화 테스트
// ============================================

describe('normalize — PUBLIC_DATA_PORTAL', () => {
  const validRaw: RawPublicDataPolicy = {
    bizId: 'R2024010112345',
    polyBizSjNm: '청년 내일채움공제',
    polyBizTy: '고용',
    polyItcnCn: '청년 자산 형성 지원 정책입니다.',
    sporCn: '월 12만원 ~ 34만원',
    rprsntOrgnNm: '고용노동부',
    rfcSiteUrla1: 'https://www.work.go.kr',
    rqutProcCn: '온라인 신청',
    majrRqisCn: '만 15세~34세, 중소기업 재직자',
    aditRscn: '병역 이행자 연령 연장',
  };

  it('유효한 데이터를 NormalizedPolicy로 변환해야 한다', () => {
    const result = normalize('PUBLIC_DATA_PORTAL', validRaw);

    expect(result).not.toBeNull();
    expect(result!.externalId).toBe('PUBLIC_DATA_PORTAL:R2024010112345');
    expect(result!.title).toBe('청년 내일채움공제');
    expect(result!.description).toBe('청년 자산 형성 지원 정책입니다.');
    expect(result!.sourceAgency).toBe('고용노동부');
    expect(result!.sourceUrl).toBe('https://www.work.go.kr');
    expect(result!.applicationMethod).toBe('온라인 신청');
    expect(result!.sourceSystem).toBe('PUBLIC_DATA_PORTAL');
    expect(result!.status).toBe('active');
  });

  it('eligibilityCriteria에 주요 요건을 매핑해야 한다', () => {
    const result = normalize('PUBLIC_DATA_PORTAL', validRaw);

    expect(result).not.toBeNull();
    expect(result!.eligibilityCriteria).toEqual({
      mainRequirements: '만 15세~34세, 중소기업 재직자',
    });
  });

  it('additionalConditions에 추가 조건을 매핑해야 한다', () => {
    const result = normalize('PUBLIC_DATA_PORTAL', validRaw);

    expect(result).not.toBeNull();
    expect(result!.additionalConditions).toEqual({
      additionalInfo: '병역 이행자 연령 연장',
    });
  });

  it('선택 필드가 없어도 null로 처리해야 한다', () => {
    const minimal: RawPublicDataPolicy = {
      bizId: 'MINIMAL-001',
      polyBizSjNm: '최소 정책',
    };

    const result = normalize('PUBLIC_DATA_PORTAL', minimal);

    expect(result).not.toBeNull();
    expect(result!.externalId).toBe('PUBLIC_DATA_PORTAL:MINIMAL-001');
    expect(result!.title).toBe('최소 정책');
    expect(result!.description).toBeNull();
    expect(result!.sourceAgency).toBeNull();
    expect(result!.sourceUrl).toBeNull();
    expect(result!.applicationMethod).toBeNull();
    expect(result!.eligibilityCriteria).toBeNull();
    expect(result!.additionalConditions).toBeNull();
  });

  it('bizId가 없으면 null을 반환해야 한다', () => {
    const invalid = { polyBizSjNm: '제목만 있는 데이터' };
    const result = normalize('PUBLIC_DATA_PORTAL', invalid);
    expect(result).toBeNull();
  });

  it('polyBizSjNm이 없으면 null을 반환해야 한다', () => {
    const invalid = { bizId: 'NO-TITLE-001' };
    const result = normalize('PUBLIC_DATA_PORTAL', invalid);
    expect(result).toBeNull();
  });

  it('완전히 잘못된 데이터에 대해 null을 반환해야 한다', () => {
    const result = normalize('PUBLIC_DATA_PORTAL', { foo: 'bar' });
    expect(result).toBeNull();
  });

  it('null/undefined 입력에 대해 null을 반환해야 한다', () => {
    expect(normalize('PUBLIC_DATA_PORTAL', null)).toBeNull();
    expect(normalize('PUBLIC_DATA_PORTAL', undefined)).toBeNull();
  });
});

// ============================================
// 보조금24 정규화 테스트
// ============================================

describe('normalize — BOJO24', () => {
  const validRaw: RawBojo24Policy = {
    svcId: 'WLF00001',
    svcNm: '기초생활보장 생계급여',
    jurMnofNm: '보건복지부',
    svcPurpsCn: '생활이 어려운 사람에게 급여를 지급합니다.',
    aplyMtdCn: '주민센터 방문 신청',
    svcDtlLink: 'https://www.gov.kr/detail/001',
    alwServCn: '월 최대 58만원',
    sltCritCn: '중위소득 30% 이하',
  };

  it('유효한 데이터를 NormalizedPolicy로 변환해야 한다', () => {
    const result = normalize('BOJO24', validRaw);

    expect(result).not.toBeNull();
    expect(result!.externalId).toBe('BOJO24:WLF00001');
    expect(result!.title).toBe('기초생활보장 생계급여');
    expect(result!.description).toBe('생활이 어려운 사람에게 급여를 지급합니다.');
    expect(result!.sourceAgency).toBe('보건복지부');
    expect(result!.applicationMethod).toBe('주민센터 방문 신청');
    expect(result!.sourceUrl).toBe('https://www.gov.kr/detail/001');
    expect(result!.benefitAmount).toBe('월 최대 58만원');
    expect(result!.sourceSystem).toBe('BOJO24');
  });

  it('eligibilityCriteria에 선정 기준을 매핑해야 한다', () => {
    const result = normalize('BOJO24', validRaw);

    expect(result).not.toBeNull();
    expect(result!.eligibilityCriteria).toEqual({
      selectionCriteria: '중위소득 30% 이하',
    });
  });

  it('svcId가 없으면 null을 반환해야 한다', () => {
    const invalid = { svcNm: '제목만' };
    const result = normalize('BOJO24', invalid);
    expect(result).toBeNull();
  });

  it('svcNm이 없으면 null을 반환해야 한다', () => {
    const invalid = { svcId: 'NO-NAME' };
    const result = normalize('BOJO24', invalid);
    expect(result).toBeNull();
  });
});
