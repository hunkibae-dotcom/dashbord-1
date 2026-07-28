const CACHE_NAME = 'export-packing-dashboard-v11';
const APP_SHELL = [
  // HTML은 캐시하지 않음 — 항상 네트워크에서 최신본 수신
  './manifest.json',
  './manifest-packing.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/packing-icon-192.png',
  './icons/packing-icon-512.png',
  './icons/packing-icon-maskable-192.png',
  './icons/packing-icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;

  // HTML 파일: 타임스탬프 파라미터로 CDN 캐시를 매 요청마다 강제 우회, SW 캐시 미사용
  if (req.destination === 'document' || req.url.includes('.html')) {
    const sep = req.url.includes('?') ? '&' : '?';
    const bustUrl = req.url + sep + '_sw=' + Date.now();
    event.respondWith(
      fetch(bustUrl, { cache: 'no-store' })
        .catch(() => caches.match(req))
    );
    return;
  }

  // 아이콘·manifest 등 정적 자산: network-first, SW 캐시 저장
  event.respondWith(
    fetch(req, { cache: 'no-store' })
      .then((res) => {
        caches.open(CACHE_NAME).then((cache) => cache.put(req, res.clone()));
        return res;
      })
      .catch(() => caches.match(req))
  );
});
