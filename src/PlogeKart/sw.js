const CACHE = 'plogekart-v2';
const BASE = location.pathname.substring(0, location.pathname.lastIndexOf('/')+1);
const ASSETS = [
  BASE,
  BASE+'index.html',
  BASE+'style.css',
  BASE+'js/app.js',
  BASE+'manifest.json'
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', e => {
  if(e.request.url.startsWith(self.location.origin+BASE)) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});
