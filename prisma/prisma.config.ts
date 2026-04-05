// Prisma 7.x 설정 파일
// 데이터베이스 연결 URL을 여기서 관리합니다
import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  // @ts-expect-error -- Prisma 7.x earlyAccess 옵션, 타입 정의가 아직 불완전
  earlyAccess: true,
  schema: path.join(__dirname, 'schema.prisma'),
  migrate: {
    async url() {
      return process.env.DATABASE_URL ?? '';
    },
  },
});
