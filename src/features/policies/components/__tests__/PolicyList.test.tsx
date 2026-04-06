import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { PolicyWithCategories } from '@/types';

import { PolicyList } from '../PolicyList';

// PolicyCard 모킹
vi.mock('../PolicyCard', () => ({
  PolicyCard: ({ policy }: { policy: PolicyWithCategories }) => (
    <div data-testid={`policy-card-${policy.id}`}>{policy.title}</div>
  ),
}));

// PolicyEmptyState 모킹
vi.mock('../PolicyEmptyState', () => ({
  PolicyEmptyState: () => <div data-testid="empty-state">결과 없음</div>,
}));

const mockPolicies: PolicyWithCategories[] = [
  {
    id: 'p1',
    externalId: null,
    title: '청년 주거 지원',
    description: '설명1',
    eligibilityCriteria: null,
    additionalConditions: null,
    benefitType: 'cash',
    benefitAmount: null,
    applicationMethod: null,
    applicationDeadline: null,
    sourceUrl: null,
    sourceAgency: null,
    regionId: null,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    categories: [],
    region: null,
  },
  {
    id: 'p2',
    externalId: null,
    title: '일자리 지원 정책',
    description: '설명2',
    eligibilityCriteria: null,
    additionalConditions: null,
    benefitType: 'service',
    benefitAmount: null,
    applicationMethod: null,
    applicationDeadline: null,
    sourceUrl: null,
    sourceAgency: null,
    regionId: null,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    categories: [],
    region: null,
  },
];

describe('PolicyList', () => {
  it('정책 카드들을 렌더링한다', () => {
    render(<PolicyList policies={mockPolicies} total={2} />);
    expect(screen.getByTestId('policy-card-p1')).toBeInTheDocument();
    expect(screen.getByTestId('policy-card-p2')).toBeInTheDocument();
  });

  it('정책이 2개면 카드 2개가 렌더링된다', () => {
    render(<PolicyList policies={mockPolicies} total={2} />);
    expect(screen.getAllByTestId(/policy-card-/)).toHaveLength(2);
  });

  it('total이 0이면 EmptyState를 표시한다', () => {
    render(<PolicyList policies={[]} total={0} />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });
});
