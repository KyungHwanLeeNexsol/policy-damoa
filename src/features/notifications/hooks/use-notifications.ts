'use client';

import { useState, useEffect, useTransition } from 'react';
import { saveNotificationPreferences } from '@/features/notifications/actions/notification.actions';

interface PushSubscriptionState {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
}

/**
 * Web Push 구독 관리 훅
 */
export function usePushNotifications(): PushSubscriptionState & {
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  error: string | null;
} {
  const [state, setState] = useState<PushSubscriptionState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const checkSupport = async () => {
      // Service Worker + PushManager 지원 여부 확인
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setState({ isSupported: false, isSubscribed: false, isLoading: false });
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setState({
          isSupported: true,
          isSubscribed: !!subscription,
          isLoading: false,
        });
      } catch {
        setState({ isSupported: false, isSubscribed: false, isLoading: false });
      }
    };

    checkSupport();
  }, []);

  const subscribe = async () => {
    setError(null);
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setError('알림 권한이 거부되었습니다. 이메일 알림만 사용 가능합니다.');
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) throw new Error('VAPID 공개 키가 설정되지 않았습니다.');

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey).buffer as ArrayBuffer,
      });

      const subscriptionJson = subscription.toJSON();

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscriptionJson.endpoint,
          keys: subscriptionJson.keys,
        }),
      });

      startTransition(async () => {
        await saveNotificationPreferences({ pushEnabled: true });
      });

      setState({ isSupported: true, isSubscribed: true, isLoading: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : '구독 중 오류가 발생했습니다.');
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const unsubscribe = async () => {
    setError(null);
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }

      startTransition(async () => {
        await saveNotificationPreferences({ pushEnabled: false });
      });

      setState({ isSupported: true, isSubscribed: false, isLoading: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : '구독 해지 중 오류가 발생했습니다.');
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return { ...state, subscribe, unsubscribe, error };
}

/**
 * Base64URL → Uint8Array 변환 (VAPID 키 변환용)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
