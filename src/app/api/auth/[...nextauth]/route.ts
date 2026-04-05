// NextAuth v5 Route Handler
// GET, POST 요청을 NextAuth handlers로 위임
import { handlers } from '@/lib/auth';

// 빌드 시 정적 렌더링 방지 (DB 연결 필요)
export const dynamic = 'force-dynamic';

export const { GET, POST } = handlers;
