// @MX:ANCHOR: [AUTO] Gemini OpenAI 호환 클라이언트 싱글톤 - AI 추천/유사 정책의 진입점
// @MX:REASON: 추천 서비스, 유사 정책 서비스, 크론 작업에서 공통 참조되는 핵심 모듈
// @MX:SPEC: SPEC-AI-001
//
// Gemini API를 OpenAI SDK 호환 엔드포인트로 호출한다.
// - baseURL: https://generativelanguage.googleapis.com/v1beta/openai/
// - 모델: gemini-2.0-flash (호출 시점 지정)
// - 30초 타임아웃, 2회 자동 재시도

import OpenAI from 'openai';

// Gemini 호환 클라이언트 싱글톤
// API 키가 없을 때도 모듈 로드는 성공하도록 빈 문자열을 fallback으로 사용
// (실제 호출 시점에서 OpenAI SDK가 인증 오류를 던진다)
const gemini = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY ?? '',
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  timeout: 30_000,
  maxRetries: 2,
});

export default gemini;
