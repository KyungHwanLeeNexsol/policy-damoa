import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Prisma Schema', () => {
  const schemaPath = resolve(__dirname, '../../../prisma/schema.prisma');

  it('prisma validate가 성공해야 한다', () => {
    // prisma validate 명령어를 실행하여 스키마 문법 검증
    // 실패 시 에러를 던지므로 에러 없이 완료되면 성공
    const result = execSync('npx prisma validate', {
      cwd: resolve(__dirname, '../../..'),
      encoding: 'utf-8',
    });
    expect(result).toMatch(/is valid/i);
  });

  describe('모든 필수 모델이 정의되어 있어야 한다', () => {
    const schemaContent = readFileSync(schemaPath, 'utf-8');

    const requiredModels = [
      'User',
      'Account',
      'Session',
      'VerificationToken',
      'Policy',
      'PolicyCategory',
      'PolicyCategoryRelation',
      'Region',
      'UserProfile',
      'UserSavedPolicy',
      'NotificationLog',
    ];

    for (const model of requiredModels) {
      it(`모델 ${model}이 정의되어 있어야 한다`, () => {
        const modelRegex = new RegExp(`model\\s+${model}\\s+\\{`);
        expect(schemaContent).toMatch(modelRegex);
      });
    }
  });

  describe('주요 인덱스와 제약조건이 정의되어 있어야 한다', () => {
    const schemaContent = readFileSync(schemaPath, 'utf-8');

    it('Policy.externalId에 @unique가 있어야 한다', () => {
      // externalId 필드와 @unique 어노테이션 확인
      expect(schemaContent).toMatch(/externalId\s+String\?\s+@unique/);
    });

    it('UserSavedPolicy에 (userId, policyId) 복합 유니크 인덱스가 있어야 한다', () => {
      expect(schemaContent).toMatch(/@@unique\(\[userId,\s*policyId\]\)/);
    });

    it('Policy에 eligibilityCriteria Json 필드가 있어야 한다', () => {
      expect(schemaContent).toMatch(/eligibilityCriteria\s+Json\?/);
    });

    it('Policy에 additionalConditions Json 필드가 있어야 한다', () => {
      expect(schemaContent).toMatch(/additionalConditions\s+Json\?/);
    });

    it('Region에 자기참조 parentId가 있어야 한다', () => {
      expect(schemaContent).toMatch(/parentId\s+String\?/);
      expect(schemaContent).toMatch(/parent\s+Region\?/);
    });
  });
});
