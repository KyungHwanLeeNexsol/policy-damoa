import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Policy, UserProfile } from '@/types';

import { EligibilityChecklist } from '../EligibilityChecklist';

// matchEligibility 모킹
vi.mock('@/features/policies/utils/eligibility', () => ({
  matchEligibility: vi.fn().mockReturnValue([
    { label: '직업', status: 'eligible' },
    { label: '나이', status: 'partial' },
    { label: '가족상태', status: 'ineligible' },
  ]),
}));

const mockPolicy: Policy = {
  id: 'p1',
  externalId: null,
  title: '테스트 정책',
  description: null,
  eligibilityCriteria: { occupation: ['student'] },
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
};

const mockProfile: UserProfile = {
  id: 'u1',
  userId: 'user-1',
  birthYear: 1995,
  gender: 'male',
  occupation: 'student',
  incomeLevel: null,
  regionId: 'r1',
  familyStatus: 'single',
  isPregnant: false,
  hasChildren: false,
  childrenCount: 0,
  isDisabled: false,
  isVeteran: false,
};

describe('EligibilityChecklist', () => {
  it('프로필이 있으면 적격성 결과를 렌더링한다', () => {
    render(<EligibilityChecklist policy={mockPolicy} profile={mockProfile} />);
    expect(screen.getByText('직업')).toBeInTheDocument();
    expect(screen.getByText('나이')).toBeInTheDocument();
    expect(screen.getByText('가족상태')).toBeInTheDocument();
  });

  it('프로필이 없으면 로그인 CTA를 렌더링한다', () => {
    render(<EligibilityChecklist policy={mockPolicy} profile={null} />);
    expect(screen.getByText(/로그인하면 나에게 맞는지 확인할 수 있어요/)).toBeInTheDocument();
  });

  it('eligible 상태 항목을 표시한다', () => {
    render(<EligibilityChecklist policy={mockPolicy} profile={mockProfile} />);
    // 적합 아이콘이 있는지 확인
    const eligibleItem = screen.getByText('직업').closest('li');
    expect(eligibleItem).toBeInTheDocument();
  });
});
