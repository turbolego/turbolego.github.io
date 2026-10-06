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
description: "Running FreeLLMAPI on an Intel Atom D525 2GB RAM laptop as a forever-free LLM fallback proxy for Hermes with hermes:hermes ownership and systemd memory limits."
layout: post.njk
permalink: /freellmapi-atom-d525/
---

# FreeLLMAPI on Intel Atom D525 2GB RAM – Forever-Free LLM Fallback for Hermes

Running a LLM router on a 2009 netbook. It works.

**Repo:** https://github.com/turbolego/freellmapi  
FreeLLMAPI – 34 free providers, 635 free model endpoints, OpenAI-compatible `/v1`

## Hardware and Goal

* Intel Atom D525 Dual-core 1.8 GHz
* No SSE4.1/4.2, no AVX, no AES-NI
* 2 GB RAM total
* Debian-based, SSH only

Goal: run freellmapi as a fallback proxy for Hermes at `localhost:3001`. Forever-free tiers only. Run as non-root user `hermes`.

## Step-by-step Installation Guide

### Step 1 – Prepare the system

Update packages and install Node.js 20+:

```bash
sudo apt update
sudo apt install -y curl git nodejs npm ca-certificates
node --version  # v20.x or newer required
npm --version
```

Create the non-root user:

```bash
sudo useradd -m -s /bin/bash hermes || true
```

### Step 2 – Clone and reset ownership

```bash
sudo -u hermes -i
cd ~/
git clone https://github.com/turbolego/freellmapi-atom-d525.git freellmapi
cd freellmapi
rm -rf node_modules package-lock.json
chown -R hermes:hermes ~/freellmapi
```

This removes any previous build artifacts and ensures ownership is correct.

### Step 3 – Install dependencies

Install production dependencies only. Atom D525 has limited CPU/RAM, so skip dev packages and audits.

```bash
npm ci --omit=dev --no-audit --no-fund
```

### Step 4 – Set environment for constrained hardware

```bash
export NODE_OPTIONS=--max-old-space-size=384
export NODE_ENV=production
export PORT=3001
```

`NODE_OPTIONS=--max-old-space-size=384` caps V8 heap to 384 MB to stay inside the 2 GB RAM budget.

### Step 5 – Test manually

```bash
node server.js
```

In another terminal, health check:

```bash
curl -s http://localhost:3001/v1/models | jq '.data | length'
curl -s http://localhost:3001/health
```

You should see a model count and a JSON health response.

### Step 6 – Create systemd service with memory limits

Create `/etc/systemd/system/freellmapi.service`:

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

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now freellmapi.service
systemctl status freellmapi
```

### Step 7 – Configure Hermes fallback

In Hermes, set provider:

Provider: `http://localhost:3001/v1`
Model: `auto`

Test:

```bash
curl -s -X POST http://localhost:3001/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{"model":"auto","messages":[{"role":"user","content":"ping"}]}' | jq .choices[0].message.content
```

### Step 8 – Free-tier discipline

* Forever-free tiers only
* Router picks best available model, auto failover on rate-limit
* Per-key usage tracking, encrypted keys
* Cut dead/non-free providers decisively

### Step 9 – Monitoring on 2GB

```bash
ps -o pid,rss,cmd -C node
systemctl show freellmapi --property=MemoryCurrent
```

Keep RSS <400 MB, heap <384 MB.

### Step 10 – Security

Run as hermes:hermes, never root. Tailscale only. Weekly `npm audit`. Security audit priority.

Result: one OpenAI-compatible endpoint, 34 free providers, stable on Atom D525, non-root, reproducible.

This document shows how to run FreeLLMAPI on Intel Atom D525 2GB RAM as a non-root hermes:hermes fallback proxy for Hermes with systemd memory limits.

Links
* Repo: https://github.com/turbolego/freellmapi
* Dashboard: https://freellmapi.co