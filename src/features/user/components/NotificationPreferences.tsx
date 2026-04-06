'use client';

import { useState, useTransition } from 'react';
import { usePushNotifications } from '@/features/notifications/hooks/use-notifications';
import { saveNotificationPreferences } from '@/features/notifications/actions/notification.actions';
import type { NotificationPreferenceData } from '@/features/notifications/types';

interface NotificationPreferencesProps {
  initialPreferences: NotificationPreferenceData | null;
}

/**
 * 알림 설정 관리 컴포넌트
 */
export function NotificationPreferences({ initialPreferences }: NotificationPreferencesProps) {
  const [prefs, setPrefs] = useState<Partial<NotificationPreferenceData>>(
    initialPreferences ?? {
      emailEnabled: true,
      digestFrequency: 'daily',
      newPolicyMatch: true,
      deadlineReminder: true,
    }
  );
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isPending, startTransition] = useTransition();
  const {
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    error: pushError,
  } = usePushNotifications();

  const handleSave = () => {
    setSaveStatus('saving');
    startTransition(async () => {
      await saveNotificationPreferences(prefs);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    });
  };

  const handlePushToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
      setPrefs((prev) => ({ ...prev, pushEnabled: false }));
    } else {
      await subscribe();
      setPrefs((prev) => ({ ...prev, pushEnabled: true }));
    }
  };

  return (
    <div className="space-y-8">
      {/* Push 알림 섹션 */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900">앱 푸시 알림</h3>
        <p className="mt-1 text-sm text-gray-500">
          브라우저 알림으로 새 정책 매칭을 즉시 받아보세요.
        </p>

        <div className="mt-4">
          {!isSupported ? (
            <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-700">
              이 브라우저는 푸시 알림을 지원하지 않습니다. 이메일 알림을 이용해주세요.
            </div>
          ) : (
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-gray-700">
                {isSubscribed ? '푸시 알림 활성화됨' : '푸시 알림 비활성화됨'}
              </span>
              <button
                onClick={handlePushToggle}
                disabled={isLoading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isSubscribed ? 'bg-blue-500' : 'bg-gray-300'
                } disabled:opacity-50`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isSubscribed ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          )}
          {pushError && <p className="mt-2 text-sm text-red-500">{pushError}</p>}
        </div>
      </section>

      {/* 이메일 알림 섹션 */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900">이메일 알림</h3>

        <div className="mt-4 space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-gray-700">이메일 알림 사용</span>
            <button
              onClick={() => setPrefs((prev) => ({ ...prev, emailEnabled: !prev.emailEnabled }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                prefs.emailEnabled ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  prefs.emailEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>

          {prefs.emailEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700">발송 빈도</label>
              <select
                value={prefs.digestFrequency ?? 'daily'}
                onChange={(e) =>
                  setPrefs((prev) => ({
                    ...prev,
                    digestFrequency: e.target
                      .value as NotificationPreferenceData['digestFrequency'],
                  }))
                }
                className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="immediate">즉시</option>
                <option value="daily">일간 요약</option>
                <option value="weekly">주간 요약</option>
              </select>
            </div>
          )}
        </div>
      </section>

      {/* 알림 유형 섹션 */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900">알림 유형</h3>

        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={prefs.newPolicyMatch ?? true}
              onChange={(e) => setPrefs((prev) => ({ ...prev, newPolicyMatch: e.target.checked }))}
              className="h-4 w-4 rounded"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">새 정책 매칭</p>
              <p className="text-xs text-gray-500">내 프로필과 매칭되는 새 정책이 등록될 때</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={prefs.deadlineReminder ?? true}
              onChange={(e) =>
                setPrefs((prev) => ({ ...prev, deadlineReminder: e.target.checked }))
              }
              className="h-4 w-4 rounded"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">마감 임박 알림</p>
              <p className="text-xs text-gray-500">관심 정책 신청 마감 7일, 1일 전</p>
            </div>
          </label>
        </div>
      </section>

      <button
        onClick={handleSave}
        disabled={isPending || saveStatus === 'saving'}
        className="w-full rounded-lg bg-blue-500 py-3 font-medium text-white hover:bg-blue-600 disabled:opacity-50"
      >
        {saveStatus === 'saved' ? '저장됨 ✓' : saveStatus === 'saving' ? '저장 중...' : '설정 저장'}
      </button>
    </div>
  );
}
