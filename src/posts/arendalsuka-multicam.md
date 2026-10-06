---
title: "Live-Streaming Arendalsuka 2024 to Facebook & LinkedIn Simultaneously"
date: 2026-10-05
tags:
  - streaming
  - multicam
  - obs
  - arendalsuka
  - how-to
  - rtmp
description: "How The Electrical Association in Norway set up their live streams during Arendalsuka 2024 for Facebook and LinkedIn with multiple Logitech cameras using OBS, nginx-rtmp, and custom automation scripts."
layout: post.njk
permalink: /arendalsuka-multicam/
---

# Live-Streaming Arendalsuka 2024 to Facebook & LinkedIn Simultaneously

## Challenge

**Arendalsuka** (Norway's largest political week) 2024 needed:
- 4 cameras (Logitech Brio 4K)
- Simultaneous stream to Facebook & LinkedIn
- 6 hours/day streaming for 5 days
- Automatic scene switching based on speaker
- Zero budget for commercial streaming platforms

## Solution

**Repository**: [`Arendalsuka-Multicam-Stream`](https://github.com/turbolego/Arendalsuka-Multicam-Stream) documents the full setup.

### Stack

| Component | Technology |
|-----------|------------|
| Video Mixer | OBS Studio 29.x |
| Multi-output | nginx-rtmp (Docker) |
| Scene Automation | Custom Python script |
| Cameras | 4 × Logitech Brio via USB 3.0 hub |
| Audio | Behringer X32 mixer → OBS |

### Architecture

```
[4× Logitech Brio] → [USB 3.0 Hub] → [OBS Studio]
                                                      ↓
                         ┌────────────────────────────┴────────────────────────────┐
                         ▼                                                         ▼
                  [nginx-rtmp]                                                 [nginx-rtmp]
                    (Facebook)                                                   (LinkedIn)
                         │                                                         │
                         ▼                                                         ▼
                   rtmp://live-api-s.fb...                                  rtmp://linkedin...
```

---

## Key Components

### 1. nginx-rtmp for Multi-Output

```nginx
# nginx.conf
rtmp {
    server {
        listen 1935;
        chunk_size 4096;

        application live {
            live on;
            record off;
            
            # Facebook
            push rtmp://live-api-s.facebook.com/rtmp/STREAM_KEY;
            
            # LinkedIn
            push rtmp://rtmp-api.linkedin.com/rtmp/STREAM_KEY;
        }
    }
}
```

Run in Docker:
```bash
docker run -d \
  -p 1935:1935 \
  -v $(pwd)/nginx.conf:/etc/nginx/nginx.conf \
  tiangolo/nginx-rtmp
```

### 2. Auto Scene Switching (Python)

```python
# auto_switch.py
# Switch scene to loudest camera based on audio levels

import obsws_python as obs
import time

client = obs.ReqClient(host='localhost', port=4455, password='secret')

SCENES = ['cam1', 'cam2', 'cam3', 'cam4']

def get_audio_levels():
    # Query OBS for input volume levels
    levels = {}
    for scene in SCENES:
        resp = client.get_input_volume(scene)
        levels[scene] = resp.input_volume_mul
    return levels

while True:
    levels = get_audio_levels()
    loudest = max(levels, key=lambda x: levels[x])
    if levels[loudest] > 0.1:  # threshold
        client.set_current_program_scene(loudest)
    time.sleep(0.5)
```

### 3. OBS Scene Collection

| Scene | Source | Purpose |
|-------|--------|---------|
| `cam1` | Logitech Brio #1 | Main speaker |
| `cam2` | Logitech Brio #2 | Audience / wide |
| `cam3` | Logitech Brio #3 | Presentation screen |
| `cam4` | Logitech Brio #4 | Backup / roving |
| `brb` | Static image | "Be Right Back" |
| `starting-soon` | Countdown timer | Pre-stream |

---

## Results

| Metric | Result |
|--------|--------|
| Sessions streamed | 12 |
| Total hours | ~36 |
| Dropped frames | 0 |
| Setup time per day | <30 min |
| Concurrent viewers (peak) | 1,200+ |
| Platforms | Facebook + LinkedIn simultaneously |

## Lessons Learned

1. **nginx-rtmp is rock-solid** — handled 5 days of continuous streaming without restart
2. **Audio-based switching works** — no manual operator needed for panel discussions
3. **USB 3.0 bandwidth** — 4× 4K@30fps needs a quality powered hub
4. **Test stream keys early** — LinkedIn keys expire, Facebook keys persist
5. **Backup recording** — OBS local recording saved us when LinkedIn had ingest issues

## Links

- **Repository**: <https://github.com/turbolego/Arendalsuka-Multicam-Stream>
- **Full Documentation**: README in repo (hardware list, OBS config, nginx config, Python scripts)
- **Arendalsuka 2024**: <https://arendalsuka.no/>

---

*Open source streaming infrastructure — no vendor lock-in, no monthly fees.*