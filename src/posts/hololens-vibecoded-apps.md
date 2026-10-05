---
title: "HoloLens Vibecoded Apps: What If ChatGPT Was Released in 2016?"
date: 2025-07-10
tags:
  - hololens
  - mixed-reality
  - uwp
  - csharp
  - holograms
  - ai-agents
  - hermes-agent
description: "Exploring vibecoded apps for the Microsoft HoloLens 1 using Hermes AI agents — airplane viewer, satellite viewer, IKEA furniture preview, GO navigation, and Hermes integration."
layout: post.njk
permalink: /hololens-vibecoded-apps/
---

# HoloLens Vibecoded Apps: What If ChatGPT Was Released in 2016?

## The Premise

**2016**: Microsoft releases HoloLens 1 — the first standalone mixed-reality headset.  
**2016 (alternate timeline)**: ChatGPT is released the same year.

What would developers build with AI-assisted coding on day one? This project explores that question by building **five HoloLens prototypes** using Hermes AI agents as coding assistants.

## The Five Apps

| App | Repo | Description |
|-----|------|-------------|
| **Airplane Viewer** | `HololensAirplaneViewer` | Live aircraft in your room (ADS-B Exchange API) |
| **Satellite Viewer** | `HololensSatelliteViewer` | Satellites orbiting Earth in your space (CelesTrak TLE) |
| **IKEA Preview** | `HololensIKEA` | Preview IKEA furniture at 1:1 scale in your living room |
| **GO Navigation** | `HololensGo` | AR navigation with OpenStreetMap + OSRM |
| **Hermes Integration** | `HololensHermes` | Hermes AI agent running on HoloLens for voice commands |

---

## Common Architecture

```
[Data Service] → [Azure Functions] → [HoloLens App]
      ↓                ↓                  ↓
   ADS-B / TLE    JSON over HTTPS   MRTK spatial anchors
```

All five share:
- `SpatialAnchorManager.cs` — persistence of holograms across sessions
- `VoiceCommandHandler.cs` — "show", "hide", "follow", "navigate"
- `PerformanceMonitor.cs` — 60 fps budget tracking
- `HermesClient.cs` — local Hermes agent for on-device AI assistance

---

## 1. HololensAirplaneViewer

**Goal**: See live aircraft in your room at 1:1 scale.

- Data source: ADS-B Exchange API (real-time flight positions)
- Rendering: Unity + MRTK, aircraft models scaled 1:1
- Interaction: Pinch to follow a specific flight, voice command "show Lufthansa 452"
- Hermes: "Find all flights from Oslo to Bergen" → filters & highlights

---

## 2. HololensSatelliteViewer

**Goal**: Visualize satellites orbiting Earth in your space.

- Data source: CelesTrak TLE feeds, SGP4 propagation
- Rendering: Low-poly Earth sphere, satellite paths as holographic wires
- Feature: Time scrubbing — see where satellites were/will be
- Hermes: "Show me Starlink satellites passing over Norway in next hour"

---

## 3. HololensIKEA

**Goal**: Preview IKEA furniture in your living room with accurate scale.

- Data source: IKEA API (planned) → manual model import for prototype
- Calibration: Use HoloLens spatial mapping to find floor plane
- Interaction: Grab handles, scale, rotate, "add to cart"
- Hermes: "Find a bookshelf that fits this 80cm corner"

---

## 4. HololensGo

**Goal**: AR navigation using OpenStreetMap data.

- Route calculation: OSRM locally on Pi
- Holographic arrows anchored to physical world
- Audio cues for turns
- Hermes: "Navigate to nearest coffee shop, avoid stairs"

---

## 5. HololensHermes

**Goal**: Hermes AI agent running locally on HoloLens 1.

- Quantized model (4-bit) on Snapdragon 850
- Voice-only interaction (no keyboard)
- Skills: spatial reasoning, device control, web search
- Demo: "Hermes, create a holographic todo list on that wall"

---

## Building with Hermes ("Vibecoding")

Each app was developed by **prompting Hermes Agent** to:
1. Scaffold UWP project structure
2. Generate MRTK spatial anchor boilerplate
3. Write Azure Function endpoints
4. Create Unity prefabs from descriptions
5. Debug deployment issues

Example prompt:
> "Create a UWP app that fetches ADS-B data from Azure Function, renders aircraft as 3D models at GPS coordinates converted to Unity world space, and supports voice command 'follow flight [callsign]'"

Hermes generated ~80% of the code; human reviewed & integrated.

---

## Build Notes

UWP deployment to HoloLens requires:
```powershell
msbuild HololensAirplaneViewer.sln /p:Configuration=Master /p:Platform=x64
```

## Links

- **HololensAirplaneViewer**: <https://github.com/turbolego/HololensAirplaneViewer>
- **HololensSatelliteViewer**: <https://github.com/turbolego/HololensSatelliteViewer>
- **HololensIKEA**: <https://github.com/turbolego/HololensIKEA>
- **HololensGo**: <https://github.com/turbolego/HololensGo>
- **HololensHermes**: <https://github.com/turbolego/HololensHermes>

---

*Mixed reality is about anchoring data to the real world — not replacing it. AI agents make building for it faster.*