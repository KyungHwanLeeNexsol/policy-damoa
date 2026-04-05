import { describe, it, expect, vi, beforeEach } from 'vitest';

// PrismaClient를 모킹하여 실제 DB 연결 없이 테스트
vi.mock('@prisma/client', () => {
  class MockPrismaClient {
    $connect = vi.fn();
    $disconnect = vi.fn();
  }
  return { PrismaClient: MockPrismaClient };
});

describe('Prisma Client 싱글톤', () => {
  beforeEach(() => {
    // globalThis에서 prisma 인스턴스 정리
    const globalForPrisma = globalThis as unknown as {
      prisma: unknown | undefined;
    };
    delete globalForPrisma.prisma;
    // 모듈 캐시 초기화하여 재임포트 가능하게
    vi.resetModules();
  });

  it('prisma 클라이언트가 정상적으로 export 되어야 한다', async () => {
    const { prisma } = await import('@/lib/db');
    expect(prisma).toBeDefined();
    expect(prisma).not.toBeNull();
  });

  it('싱글톤 패턴이 동작하여 동일한 인스턴스를 반환해야 한다', async () => {
    const { prisma: firstImport } = await import('@/lib/db');
    // 두 번째 임포트 시에도 동일한 인스턴스 반환
    const { prisma: secondImport } = await import('@/lib/db');
    expect(firstImport).toBe(secondImport);
  });
});
