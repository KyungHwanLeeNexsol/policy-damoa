import { existsSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

// 프로젝트 루트 경로
const ROOT = resolve(__dirname, '../..');

describe('프로젝트 스캐폴드 검증', () => {
  describe('기능 모듈 디렉토리 구조', () => {
    const features = ['policies', 'notifications', 'recommendations', 'user'];
    const subDirs = ['components', 'hooks', 'actions', 'types'];

    features.forEach((feature) => {
      subDirs.forEach((sub) => {
        it(`src/features/${feature}/${sub} 디렉토리가 존재해야 함`, () => {
          expect(existsSync(resolve(ROOT, `src/features/${feature}/${sub}`))).toBe(true);
        });
      });
    });

    it('src/features/policies/schemas 디렉토리가 존재해야 함', () => {
      expect(existsSync(resolve(ROOT, 'src/features/policies/schemas'))).toBe(true);
    });
  });

  describe('공유 컴포넌트 디렉토리 구조', () => {
    const dirs = ['ui', 'layout', 'common', 'providers'];

    dirs.forEach((dir) => {
      it(`src/components/${dir} 디렉토리가 존재해야 함`, () => {
        expect(existsSync(resolve(ROOT, `src/components/${dir}`))).toBe(true);
      });
    });
  });

  describe('유틸리티 디렉토리 구조', () => {
    const dirs = ['lib', 'services', 'hooks', 'types', 'styles'];

    dirs.forEach((dir) => {
      it(`src/${dir} 디렉토리가 존재해야 함`, () => {
        expect(existsSync(resolve(ROOT, `src/${dir}`))).toBe(true);
      });
    });
  });

  describe('인프라 디렉토리 구조', () => {
    const dirs = [
      'prisma',
      'scripts/sync',
      'scripts/maintenance',
      'scripts/seed',
      'tests/unit',
      'tests/integration',
      'tests/e2e',
    ];

    dirs.forEach((dir) => {
      it(`${dir} 디렉토리가 존재해야 함`, () => {
        expect(existsSync(resolve(ROOT, dir))).toBe(true);
      });
    });
  });

  describe('핵심 설정 파일', () => {
    const files = [
      'tsconfig.json',
      'next.config.ts',
      'package.json',
      '.env.example',
      'docker-compose.yml',
      'eslint.config.mjs',
      'postcss.config.mjs',
      'vitest.config.ts',
    ];

    files.forEach((file) => {
      it(`${file} 파일이 존재해야 함`, () => {
        expect(existsSync(resolve(ROOT, file))).toBe(true);
      });
    });
  });

  describe('TypeScript 설정 검증', () => {
    it('strict 모드가 활성화되어 있어야 함', async () => {
      const tsconfig = await import(resolve(ROOT, 'tsconfig.json'));
      expect(tsconfig.compilerOptions.strict).toBe(true);
    });

    it('path alias @/*가 설정되어 있어야 함', async () => {
      const tsconfig = await import(resolve(ROOT, 'tsconfig.json'));
      expect(tsconfig.compilerOptions.paths['@/*']).toContain('./src/*');
    });
  });

  describe('패키지 설정 검증', () => {
    it('프로젝트 이름이 policy-damoa여야 함', async () => {
      const pkg = await import(resolve(ROOT, 'package.json'));
      expect(pkg.name).toBe('policy-damoa');
    });

    it('필수 스크립트가 정의되어 있어야 함', async () => {
      const pkg = await import(resolve(ROOT, 'package.json'));
      expect(pkg.scripts.dev).toBeDefined();
      expect(pkg.scripts.build).toBeDefined();
      expect(pkg.scripts.start).toBeDefined();
      expect(pkg.scripts.lint).toBeDefined();
    });

    it('필수 의존성이 설치되어 있어야 함', async () => {
      const pkg = await import(resolve(ROOT, 'package.json'));
      expect(pkg.dependencies.next).toBeDefined();
      expect(pkg.dependencies.react).toBeDefined();
      expect(pkg.dependencies['react-dom']).toBeDefined();
    });
  });
});
