// 상수 정의 테스트
import { describe, expect, it } from 'vitest';
import { APP_NAME, POLICY_CATEGORIES } from '@/lib/constants';

describe('APP_NAME', () => {
  it("앱 이름은 '정책다모아'이다", () => {
    expect(APP_NAME).toBe('정책다모아');
  });
});

describe('POLICY_CATEGORIES', () => {
  it('7개의 카테고리가 있다', () => {
    expect(POLICY_CATEGORIES).toHaveLength(7);
  });

  it('각 카테고리는 필수 필드(id, name, slug, icon)를 가진다', () => {
    for (const category of POLICY_CATEGORIES) {
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('slug');
      expect(category).toHaveProperty('icon');
      expect(typeof category.id).toBe('string');
      expect(typeof category.name).toBe('string');
      expect(typeof category.slug).toBe('string');
      expect(typeof category.icon).toBe('string');
    }
  });
});
