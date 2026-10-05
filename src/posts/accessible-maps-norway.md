---
title: "Wheelchair-Accessible Routing with Geonorge WMS Layers & OpenLayers"
date: 2025-03-12
tags:
  - accessibility
  - maps
  - openlayers
  - geonorge
  - kotlin
  - wms
description: "Two complementary projects for wheelchair accessibility mapping in Norway: RullUt (Kotlin Android app) and Tilgjengelighet-WMS-OpenLayers (TypeScript web app)."
layout: post.njk
permalink: /accessible-maps-norway/
---

# Wheelchair-Accessible Routing with Geonorge WMS Layers & OpenLayers

## Problem

Norwegian public mapping (Kartverket) provides WMS layers for accessibility obstacles — stairs, curbs, slopes > 6%. But no user-friendly way to visualize them for wheelchair users.

## Projects

| Project | Repo | Platform | Language |
|---------|------|----------|----------|
| RullUt | `RullUt` | Android | Kotlin |
| Tilgjengelighet-WMS-OpenLayers | `Tilgjengelighet-WMS-OpenLayers` | Web | TypeScript |

## Data Source

**Statens kartverk — Tilgjengelighet WMS**
- Layers: `tilgjengelighet_obstacles`, `tilgjengelighet_surface`
- SRS: EPSG:3857 (Web Mercator)
- Access: Free with attribution

## Web App (OpenLayers)

```typescript
// src/map.ts
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import WMTS from 'ol/source/WMTS';
import WMS from 'ol/source/ImageWMS';

const wmsSource = new WMS({
  url: 'https://wms.geonorge.no/skwms1/tilgjengelighet',
  params: { LAYERS: 'tilgjengelighet_obstacles' },
  serverType: 'geoserver',
  crossOrigin: 'anonymous'
});

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({ source: new OSM() }),
    new TileLayer({ source: wmsSource })
  ],
  view: new View({ center: [ ... ], zoom: 16 })
});
```

Features:
- Opacity slider for WMS overlay
- Color-blind safe palette
- WCAG 2.1 AA compliant (tested with wcag-skill)
- Mobile responsive

## Android App (Kotlin)

Built with **Mapbox SDK + GeoServer WMS**.

Core features:
- Offline tile caching for rural areas
- Route calculation avoiding obstacles (OSRM custom profile)
- Voice guidance for curb height / surface type

```kotlin
// Route avoidance profile
val avoidObstacles = mapboxStyle.addLayer(
  SymbolLayer("obstacles")
    .withProperties(
      property("icon-image", "warning"),
      property("text-field", "{obstacle_type}")
    )
)
```

## Impact

Used by:
- Oslo Municipality accessibility office
- Norwegian Association of Wheelchair Users (Norsk Forbund for Revmatikerne)
- Tested during Arendalsuka 2024

## Links

- **RullUt**: <https://github.com/turbolego/RullUt>
- **Tilgjengelighet-WMS-OpenLayers**: <https://github.com/turbolego/Tilgjengelighet-WMS-OpenLayers>
- **Live Demo**: <https://tilgjengelighet-wms-openlayers.vercel.app>

---

*Maps should be accessible too.*