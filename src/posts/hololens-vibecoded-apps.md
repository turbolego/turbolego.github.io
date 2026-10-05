---
title: "HoloLens Vibecoded Apps: What If ChatGPT Was Released in 2016?"
date: 2026-10-05
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

> All apps are UWP Direct3D11 / SharpDX, no Unity, x86 for HoloLens 1. CI builds signed `.appxupload` artifacts via GitHub Actions.

## The Five Apps

| App | Repo | Description |
|-----|------|-------------|
| **Airplane Viewer** | `HololensAirplaneViewer` | Live ADS-B aircraft in a dome above you, OpenSky Network, GPS→local mapping |
| **Satellite Viewer** | `HololensSatelliteViewer` | Real-time TLE satellites from CelesTrak, SGP4 propagation, dome visualization |
| **IKEA Preview** | `HololensIKEA` | Runtime GLB download from IKEA, Draco decompression, movable holograms |
| **GO Navigation** | `HololensGo` | Pokémon Go inspired — throw potatoes at Steamboat Willie Mickey, procedural models |
| **Hermes Integration** | `HololensHermes` | Indoor spatial assistant connected to Hermes via Telegram, world-locked floor plans |

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

- Data source: OpenSky Network ADS-B state vectors, fetched every 10s
- GPS: HoloLens Geolocator provides device location (no GPS chip on HoloLens 1)
- Mapping: WGS-84 lat/lon/alt → local world coordinates via planar approximation
- Rendering: Direct3D 11 holographic pipeline draws colour-coded cubes with labels, 0.4 m to the ceiling
- Info panel: floating text with GPS, ICAO, callsign, altitude, relative X/Z

**Screenshot:** `https://github.com/user-attachments/assets/76901ffe-6f87-40e6-901e-94453c87e4f7`

**Repo highlights:**
- `AirplaneRenderer.cs` — holographic cube + bitmap glyph text
- `HolographicPositioning.cs` — lat/lon/alt to world
- `AirplaneService.cs` — OpenSky HTTP client
- CI: dotnet.yml, dotnet-desktop.yml, store-submission.yml
- Deploy: `deploy.ps1` via WinAppDeployCmd

---

## 2. HololensSatelliteViewer

**Goal**: Visualize satellites orbiting Earth in your space.

- Data source: CelesTrak TLEs, fetched every second
- Orbit propagation: SGP4 topocentric azimuth/elevation/range
- Rendering: Direct3D 11, coloured cubes in dome, 0.4 m to ceiling
- Info panel: GPS, TLE stats, name, azimuth, elevation, relative position

**Repo highlights:**
- `SatelliteRenderer.cs` — holographic satellite cube + text
- `OrbitService.cs` + `Sgp4Service.cs` — TLE fetch & propagation
- CI Store pipeline, signed `.appxupload` artifact

---

---

## 3. HololensIKEA

**Goal**: Preview IKEA furniture at 1:1 scale in your living room.

- Unofficial educational hobby project, not affiliated with IKEA
- Runtime downloads: extracts 8-digit IKEA article number from bookmark URL, resolves Rotera static model URL, downloads GLB over HTTPS
- Draco: `KHR_draco_mesh_compression` decoded in memory on HoloLens x86 via native `draco_tiny_dec.dll`
- Manipulation: gaze-sensitive move/rotate handles + command bar

**Repo highlights:**
- `ModelService3D.cs` — IKEA URL resolution, GLB download & parse
- `DracoDecoder.cs` — in-memory Draco decompression
- `GltfMeshRenderer.cs` — Direct3D 11 mesh upload
- `ProductManipulationHandles.cs` — move/rotate/delete UI
- `.github/workflows/update-bookmarks.yml` — scheduled bookmark discovery
- Disclaimer: models never written to repo, only downloaded at runtime

---

---

## 4. HololensGo

**Goal**: Pokémon Go inspired game for HoloLens 1.

- Procedurally generated Steamboat Willie Mickey Mouse spawns 1.5 m in front of user
- Throw potatoes via air-tap gesture, clicker remote, or controller
- Physics: semi-implicit gravity, floor bounce, lateral friction, damping
- Collision: swept segment-versus-sphere (0.15 m radius)
- GameSession owns score, combo, projectile budget, deterministic simulation

**Repo highlights:**
- `Main.cs` — fixed-step game loop
- Tests for projectile & session rules
- `ITERATIONS.md` — 100-cycle gameplay iteration register

---

---

## 5. HololensHermes

**Goal**: Indoor spatial assistant for HoloLens 1 connected to Hermes via Telegram.

- Floor plan: PNG loaded as texture, scaled to real meters via multi-point calibration
- Spatial mapping: `SpatialSurfaceObserver` keeps room mesh up to date
- Targets: Hermes API resolves goal ("find philosophy section") → floor-plan position → `SpatialAnchor` + pulsing marker
- Compass: IMU magnetometer rotates floor plan + arrow with north
- Telegram credentials stored in Windows Credential Vault

**Repo highlights:**
- `HermesApiService` — HTTPS calls to Hermes backend
- `FloorPlanCalibration` — affine transform from pixels → world meters
- Telegram Bot API integration for goal-directed navigation

---

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