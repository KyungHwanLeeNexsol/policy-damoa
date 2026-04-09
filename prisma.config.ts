// prisma.config.ts가 평가되는 시점에 .env를 명시적으로 로드
import 'dotenv/config';

import { defineConfig } from 'prisma/config';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL_UNPOOLED!,
  },
  // @ts-expect-error -- PrismaConfig 타입에 migrate가 없으나 Prisma 7 early access 기능으로 런타임 동작
  migrate: {
    async adapter() {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL_UNPOOLED,
      });
      // @ts-expect-error -- @neondatabase/serverless Pool과 pg.Pool 타입 불일치, 런타임 호환됨
      return new PrismaNeon(pool);
    },
  },
});
