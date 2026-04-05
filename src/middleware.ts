// @MX:NOTE: [AUTO] 인증 미들웨어 - 보호 라우트 접근 제어
// 인증되지 않은 사용자를 /login으로 리다이렉트
export { auth as middleware } from '@/lib/auth';

export const config = {
  // 보호할 라우트 패턴
  // /profile, /notifications, /recommendations 경로만 인증 필요
  matcher: ['/profile/:path*', '/notifications/:path*', '/recommendations/:path*'],
};
