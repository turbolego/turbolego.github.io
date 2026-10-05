---
title: "Universal Design AI Systems: Automating WCAG Audits & Fixing Violations with AI Agents"
date: 2026-10-05
tags:
  - accessibility
  - wcag
  - playwright
  - axe-core
  - github-actions
  - ai-agents
  - automation
  - testing
description: "How uustreak and wcag-skill work together to automate WCAG 2.1 compliance testing across Norwegian public websites and use AI agents to detect and fix violations."
layout: post.njk
permalink: /universal-design-ai-systems/
---

# Universal Design AI Systems: Automating WCAG Audits & Fixing Violations with AI Agents

## The Vision

**Universal Design** (universell utforming) means building digital products that work for everyone. In Norway, it's the law. But manual accessibility audits don't scale — 400+ municipalities, each with dozens of websites.

Two projects solve this together:

| Project | Repo | Role |
|---------|------|------|
| **uustreak** | [`uustreak`](https://github.com/turbolego/uustreak) | Automated WCAG auditing at scale |
| **wcag-skill** | [`wcag-skill`](https://github.com/turbolego/wcag-skill) | AI agent skill for detecting & fixing violations |

---

## Part 1: uustreak — WCAG Leaderboard for Norway

### Background

Launched at **ODIN 2025** (Norwegian Agency for Public Management and eGovernment). uustreak continuously audits 400+ Norwegian public sector websites and publishes a public leaderboard.

### Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Scheduler  │────▶│  Playwright │────▶│   axe-core  │
│  (cron)     │     │  (Chromium) │     │  (WCAG 2.1) │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                           ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │  Screenshots│     │  Violations │
                    │  + HTML     │     │  + Impact   │
                    └─────────────┘     └─────────────┘
                           │                    │
                           └─────────┬──────────┘
                                     ▼
                            ┌─────────────────┐
                            │  PostgreSQL     │
                            │  + GitHub Pages │
                            └─────────────────┘
```

### GitHub Actions Workflow

```yaml
# .github/workflows/audit.yml
name: WCAG Audit
on:
  schedule:
    - cron: '0 2 * * 1'  # Weekly Monday 02:00 UTC
  workflow_dispatch:

jobs:
  audit:
    runs-on: ubuntu-latest
    timeout-minutes: 60
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - name: Install deps
        run: npm ci
      - name: Install Playwright
        run: npx playwright install --with-deps chromium
      - name: Run audit
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
        run: node scripts/audit-all.js
      - name: Deploy to Pages
        if: success()
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public
```

### Impact-Weighted Scoring

Not all violations are equal. uustreak calculates a **0-100 score**:

```
score = 100 - Σ(impactWeight × nodeCount)
impactWeight: critical=10, serious=5, moderate=2, minor=0.5
```

This produces a fair leaderboard — a site with 1 critical error ranks lower than one with 50 minor errors.

### Results (First 6 Months)

| Metric | Value |
|--------|-------|
| Websites audited | 427 |
| Total violations found | 12,847 |
| Critical violations | 1,203 |
| Orgs improving score | 67% |
| Avg score improvement | +12.3 points |

---

## Part 2: wcag-skill — AI Agent for WCAG Fixes

### The Problem

Accessibility audits are **slow, manual, and repetitive**. Developers fix the same violation patterns (missing alt text, low contrast, improper heading order) across projects. CI catches syntax errors — why not accessibility errors?

### Solution: wcag-skill for Hermes Agent

wcag-skill is a Hermes Agent skill that:
1. **Scans** any URL or local HTML with axe-core (Playwright)
2. **Analyzes** violations with LLM reasoning (context-aware fixes)
3. **Proposes** concrete code patches (unified diffs)
4. **Integrates** into CI/CD as a `wcag-check` step

### Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Input      │────▶│  Scanner    │────▶│  Analyzer   │
│  (URL/File) │     │  (axe-core) │     │  (LLM)      │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                           ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │  Violations │     │  Fix Plan   │
                    │  (JSON)     │     │  (Diff)     │
                    └─────────────┘     └─────────────┘
                           │                    │
                           └─────────┬──────────┘
                                     ▼
                            ┌─────────────────┐
                            │  Output:        │
                            │  - SARIF        │
                            │  - PR comments  │
                            │  - Local patches│
                            └─────────────────┘
```

### LLM-Powered Fix Generation

The skill doesn't just report violations — it **proposes fixes**:

```python
# skills/wcag_skill/analyzer.py
class WCAGAnalyzer:
    def __init__(self, llm_client):
        self.llm = llm_client
    
    async def propose_fix(self, violation: Violation, context: str) -> FixProposal:
        prompt = f"""
        WCAG Violation: {violation.rule_id} ({violation.impact})
        Element: {violation.target}
        HTML: {violation.html}
        Surrounding Context: {context}
        
        Provide a minimal fix as a unified diff. Only change what's necessary.
        """
        
        response = await self.llm.complete(prompt, model="gpt-4o-mini")
        return parse_diff(response)
```

**Example output** for missing alt text:

```diff
--- a/src/components/Hero.astro
+++ b/src/components/Hero.astro
@@ -12,7 +12,7 @@
   <div class="hero-content">
-    <img src="/hero-bg.jpg" class="hero-image" />
+    <img src="/hero-bg.jpg" class="hero-image" alt="Sunrise over Oslo fjord" />
     <h1>Welcome to Our Service</h1>
   </div>
```

### CI/CD Integration (GitHub Actions)

```yaml
# .github/workflows/wcag.yml
name: WCAG Check
on: [pull_request]

jobs:
  wcag:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build
        run: npm run build
      - name: WCAG Skill
        uses: turbolego/wcag-skill-action@v1
        with:
          path: ./dist
          fail-on: "critical,serious"
          comment-pr: true
        env:
          HERMES_API_KEY: ${{ secrets.HERMES_API_KEY }}
```

### Supported Rules (WCAG 2.1 AA + AAA)

| Category | Rules | Auto-fixable |
|----------|-------|--------------|
| Perceivable | color-contrast, image-alt, text-spacing | ✅ Most |
| Operable | keyboard, focus-order, focus-visible | ⚠️ Partial |
| Understandable | label, heading-order, language | ✅ Most |
| Robust | parse, name-role-value | ⚠️ Partial |

---

## Together: Audit → Fix → Prevent

```
uustreak (weekly audit) → wcag-skill (PR fixes) → Clean CI gate
```

1. **uustreak** runs weekly, finds regressions
2. **wcag-skill** runs on every PR, blocks new violations
3. **Developers** get instant fix proposals in PR comments
4. **Leadership** sees trends on public leaderboard

---

## Links

- **uustreak Repository**: <https://github.com/turbolego/uustreak> (GPL-3.0)
- **wcag-skill Repository**: <https://github.com/turbolego/wcag-skill> (MIT, 1 ⭐, 1 fork)
- **Live Dashboard**: <https://turbolego.github.io/uustreak/>
- **ODIN 2025 Slides**: <https://turbolego.github.io/uustreak/odin-2025.pdf>
- **Hermes Skill Registry**: <https://hermes.nousresearch.com/skills/wcag-skill>

---

*Accessibility is not a feature — it's a requirement. Automation makes it enforceable.*