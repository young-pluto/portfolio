// Ledger service worker — app-shell cache, network-first for navigations.
const CACHE = 'ledger-v2';
const SHELL = [
  '/',
  '/index.html',
  '/styles.css',
  '/manifest.json',
  '/js/format.js',
  '/js/categories.js',
  '/js/store.js',
  '/js/auth.js',
  '/js/dashboard.js',
  '/js/add.js',
  '/js/history.js',
  '/js/insights.js',
  '/js/settings.js',
  '/js/app.js',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Never cache Firebase / cross-origin data + SDK — always go to network.
  if (url.origin !== self.location.origin ||
      url.hostname.includes('firebase') ||
      url.hostname.includes('gstatic') ||
      url.hostname.includes('googleapis')) {
    return;
  }

  // Navigation requests: network-first, fall back to cached shell (offline).
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put('/index.html', copy));
        return res;
      }).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Static assets: cache-first, then network, then update cache.
  e.respondWith(
    caches.match(req).then((hit) =>
      hit || fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => hit)
    )
  );
});
