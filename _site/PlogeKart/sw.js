const CACHE = 'plogekart-v2';

self.addEventListener('install', e => {
  // No addAll: avoids failing the whole install when one URL is missing.
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);

  // Only intercept same-site requests.
  if (url.origin !== self.location.origin) return;

  // Network-first for HTML/JSON (keeps live map data fresh).
  if (req.headers.get('accept')?.includes('text/html') || req.headers.get('accept')?.includes('application/json')) {
    e.respondWith(
      fetch(req)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Cache-first for static assets (CSS/JS/manifest/icons).
  e.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(req, clone));
        return res;
      });
    })
  );
});
