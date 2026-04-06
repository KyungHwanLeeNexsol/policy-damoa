// withRetry + AuthError 단위 테스트

import { describe, expect, it, vi } from 'vitest';

import { AuthError, withRetry } from '../utils';

describe('AuthError', () => {
  it('statusCode와 name을 올바르게 설정해야 한다', () => {
    const err = new AuthError('인증 실패', 401);
    expect(err.message).toBe('인증 실패');
    expect(err.statusCode).toBe(401);
    expect(err.name).toBe('AuthError');
    expect(err).toBeInstanceOf(Error);
  });
});

describe('withRetry', () => {
  it('첫 시도에 성공하면 결과를 반환해야 한다', async () => {
    const fn = vi.fn().mockResolvedValue('성공');
    const result = await withRetry(fn);
    expect(result).toBe('성공');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('실패 후 재시도하여 성공하면 결과를 반환해야 한다', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('일시적 오류'))
      .mockResolvedValue('재시도 성공');

    const result = await withRetry(fn, { maxRetries: 3, baseDelay: 1 });
    expect(result).toBe('재시도 성공');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('최대 재시도 횟수를 초과하면 마지막 에러를 던져야 한다', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('계속 실패'));

    await expect(
      withRetry(fn, { maxRetries: 2, baseDelay: 1 }),
    ).rejects.toThrow('계속 실패');
    // 초기 1회 + 재시도 2회 = 총 3회
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('AuthError는 재시도하지 않고 즉시 전파해야 한다', async () => {
    const authError = new AuthError('인증 만료', 401);
    const fn = vi.fn().mockRejectedValue(authError);

    await expect(withRetry(fn, { maxRetries: 3, baseDelay: 1 })).rejects.toThrow(
      authError,
    );
    // AuthError는 재시도 없이 즉시 실패
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('AuthError 403도 재시도하지 않아야 한다', async () => {
    const authError = new AuthError('접근 금지', 403);
    const fn = vi.fn().mockRejectedValue(authError);

    await expect(withRetry(fn, { maxRetries: 3, baseDelay: 1 })).rejects.toThrow(
      authError,
    );
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('기본 maxRetries는 3이어야 한다', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('실패'));

    await expect(withRetry(fn, { baseDelay: 1 })).rejects.toThrow();
    // 초기 1회 + 기본 재시도 3회 = 총 4회
    expect(fn).toHaveBeenCalledTimes(4);
  });
});
