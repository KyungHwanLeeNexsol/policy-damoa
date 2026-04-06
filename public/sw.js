// @MX:NOTE: Service Worker - Web Push 수신 및 알림 클릭 이벤트 처리
// @MX:REASON: 브라우저 캐시와 독립적으로 실행되어 백그라운드 Push 수신 가능

const CACHE_NAME = 'policy-damoa-sw-v1';

// Service Worker 설치
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Service Worker 활성화
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Push 이벤트 수신 처리
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: '새 알림', body: event.data.text() };
  }

  const options = {
    body: payload.body ?? '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: {
      url: payload.url ?? '/',
      policyId: payload.policyId ?? null,
    },
    actions: [
      {
        action: 'open',
        title: '자세히 보기',
      },
      {
        action: 'dismiss',
        title: '닫기',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title ?? '정책다모아', options)
  );
});

// 알림 클릭 이벤트 처리
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url ?? '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // 이미 열린 탭이 있으면 포커스
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // 없으면 새 탭 열기
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
