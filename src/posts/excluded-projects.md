---
title: "Projects Without Dedicated Blog Posts"
date: 2026-10-04
tags:
  - index
  - excluded
  - forks
description: "Repositories that are forks with no substantial original work, or are already covered in other posts. No dedicated blog post planned."
layout: post.njk
permalink: /excluded-projects/
---

# Projects Without Dedicated Blog Posts

The following repositories exist under `turbolego` but will **not** receive individual blog posts.

## Forks Used As-Is (No Substantial Changes)

| Repo | Upstream | Reason |
|------|----------|--------|
| [`hermes-agent`](https://github.com/turbolego/hermes-agent) | [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) | Covered in *Extending Hermes Agent*; only config tweaks for non-root + freellmapi |
| [`freellmapi`](https://github.com/turbolego/freellmapi) | [tashfeenahmed/freellmapi](https://github.com/tashfeenahmed/freellmapi) | Covered in *Running 34 Free LLM Providers…*; only deployment config |
| [`OmniRoute`](https://github.com/turbolego/OmniRoute) | [diegosouzapw/OmniRoute](https://github.com/diegosouzapw/OmniRoute) | Used as-is; no code changes |
| [`Personal-AI-Router`](https://github.com/turbolego/Personal-AI-Router) | [NVIDIA/Personal-AI-Router](https://github.com/NVIDIA/Personal-AI-Router) | Used as-is; no code changes |
| [`axe-core`](https://github.com/turbolego/axe-core) | [dequelabs/axe-core](https://github.com/dequelabs/axe-core) | Only PR #5418 (case-sensitive aria attrs) — mentioned in wcag-skill post |

> *Note: `freellmapi` and `hermes-agent` were removed from included-projects.md (posts deleted) and placed here because they are forks used only for PRs.*

## Simple Tools / Utilities (Low Novelty)

| Repo | Reason |
|------|--------|
| [`authsite`](https://github.com/turbolego/authsite) | Boilerplate Auth0 + GitHub Pages; nothing novel to write about |
| [`bsky-bot-with-image-upload`](https://github.com/turbolego/bsky-bot-with-image-upload) | Standard atproto bot; no unique angle |
| [`committers.top`](https://github.com/turbolego/committers.top) | Thin GraphQL wrapper; no novel content |
| [`dflash`](https://github.com/turbolego/dflash) | Fork/clone of research paper implementation; not production-ready |

## Already Covered in Other Posts

| Repo | Covered In |
|------|------------|
| `iPad2Spotify` + `OldMilk` | *Reviving an iPad 2…* |
| `uustreak` | *Automating WCAG Audits…* |
| `wcag-skill` | *Building an AI Agent Skill…* |
| `RullUt` + `Tilgjengelighet-WMS-OpenLayers` | *Wheelchair-Accessible Routing…* |
| `HololensAirplaneViewer` + `HololensGo` + `HololensIKEA` + `HololensSatelliteViewer` + `HololensHermes` | *Four HoloLens Prototypes…* |
| `github-contrib-globe-badge` | *A 3D Globe Badge…* |
| `Arendalsuka-Multicam-Stream` | *Live-Streaming Arendalsuka…* |

## Notes

- This list is **not** a value judgment — these are useful repos, just not blog-worthy on their own.
- If substantial original work is added to any fork later, it can graduate to its own post.

*Generated 2026-10-04*