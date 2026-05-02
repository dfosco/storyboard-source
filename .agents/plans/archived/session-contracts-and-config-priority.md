# Session: Contracts, Compatibility & Config Priority

> **Date:** 2026-04-28 / 2026-04-29  
> **Branch:** `4.2.0`  
> **Key commits:** `83de8bda`, `b023fada`, `93ac444b`, `5558a45af`

## What happened

### 1. Contracts & Compatibility plan audit

Reviewed `.agents/plans/contracts-and-compatibility.md` — a 7-step plan for shared contracts before feature slices could ship. Found 5/7 steps already done, 2 remaining:

- **Step 4** (basename fallback in `findCanvasPath`) — Implemented, then **reverted** (`b023fada`). The data-plugin's `canvasAliases` system already resolves legacy bare canvas names → canonical path-based IDs on the client side. Server-side basename matching was redundant dead code.

- **Step 6** (scaffold config keys) — Added `canvas.github` (embedBehavior, ghGuard) to scaffold (`83de8bda`). Initially also added `commandPalette.ranking`, then **removed it** (`93ac444b`) because `commandpalette.config.json` already defines it and `storyboard.config.json` had highest merge priority — creating a silent precedence trap.

### 2. Config merge priority fix

Discovered and fixed an inverted config priority order in `buildUnifiedConfig()` (`5558a45af`).

**Old priority (wrong):**
```
core.*.json → user.*.json → storyboard.config.json (highest)
```

**New priority (correct):**
```
configSchema defaults → core.*.json → storyboard.config.json → user.*.json (highest)
```

Domain-specific config files are more intentional/specific, so they should win over the general `storyboard.config.json`. This matches the CSS cascade principle: more specific overrides more general.

**Additional fixes in the same commit:**
- **HMR watching** — was only watching `toolbar.config.json` for changes, now watches all 4 domain config files (toolbar, commandpalette, paste, widgets)
- **Overlap warnings** — was only detecting toolbar/commandPalette overlaps, now covers all 4 domains with a data-driven loop

### 3. Deep merge behavior (confirmed correct)

`deepMergeBuild()` recursively merges plain objects at any depth — only the specific leaf key is overridden, sibling keys are preserved:

```
core:   { key: { a: 1, b: 2, nested: { x: 10, y: 20 } } }
user:   { key: { b: 3, nested: { y: 99 } } }
result: { key: { a: 1, b: 3, nested: { x: 10, y: 99 } } }
```

Arrays and scalars replace entirely (no concat/append).

## Key lessons

1. **Check architecture docs before implementing plan steps** — the contracts plan was written before the canvas folder/page architecture existed. The `canvasAliases` client-side system made server-side basename fallback unnecessary.

2. **Dedicated config files (`*.config.json`) exist for toolbar, commandpalette, paste, widgets** — don't duplicate their keys in `storyboard.config.json` or the scaffold. The dedicated files are authoritative.

3. **Config merge priority matters** — `storyboard.config.json` is for broad project settings; domain configs are for precise control. Specificity wins.

## Files changed

| File | Change |
|------|--------|
| `packages/react/src/vite/data-plugin.js` | Config priority reorder, HMR watching, overlap warnings |
| `packages/core/src/canvas/server.js` | Basename fallback added then reverted (net zero) |
| `packages/core/scaffold/storyboard.config.json` | Added `canvas.github`, removed `commandPalette` |
| `.agents/plans/contracts-and-compatibility.md` | Updated with revised implementation notes |
