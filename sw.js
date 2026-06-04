const CACHE = 'monitor-cba-v4';
const LOCAL_ASSETS = [
  '/gfcuiaba/',
  '/gfcuiaba/index.html',
  '/gfcuiaba/styles.css',
  '/gfcuiaba/app.js',
  '/gfcuiaba/manifest.json',
  '/gfcuiaba/icon.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(LOCAL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Requisições de navegação: tenta rede, fallback para cache
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/gfcuiaba/'))
    );
    return;
  }

  // Assets locais: cache-first
  if (LOCAL_ASSETS.some(a => url.pathname === a || url.pathname.startsWith('/gfcuiaba/'))) {
    const isLocal = !url.hostname.includes('googleapis') &&
                    !url.hostname.includes('gstatic') &&
                    !url.hostname.includes('firebaseapp') &&
                    !url.hostname.includes('cdnjs');
    if (isLocal) {
      e.respondWith(
        caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        }))
      );
      return;
    }
  }

  // Demais requisições: network-first
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
