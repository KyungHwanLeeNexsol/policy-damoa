// 데이터 수집 유틸리티 — 재시도 로직 및 인증 에러

/** 인증 오류 (401/403). 재시도하지 않고 즉시 전파해야 함 */
export class AuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * 지수 백오프 재시도 래퍼.
 * AuthError는 재시도하지 않고 즉시 throw.
 * 지연: baseDelay * 2^attempt (1초, 2초, 4초)
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelay?: number } = {},
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000 } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      // AuthError는 재시도하지 않음
      if (error instanceof AuthError) {
        throw error;
      }

      lastError = error instanceof Error ? error : new Error(String(error));

      // 마지막 시도가 아니면 지수 백오프 대기
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/** 비동기 대기 유틸리티 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
