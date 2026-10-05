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

Links
* Repo: https://github.com/turbolego/freellmapi
* Dashboard: https://freellmapi.co
