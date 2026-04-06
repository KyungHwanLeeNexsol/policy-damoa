import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { PolicyCategory, Region } from '@/types';

// next/navigation 모킹
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  useSearchParams: () => new URLSearchParams(''),
}));

import { PolicyFilter } from '../PolicyFilter';

const mockRegions: Region[] = [
  { id: 'r1', name: '서울', code: 'SEOUL', level: 1, parentId: null },
  { id: 'r2', name: '부산', code: 'BUSAN', level: 1, parentId: null },
];

const mockCategories: PolicyCategory[] = [
  { id: 'c1', name: '주거·주택', slug: 'housing', description: null, icon: 'Home' },
  { id: 'c2', name: '일자리·고용', slug: 'employment', description: null, icon: 'Briefcase' },
];

describe('PolicyFilter', () => {
  it('필터 컴포넌트를 렌더링한다', () => {
    render(<PolicyFilter regions={mockRegions} categories={mockCategories} />);
    // 카테고리 제목 확인
    expect(screen.getByText('카테고리')).toBeInTheDocument();
  });

  it('지역 섹션을 렌더링한다', () => {
    render(<PolicyFilter regions={mockRegions} categories={mockCategories} />);
    expect(screen.getByText('지역')).toBeInTheDocument();
  });

  it('상태 섹션을 렌더링한다', () => {
    render(<PolicyFilter regions={mockRegions} categories={mockCategories} />);
    expect(screen.getByText('상태')).toBeInTheDocument();
  });

  it('정렬 섹션을 렌더링한다', () => {
    render(<PolicyFilter regions={mockRegions} categories={mockCategories} />);
    expect(screen.getByText('정렬')).toBeInTheDocument();
  });

  it('카테고리 옵션들을 렌더링한다', () => {
    render(<PolicyFilter regions={mockRegions} categories={mockCategories} />);
    expect(screen.getByText('주거·주택')).toBeInTheDocument();
    expect(screen.getByText('일자리·고용')).toBeInTheDocument();
  });
});
