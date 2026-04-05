// @MX:ANCHOR: [AUTO] Prisma 클라이언트 싱글톤 - 모든 DB 접근의 진입점
// @MX:REASON: 다수의 서비스/API에서 참조되는 핵심 모듈
import { PrismaClient } from '@prisma/client';

// globalThis를 활용한 싱글톤 패턴
// 개발 환경에서 Hot Reload 시 PrismaClient 인스턴스 중복 생성 방지
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 지연 초기화: 빌드 시점에는 DB 연결을 시도하지 않음
// 실제 DB 접근 시에만 PrismaClient 인스턴스 생성
function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}

// Proxy를 사용하여 실제 접근 시점까지 초기화 지연
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    return Reflect.get(getPrismaClient(), prop);
  },
});
