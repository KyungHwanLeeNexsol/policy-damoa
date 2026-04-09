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
  migrate: {
    async adapter() {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL_UNPOOLED,
      });
      return new PrismaNeon(pool);
    },
  },
});
