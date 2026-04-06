import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { PolicyWithCategories } from '@/types';

import { PolicyCard } from '../PolicyCard';

// next/link 모킹
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// getDday 모킹
vi.mock('@/lib/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils')>();
  return {
    ...actual,
    getDday: vi.fn().mockReturnValue('D-30'),
  };
});

const mockPolicy: PolicyWithCategories = {
  id: 'policy-1',
  externalId: null,
  title: '청년 주거 지원 정책',
  description: '청년을 위한 주거비 지원 프로그램입니다. 최대 100만원까지 지원받을 수 있습니다.',
  eligibilityCriteria: null,
  additionalConditions: null,
  benefitType: 'cash',
  benefitAmount: '100만원',
  applicationMethod: '온라인',
  applicationDeadline: new Date('2025-12-31'),
  sourceUrl: null,
  sourceAgency: '국토교통부',
  regionId: 'r1',
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
  categories: [
    {
      category: {
        id: 'cat-1',
        name: '주거·주택',
        slug: 'housing',
        description: null,
        icon: 'Home',
      },
    },
  ],
  region: { id: 'r1', name: '서울', code: 'SEOUL', level: 1, parentId: null },
};

describe('PolicyCard', () => {
  it('정책 제목을 렌더링한다', () => {
    render(<PolicyCard policy={mockPolicy} />);
    expect(screen.getByText('청년 주거 지원 정책')).toBeInTheDocument();
  });

  it('카테고리 배지를 렌더링한다', () => {
    render(<PolicyCard policy={mockPolicy} />);
    expect(screen.getByText('주거·주택')).toBeInTheDocument();
  });

  it('혜택 유형 배지를 렌더링한다', () => {
    render(<PolicyCard policy={mockPolicy} />);
    expect(screen.getByText('cash')).toBeInTheDocument();
  });

  it('D-Day 배지를 렌더링한다', () => {
    render(<PolicyCard policy={mockPolicy} />);
    expect(screen.getByText('D-30')).toBeInTheDocument();
  });

  it('설명을 잘라서 렌더링한다', () => {
    render(<PolicyCard policy={mockPolicy} />);
    // truncate로 잘린 설명 확인
    const description = screen.getByText(/청년을 위한 주거비/);
    expect(description).toBeInTheDocument();
  });

  it('정책 상세 링크를 포함한다', () => {
    render(<PolicyCard policy={mockPolicy} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/policies/policy-1');
  });

  it('searchParams가 있으면 링크에 포함한다', () => {
    render(<PolicyCard policy={mockPolicy} searchParams={{ q: '주거', category: 'housing' }} />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toContain('q=');
  });

  it('마감일이 없으면 D-Day 배지를 표시하지 않는다', () => {
    const policyNoDeadline = { ...mockPolicy, applicationDeadline: null };
    render(<PolicyCard policy={policyNoDeadline} />);
    expect(screen.queryByText(/D-/)).not.toBeInTheDocument();
  });
});
