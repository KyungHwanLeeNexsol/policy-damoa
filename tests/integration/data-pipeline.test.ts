// 데이터 파이프라인 통합 테스트
// 전체 흐름: API 호출 → 정규화 → 중복 제거 → 캐시 무효화

import { describe, expect, it, vi } from 'vitest';

import { normalize } from '@/services/data-collection/normalizer';
import type { RawBojo24Policy, RawPublicDataPolicy } from '@/services/data-collection/types';
import { AuthError, withRetry } from '@/services/data-collection/utils';

describe('데이터 파이프라인 통합 테스트', () => {
  describe('공공데이터포털 → 정규화 흐름', () => {
    it('다수의 원시 데이터를 정규화하면 유효한 것만 남아야 한다', () => {
      const rawItems: unknown[] = [
        // 유효
        { bizId: 'BIZ-001', polyBizSjNm: '청년 정책 1', rprsntOrgnNm: '고용부' },
        // 유효
        { bizId: 'BIZ-002', polyBizSjNm: '청년 정책 2' },
        // 무효 (bizId 없음)
        { polyBizSjNm: '무효 정책' },
        // 무효 (완전히 잘못된 데이터)
        { foo: 'bar' },
        // 무효 (null)
        null,
      ];

      const results = rawItems.map((item) =>
        normalize('PUBLIC_DATA_PORTAL', item),
      );

      const valid = results.filter((r) => r !== null);
      const invalid = results.filter((r) => r === null);

      expect(valid).toHaveLength(2);
      expect(invalid).toHaveLength(3);

      // 첫 번째 유효 결과 검증
      expect(valid[0]!.externalId).toBe('PUBLIC_DATA_PORTAL:BIZ-001');
      expect(valid[0]!.sourceSystem).toBe('PUBLIC_DATA_PORTAL');
    });
  });

  describe('보조금24 → 정규화 흐름', () => {
    it('보조금24 원시 데이터가 올바르게 정규화되어야 한다', () => {
      const raw: RawBojo24Policy = {
        svcId: 'BOJO-001',
        svcNm: '기초연금',
        jurMnofNm: '보건복지부',
        svcPurpsCn: '노인 소득 보장',
        alwServCn: '월 최대 32만원',
      };

      const result = normalize('BOJO24', raw);

      expect(result).not.toBeNull();
      expect(result!.externalId).toBe('BOJO24:BOJO-001');
      expect(result!.sourceSystem).toBe('BOJO24');
      expect(result!.benefitAmount).toBe('월 최대 32만원');
    });
  });

  describe('withRetry + AuthError 통합', () => {
    it('일반 에러는 재시도하고 AuthError는 즉시 전파해야 한다', async () => {
      let callCount = 0;

      // 일반 에러 → 재시도 후 성공
      const retryResult = await withRetry(
        async () => {
          callCount++;
          if (callCount < 3) throw new Error('일시적 오류');
          return '성공';
        },
        { maxRetries: 3, baseDelay: 1 },
      );
      expect(retryResult).toBe('성공');
      expect(callCount).toBe(3);

      // AuthError → 즉시 실패
      await expect(
        withRetry(
          async () => {
            throw new AuthError('인증 만료', 401);
          },
          { maxRetries: 3, baseDelay: 1 },
        ),
      ).rejects.toThrow(AuthError);
    });
  });

  describe('externalId 포맷 검증', () => {
    it('PUBLIC_DATA_PORTAL 소스는 PUBLIC_DATA_PORTAL:{id} 포맷이어야 한다', () => {
      const raw: RawPublicDataPolicy = {
        bizId: 'POL-12345',
        polyBizSjNm: '테스트 정책',
      };
      const result = normalize('PUBLIC_DATA_PORTAL', raw);
      expect(result!.externalId).toMatch(/^PUBLIC_DATA_PORTAL:.+$/);
    });

    it('BOJO24 소스는 BOJO24:{id} 포맷이어야 한다', () => {
      const raw: RawBojo24Policy = {
        svcId: 'svcId-001',
        svcNm: '테스트 서비스',
      };
      const result = normalize('BOJO24', raw);
      expect(result!.externalId).toMatch(/^BOJO24:.+$/);
    });
  });
});
