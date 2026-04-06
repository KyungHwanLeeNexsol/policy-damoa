// openai (Gemini) 클라이언트 싱글톤 단위 테스트 (SPEC-AI-001 M1)
// Gemini OpenAI 호환 엔드포인트 구성 검증

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// openai 패키지 목업: 생성자 호출 인자 캡처
const openAIConstructor = vi.fn();

vi.mock('openai', () => ({
  default: class MockOpenAI {
    constructor(opts: unknown) {
      openAIConstructor(opts);
    }
  },
}));

describe('lib/openai — Gemini 클라이언트 구성', () => {
  beforeEach(() => {
    vi.resetModules();
    openAIConstructor.mockClear();
    process.env.GEMINI_API_KEY = 'test-gemini-key';
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  it('Gemini OpenAI 호환 baseURL과 GEMINI_API_KEY로 초기화해야 한다', async () => {
    await import('../openai');

    expect(openAIConstructor).toHaveBeenCalledTimes(1);
    const firstCall = openAIConstructor.mock.calls[0];
    if (!firstCall) throw new Error('OpenAI 생성자가 호출되지 않았습니다');
    const opts = firstCall[0] as {
      apiKey: string;
      baseURL: string;
      timeout?: number;
      maxRetries?: number;
    };
    expect(opts.apiKey).toBe('test-gemini-key');
    expect(opts.baseURL).toBe(
      'https://generativelanguage.googleapis.com/v1beta/openai/',
    );
    expect(opts.timeout).toBe(30_000);
    expect(opts.maxRetries).toBe(2);
  });

  it('default export가 OpenAI 인스턴스여야 한다', async () => {
    const mod = await import('../openai');
    expect(mod.default).toBeDefined();
  });
});
