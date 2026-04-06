/**
 * 알림이 없을 때 표시되는 빈 상태 컴포넌트
 */
export function NotificationEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-6xl">🔔</div>
      <h3 className="mb-2 text-lg font-semibold text-gray-700">알림이 없습니다</h3>
      <p className="text-sm text-gray-500">
        새로운 정책 매칭이나 마감 알림이 오면 여기에 표시됩니다.
      </p>
    </div>
  );
}
