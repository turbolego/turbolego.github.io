---
title: "Reviving an iPad 2 as a Spotify Controller with a Milkdrop Visualizer"
date: 2024-10-01
tags:
  - hardware
  - ios
  - spotify
  - webgl
  - redis
  - vercel
description: "How I turned an old iPad 2 into a dedicated Spotify controller with a beautiful Milkdrop-inspired WebGL visualizer using Redis, WebAMP, and Vercel."
layout: post.njk
permalink: /ipad2spotify-oldmilk/
---

# Reviving an iPad 2 as a Spotify Controller with a Milkdrop Visualizer

![iPad2Spotify + OldMilk](/assets/images/ipad2spotify-demo.png)

## The Problem

I had an iPad 2 sitting in a drawer — too old for modern iOS, but the hardware still works perfectly. Rather than e-waste it, I wanted to give it a dedicated purpose: an always-on Spotify controller with a beautiful music visualizer.

## The Architecture

**Two repositories work together:**

| Repo | Purpose | Tech |
|------|---------|------|
| [`iPad2Spotify`](https://github.com/turbolego/iPad2Spotify) | Backend + Spotify API bridge | Node.js, Redis, Vercel |
| [`OldMilk`](https://github.com/turbolego/OldMilk) | WebGL 1 Milkdrop visualizer | JavaScript, WebGL, WebAMP |

### iPad2Spotify (Backend)

- **Redis** for session/token storage — survives iPad Safari restarts
- **Spotify Web API** for playback control and "now playing" metadata
- **Vercel** serverless functions — zero-cost hosting, global CDN
- **WebAMP** integration for Winamp 2 skin compatibility

### OldMilk (Visualizer)

- **WebGL 1** — runs on iPad 2's PowerVR SGX543MP2 (iOS 9.3.5 Safari supports it)
- **Milkdrop preset parsing** — loads `.milk` files natively
- **AudioContext** analyser node for real-time frequency data
- **Zero dependencies** — single HTML file, ~50 KB gzipped

## Data Flow

```
iPad 2 Safari → Vercel (iPad2Spotify) → Redis ↔ Spotify API
                    ↓
              WebSocket → OldMilk (WebGL visualizer)
```

The iPad polls `/now-playing` every 2 seconds. When track changes, it pushes new metadata to the visualizer via WebSocket.

## Key Challenges

### 1. iOS 9.3.5 Safari Limitations

- No ES6 modules → all code transpiled to ES5
- No `fetch` polyfill needed — used `XMLHttpRequest`
- WebGL 1 only — shaders written in GLSL 1.0 (`#version 100`)
- `AudioContext` requires user gesture → "Tap to Start" overlay

### 2. Spotify Token Refresh

Access tokens expire hourly. Solution: store `refresh_token` in Redis (encrypted), background cron refreshes every 50 min.

```javascript
// Simplified token refresh
async function getValidToken(sessionId) {
  const session = await redis.get(`spotify:${sessionId}`);
  if (Date.now() > session.expiresAt - 60000) {
    const newToken = await refreshToken(session.refreshToken);
    await redis.set(`spotify:${sessionId}`, { ...session, ...newToken });
    return newToken.accessToken;
  }
  return session.accessToken;
}
```

### 3. Visualizer Performance on 2011 GPU

- Reduced fragment shader complexity
- Limited to 30 fps via `requestAnimationFrame` throttle
- Disabled expensive Milkdrop features (per-pixel motion, waveforms)

## Deployment

```bash
# iPad2Spotify
cd iPad2Spotify
vercel --prod

# OldMilk (static)
cd OldMilk
vercel --prod
```

Both deploy to `*.vercel.app` subdomains. iPad 2 Safari bookmarks the visualizer URL to home screen for "app-like" experience.

## Result

<div class="video-container">
  <video controls src="/assets/videos/ipad2spotify-demo.mp4" poster="/assets/images/ipad2spotify-poster.jpg"></video>
</div>

The iPad 2 has been running 24/7 on a wall mount for 6 months — zero crashes, ~2% battery drain per day (always plugged in).

## Links

- **iPad2Spotify**: <https://github.com/turbolego/iPad2Spotify> (4 ⭐, 3 forks)
- **OldMilk**: <https://github.com/turbolego/OldMilk> (MIT License)
- **Live Demo**: <https://ipad2spotify.vercel.app> (backend) + <https://oldmilk.vercel.app> (visualizer)

---

*Built with ☕ and nostalgia. The iPad 2 deserves a second life.*