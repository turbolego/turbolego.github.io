# PlogeKart
Webapp for Brøyteweb / PlogNorge

Mobile-first PWA using Leaflet to show snowplow visits. Select an area on the map and get notified when status changes.

## Deploy

Hosted on GitHub Pages: https://turbolego.github.io/PlogeKart/

## CORS note

The API at `mobiwinqa.bmsystem.se/PlogNorge/Home/*` requires session cookies and does **not** send `Access-Control-Allow-Origin`. Direct fetch from `turbolego.github.io` is blocked by CORS.

Fix: run a tiny CORS proxy in front of the BM System API, e.g.:

```js
// proxy.js (Node/Cloudflare Worker)
addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const target = 'https://mobiwinqa.bmsystem.se' + url.searchParams.get('url');
  return fetch(target, { headers: e.request.headers }).then(r => new Response(r.body, {
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': r.headers.get('Content-Type') }
  }));
});
```

Point `BASE` in `js/app.js` to your proxy and use `?url=/PlogNorge/Home/...`.

The current build includes icons and a corrected service worker. For a production deployment, place the proxy behind your domain so credentials can be forwarded.
