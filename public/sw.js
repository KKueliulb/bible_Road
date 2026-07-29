// Bible Road 웹푸시 서비스워커. 앱 번들과 별도로 정적 파일 그대로 서빙된다(Metro 빌드 대상 아님).

const STATIC_CACHE_NAME = 'bible-road-static-v1';
// 빌드 시 파일명에 해시가 붙는 JS 번들/폰트/아이콘만 캐싱 대상으로 삼는다.
// (해시가 바뀌면 URL 자체가 달라지므로 배포 후 옛날 파일을 잘못 서빙할 위험이 없음)
const STATIC_CACHE_PATTERNS = [/^\/_expo\/static\//, /\.(?:ttf|woff2?|png)$/];

function isStaticAsset(url) {
  return STATIC_CACHE_PATTERNS.some((pattern) => pattern.test(url.pathname));
}

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(keys.filter((key) => key !== STATIC_CACHE_NAME).map((key) => caches.delete(key)))
      ),
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || !isStaticAsset(new URL(request.url))) {
    return;
  }

  event.respondWith(
    caches.open(STATIC_CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;

      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
  );
});

self.addEventListener('push', (event) => {
  let data = { title: 'Bible Road', body: '아직 말씀을 읽지 않으셨네요? 지금 읽어볼까요? 🔥' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
