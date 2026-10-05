---
title: "A 3D Globe Badge for Your GitHub Profile Contributions"
date: 2025-06-20
tags:
  - github
  - badge
  - webgl
  - cobe
  - javascript
description: "github-contrib-globe-badge: a lightweight 3D globe visualization of your GitHub contributions using shuding/cobe, deployed as a GitHub Pages badge."
layout: post.njk
permalink: /github-contrib-globe-badge/
---

# A 3D Globe Badge for Your GitHub Profile Contributions

## Inspiration

GitHub contribution graphs are flat. Why not make them spin?

## Tech

- **cobe** — lightweight 3D globe by @shuding
- **JavaScript** — no backend required
- **GitHub GraphQL API** — fetches contributions via `user = viewer` query
- **GitHub Pages** — free hosting

## Usage

### Embed in README

```markdown
[![Contributions Globe](https://turbolego.github.io/github-contrib-globe-badge/turbolego.svg)](https://github.com/turbolego)
```

### Interactive Version

```html
<script src="https://unpkg.com/github-contrib-globe-badge@latest/badge.js"></script>
<div id="globe" data-username="turbolego"></div>
```

## How It Works

1. Load contributions from GitHub GraphQL API
2. Map contribution count → latitude/longitude color intensity
3. Render with cobe using WebGL
4. Auto-rotate slowly, pause on hover

## Customization

| Parameter | Description | Default |
|-----------|-------------|---------|
| `data-username` | GitHub username | required |
| `data-theme` | `dark` or `light` | `dark` |
| `data-size` | Diameter in pixels | `200` |
| `data-auto-rotate` | `true` / `false` | `true` |

## Development

```bash
cd github-contrib-globe-badge
npm install
npm run dev    # local server at localhost:3000
npm run build  # outputs to dist/
```

Deploy to GitHub Pages:
```bash
npm run deploy  # pushes dist/ to gh-pages branch
```

## Links

- **Repository**: <https://github.com/turbolego/github-contrib-globe-badge>
- **Live Demo**: <https://turbolego.github.io/github-contrib-globe-badge/>
- **cobe**: <https://github.com/shuding/cobe>

---

*Your contributions, on a sphere.*