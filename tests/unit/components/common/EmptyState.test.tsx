import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '@/components/common/EmptyState';
import { Search } from 'lucide-react';

describe('EmptyState', () => {
  it('제목과 설명을 렌더링한다', () => {
    render(
      <EmptyState icon={Search} title="검색 결과 없음" description="검색어를 변경해 보세요" />
    );
    expect(screen.getByText('검색 결과 없음')).toBeInTheDocument();
    expect(screen.getByText('검색어를 변경해 보세요')).toBeInTheDocument();
  });

  it('action prop이 있으면 액션 버튼을 표시한다', () => {
    render(
      <EmptyState
        icon={Search}
        title="데이터 없음"
        description="아직 데이터가 없습니다"
        action={<button>새로 만들기</button>}
      />
    );
    expect(screen.getByText('새로 만들기')).toBeInTheDocument();
  });

  it('action prop이 없으면 액션 영역을 렌더링하지 않는다', () => {
    const { container } = render(
      <EmptyState icon={Search} title="데이터 없음" description="아직 데이터가 없습니다" />
    );
    // action 래퍼 div가 렌더링되지 않아야 함
    expect(container.querySelectorAll('.mt-2').length).toBe(0);
  });
});
