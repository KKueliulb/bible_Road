// Bible Road 웹푸시 서비스워커. 앱 번들과 별도로 정적 파일 그대로 서빙된다(Metro 빌드 대상 아님).

const STATIC_CACHE_NAME = 'bible-road-static-v2';
// 빌드 시 파일명에 해시가 붙는 JS 번들/폰트/아이콘(/_expo/static/, /assets/ 밑)만 캐싱한다.
// (해시가 바뀌면 URL 자체가 달라지므로 배포 후 옛날 파일을 잘못 서빙할 위험이 없음)
// 주의: icon-192.png, manifest.json, badge-96.png처럼 public/ 루트에 그대로 서빙되는
// 파일은 해시가 안 붙어서 URL이 안 바뀌므로 여기서 캐싱하면 안 된다 — 캐싱하면
// 배포로 파일 내용이 바뀌어도 브라우저가 예전 캐시를 계속 서빙해버린다(실제로 아이콘
// 교체가 기기에 반영 안 되는 문제가 있었음).
const STATIC_CACHE_PATTERNS = [/^\/_expo\/static\//, /^\/assets\//];

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
      // badge는 안드로이드 상태바/알림에 쓰이는 단색 실루엣 전용 슬롯이라, 컬러 아이콘을
      // 넣으면 안드로이드가 렌더링을 포기하고 기본 아이콘 + 사이트 이니셜 원형으로
      // 대체해버린다. 흰색 실루엣(투명 배경) 전용 이미지를 따로 써야 한다.
      badge: '/badge-96.png',
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
