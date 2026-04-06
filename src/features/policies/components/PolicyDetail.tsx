import type { Session } from 'next-auth';

import { formatDate } from '@/lib/utils';
import type { PolicyWithCategories, UserProfile } from '@/types';

import { EligibilityChecklist } from './EligibilityChecklist';

interface PolicyDetailProps {
  policy: PolicyWithCategories;
  session: Session | null;
  userProfile: UserProfile | null;
}

/**
 * 정책 상세 컴포넌트 (서버 컴포넌트)
 * 정책의 모든 상세 정보와 적격성 체크리스트를 렌더링한다.
 */
export function PolicyDetail({
  policy,
  userProfile,
}: PolicyDetailProps): React.ReactNode {
  return (
    <div className="space-y-8">
      {/* 정책 헤더 */}
      <div className="space-y-4">
        {/* 카테고리 배지 */}
        {policy.categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {policy.categories.map(({ category }) => (
              <span
                key={category.id}
                className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
              >
                {category.name}
              </span>
            ))}
          </div>
        )}

        <h1 className="text-2xl font-bold tracking-tight">{policy.title}</h1>

        {/* 메타 정보 */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {policy.sourceAgency && (
            <span>주관 기관: {policy.sourceAgency}</span>
          )}
          {policy.region && <span>지역: {policy.region.name}</span>}
          {policy.applicationDeadline && (
            <span>
              신청 마감:{' '}
              {formatDate(policy.applicationDeadline, 'full')}
            </span>
          )}
          {policy.benefitType && <span>혜택 유형: {policy.benefitType}</span>}
        </div>
      </div>

      {/* 정책 설명 */}
      {policy.description && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">정책 설명</h2>
          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
            {policy.description}
          </p>
        </section>
      )}

      {/* 혜택 금액 */}
      {policy.benefitAmount && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">지원 내용</h2>
          <p className="text-sm text-muted-foreground">{policy.benefitAmount}</p>
        </section>
      )}

      {/* 신청 방법 */}
      {policy.applicationMethod && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">신청 방법</h2>
          <p className="text-sm text-muted-foreground">{policy.applicationMethod}</p>
        </section>
      )}

      {/* 원본 URL */}
      {policy.sourceUrl && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">공식 페이지</h2>
          <a
            href={policy.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            {policy.sourceUrl}
          </a>
        </section>
      )}

      {/* 자격 요건 체크리스트 */}
      <section className="space-y-3 rounded-xl border p-6 bg-card">
        <h2 className="text-lg font-semibold">나에게 맞는지 확인하기</h2>
        <EligibilityChecklist policy={policy} profile={userProfile} />
      </section>
    </div>
  );
}
