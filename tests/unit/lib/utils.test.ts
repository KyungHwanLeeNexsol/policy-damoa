// 유틸리티 함수 테스트
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { cn, formatDate, formatCurrency, getDday, truncate } from '@/lib/utils';

describe('cn', () => {
  it('Tailwind 클래스를 병합한다', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});

describe('formatDate', () => {
  it("'short' 포맷으로 날짜를 반환한다", () => {
    const result = formatDate(new Date('2024-03-15'), 'short');
    // ko-KR short 포맷: YYYY. MM. DD.
    expect(result).toContain('2024');
    expect(result).toContain('03');
    expect(result).toContain('15');
  });

  it("'full' 포맷으로 날짜를 반환한다", () => {
    const result = formatDate(new Date('2024-03-15'), 'full');
    // ko-KR full 포맷: YYYY년 M월 D일
    expect(result).toContain('2024');
    expect(result).toContain('3');
    expect(result).toContain('15');
  });

  it("'relative' 포맷: 오늘 날짜는 '오늘'을 반환한다", () => {
    const result = formatDate(new Date(), 'relative');
    expect(result).toBe('오늘');
  });

  it("'relative' 포맷: 어제 날짜는 '어제'를 반환한다", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const result = formatDate(yesterday, 'relative');
    expect(result).toBe('어제');
  });

  it("'relative' 포맷: 3일 전은 '3일 전'을 반환한다", () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const result = formatDate(threeDaysAgo, 'relative');
    expect(result).toBe('3일 전');
  });

  it('문자열 날짜를 파싱한다', () => {
    const result = formatDate('2024-03-15', 'short');
    expect(result).toContain('2024');
  });

  it("기본 포맷은 'short'이다", () => {
    const result = formatDate(new Date('2024-03-15'));
    expect(result).toContain('2024');
  });
});

describe('formatCurrency', () => {
  it('한국 원화 형식으로 포맷한다', () => {
    const result = formatCurrency(50000);
    // Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' })
    expect(result).toContain('50,000');
  });

  it('0원을 포맷한다', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
  });

  it('큰 금액을 포맷한다', () => {
    const result = formatCurrency(1000000);
    expect(result).toContain('1,000,000');
  });
});

describe('getDday', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T00:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("오늘이 마감일이면 'D-Day'를 반환한다", () => {
    expect(getDday(new Date('2024-06-15'))).toBe('D-Day');
  });

  it("마감일이 5일 남았으면 'D-5'를 반환한다", () => {
    expect(getDday(new Date('2024-06-20'))).toBe('D-5');
  });

  it("마감일이 지났으면 '마감'을 반환한다", () => {
    expect(getDday(new Date('2024-06-10'))).toBe('마감');
  });

  it('문자열 날짜를 파싱한다', () => {
    expect(getDday('2024-06-20')).toBe('D-5');
  });
});

describe('truncate', () => {
  it("긴 텍스트를 잘라서 '...'을 붙인다", () => {
    expect(truncate('이것은 아주 긴 텍스트입니다', 5)).toBe('이것은 아...');
  });

  it('maxLength보다 짧은 텍스트는 그대로 반환한다', () => {
    expect(truncate('짧은', 10)).toBe('짧은');
  });

  it('maxLength와 같은 길이의 텍스트는 그대로 반환한다', () => {
    expect(truncate('정확히', 3)).toBe('정확히');
  });
});
