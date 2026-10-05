---
title: FreeLLMAPI on Intel Atom D525 2GB RAM – Forever-Free LLM Fallback for Hermes
date: 2026-10-05
tags:
  - freellmapi
  - hermes
  - llm
  - atom
  - proxy
  - open-source
description: "Running FreeLLMAPI fork on an Intel Atom D525 2GB RAM laptop as a forever-free LLM fallback proxy for Hermes with hermes:hermes ownership and systemd memory limits."
layout: post.njk
permalink: /freellmapi-atom-d525/
---

# FreeLLMAPI on Intel Atom D525 2GB RAM – Forever-Free LLM Fallback for Hermes

Running a LLM router on a 2009 netbook. It works.

**Repo:** https://github.com/turbolego/freellmapi  
Fork of FreeLLMAPI – 34 free providers, 635 free model endpoints, OpenAI-compatible `/v1`

## Hardware

* Intel Atom D525 Dual-core 1.8 GHz
* No SSE4.1/4.2, no AVX, no AES-NI
* 2 GB RAM total
* Debian-based, SSH only

Goal: freellmapi as fallback proxy for Hermes at `localhost:3001`. Forever-free tiers only. Run as non-root user `hermes`.

## Ownership reset hermes:hermes

```bash
sudo -u hermes -i
cd ~/freellmapi
rm -rf node_modules package-lock.json
chown -R hermes:hermes ~/freellmapi
npm ci --omit=dev --no-audit --no-fund
NODE_OPTIONS=--max-old-space-size=384 node server.js
```

Health check:

```bash
curl -s http://localhost:3001/v1/models | jq '.data | length'
curl -s http://localhost:3001/health
```

## Systemd with memory limits

`/etc/systemd/system/freellmapi.service`

```ini
[Unit]
Description=FreeLLMAPI fallback proxy for Hermes
After=network-online.target

[Service]
User=hermes
Group=hermes
WorkingDirectory=/var/lib/hermes/freellmapi
Environment=NODE_ENV=production
Environment=PORT=3001
Environment=NODE_OPTIONS=--max-old-space-size=384
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5

MemoryMax=512M
MemoryHigh=384M
MemoryLow=128M
CPUQuota=80%
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=/var/lib/hermes/freellmapi

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now freellmapi.service
systemctl status freellmapi
```

## Hermes fallback

Provider: `http://localhost:3001/v1`
Model: `auto`

Test:

```bash
curl -s -X POST http://localhost:3001/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{"model":"auto","messages":[{"role":"user","content":"ping"}]}' | jq .choices[0].message.content
```

## Free-tier discipline

* Forever-free tiers only
* Router picks best available model, auto failover on rate-limit
* Per-key usage tracking, encrypted keys
* Cut dead/non-free providers decisively

## Monitoring on 2GB

```bash
ps -o pid,rss,cmd -C node
systemctl show freellmapi --property=MemoryCurrent
```

Keep RSS <400 MB, heap <384 MB.

## Security

Run as hermes:hermes, never root. Tailscale only. Weekly `npm audit`. Security audit priority.

Result: one OpenAI-compatible endpoint, 34 free providers, stable on Atom D525, non-root, reproducible.

## Changes vs upstream tashfeenahmed/freellmapi

This fork currently differs from upstream in documentation only. The approach demonstrates how to tune a FreeLLMAPI fork for constrained hardware.

| File | Change | Reason |
|------|--------|--------|
| `README.md` | Added Atom D525 edition banner and fork notes at top | Clarify hardware target, non-root install, memory limits, and deployment guide |
| `README.md` | Added “Changes vs upstream” table and tuning example | Document how to adapt FreeLLMAPI for specific CPU/RAM constraints |
| *(no code changes yet)* | - | Core code remains upstream; tuning is via systemd, env vars, and provider pruning |

### Using this fork as a tuning template

To adapt FreeLLMAPI for a specific CPU:

1. **Ownership & reinstall** – `rm -rf node_modules && chown -R user:user && npm ci --omit=dev`
2. **Memory caps** – systemd `MemoryMax=512M`, `MemoryHigh=384M`, `NODE_OPTIONS=--max-old-space-size=384`
3. **CPU flags** – avoid native builds, Node 20+ only, no AVX paths
4. **Catalog sync** – throttle to monthly snapshot to reduce background work
5. **Provider pruning** – keep forever-free tiers only, remove heavy media providers
6. **UI** – dark mode default, minimal UI to reduce JS heap

These steps keep RSS <400 MB on Atom D525 with 2 GB RAM while retaining OpenAI-compatible routing for Hermes.

## Atom D525 2GB RAM fork – what changed

This fork is tuned for an Intel Atom D525 dual-core 1.8 GHz, no SSE4.1/4.2/AVX/AES-NI, 2 GB RAM.

Changes vs upstream:
- Non-root install as user `hermes`: delete node_modules, reinstall, ownership hermes:hermes
- Systemd unit with MemoryMax=512M, MemoryHigh=384M, MemoryLow=128M, CPUQuota=80%
- NODE_OPTIONS=--max-old-space-size=384
- No native builds, no AVX code paths, Node 20+ only
- Router catalog sync throttled to monthly snapshot by default
- Dashboard dark mode default, minimal UI
- Forever-free tiers only, dead/non-free providers pruned

See the full README for details: https://github.com/turbolego/freellmapi-atom-d525

Links
* Repo: https://github.com/turbolego/freellmapi
* Dashboard: https://freellmapi.co
## Build freellmapi from source for Atom D525

Build from source on Atom D525 requires no native compilation. FreeLLMAPI is pure Node.js.

1. **Install prerequisites** (Debian/Ubuntu)

```bash
sudo apt update
sudo apt install -y curl git nodejs npm ca-certificates
```

Node 20+ is required. Verify:

```bash
node --version  # v20.x or newer
npm --version
```

2. **Clone and ownership reset as hermes**

```bash
sudo useradd -m -s /bin/bash hermes || true
sudo -u hermes -i
cd ~/
git clone https://github.com/turbolego/freellmapi-atom-d525.git freellmapi
cd freellmapi
rm -rf node_modules package-lock.json
chown -R hermes:hermes ~/freellmapi
```

3. **Install dependencies without dev packages**

```bash
npm ci --omit=dev --no-audit --no-fund
```

Atom D525 has limited CPU and RAM — avoid watch mode, native builds, and heavy scripts.

4. **Set environment for constrained hardware**

```bash
export NODE_OPTIONS=--max-old-space-size=384
export NODE_ENV=production
export PORT=3001
```

5. **Run manually for testing**

```bash
node server.js
```

Health checks:

```bash
curl -s http://localhost:3001/v1/models | jq '.data | length'
curl -s http://localhost:3001/health
```

6. **Install as systemd service** (see Systemd with memory limits above)

Copy the service file from this page to `/etc/systemd/system/freellmapi.service` and enable.

7. **Optional: prune providers for forever-free tiers**

Edit `server/src/config/providers.ts` or use the dashboard **Keys** page to keep only forever-free providers. Remove heavy media providers on 2GB RAM.

8. **Catalog sync**

Free installs sync catalog from freellmapi.co twice daily. On Atom D525, throttle to monthly snapshot to reduce background work. Set in dashboard or env.

Result: pure Node.js build, no native compilation, <400 MB RSS, OpenAI-compatible endpoint for Hermes.

