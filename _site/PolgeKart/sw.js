const CACHE = 'plogekart-v9';
const BASE = location.pathname.substring(0, location.pathname.lastIndexOf('/')+1);
const ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'style.css',
  BASE + 'js/app.js',
  BASE + 'manifest.json',
  BASE + 'favicon.ico',
  BASE + 'data/static-roads.geojson'
];
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE) {
          return caches.delete(key);
        }
      })
    )).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  // Only handle requests for our own origin and under BASE
  if (e.request.url.startsWith(self.location.origin + BASE)) {
    // For assets in our precache list, try cache first, then network
    const url = new URL(e.request.url);
    const path = url.pathname;
    // If the request is for one of our precached assets, try cache
    if (ASSETS.includes(path)) {
      e.respondWith(
        caches.match(e.request, {cacheName: CACHE}).then(r => r || fetch(e.request))
      );
      return;
    }
    // For other requests (shouldn't happen for our scope), go to network
    e.respondWith(fetch(e.request));
  }
});
