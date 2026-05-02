# Plan: Unified Config Architecture

## Problem

The storyboard config system has **6+ separate JSON config files** and **8+ reactive stores**, each with its own read path, merge logic, and init sequence. From a DX perspective, keeping separate files makes sense — each has a clear domain. But from a **system perspective**, this creates complexity:

- `mountStoryboardCore()` has a 20+ step init sequence that must run in order
- Config merging logic is scattered across data plugin, mount, and module-level imports
- Adding a new config source requires touching 3-4 files
- Prototype-level overrides only work for toolbar — not for other config types

## Proposal: Unified Config Store with Domain-Specific Files

**Keep separate files for authoring. Flatten into a single config object at read time. Fully backward compatible — no consumer migration needed.**

### Architecture

```
Files (DX layer — what users edit):                      Priority (user layer):
  widgets.config.json        — widget schemas, defaults      1 (lowest)
  paste.config.json          — paste rules                   2
  toolbar.config.json        — tools, surfaces, shortcuts    3
  commandpalette.config.json — sections, menus               4
  storyboard.config.json     — identity, features, modes     5 (highest)
  
  ↓ Vite data plugin reads & merges at build time ↓

Core defaults (bundled in @dfosco/storyboard-core):
  packages/core/toolbar.config.json
  packages/core/commandpalette.config.json
  packages/core/paste.config.json
  packages/core/widgets.config.json

  ↓ Core defaults are ALWAYS lowest priority ↓

Unified config object (system layer — what code reads):
  {
    toolbar: { ... },           // core defaults → user toolbar.config.json → storyboard.config.json.toolbar
    commandPalette: { ... },    // core defaults → user commandpalette.config.json → storyboard.config.json.commandPalette
    paste: { ... },             // core defaults → user paste.config.json
    widgets: { ... },           // core defaults → user widgets.config.json
    featureFlags: { ... },      // from storyboard.config.json.featureFlags
    modes: { ... },             // from storyboard.config.json.modes
    ui: { ... },                // from storyboard.config.json.ui
    canvas: { ... },            // from storyboard.config.json.canvas
    comments: { ... },          // from storyboard.config.json.comments
    customerMode: { ... },      // from storyboard.config.json.customerMode
    plugins: { ... },           // from storyboard.config.json.plugins
    repository: { ... },        // from storyboard.config.json.repository
  }
```

### Override priority (lowest → highest)

1. **Core defaults** — bundled in `@dfosco/storyboard-core` (always present)
2. **User `widgets.config.json`** — widget schemas, sizes, defaults
3. **User `paste.config.json`** — paste rules
4. **User `toolbar.config.json`** — toolbar tools, surfaces
5. **User `commandpalette.config.json`** — command palette sections
6. **User `storyboard.config.json`** — project config (highest priority, can override anything)
7. **Prototype-level overrides** — per-prototype config files (applied at runtime on navigation)

### Overlap detection

When the same key exists in **two different user config files**, the system does NOT error — it merges according to priority. But it **emits a warning** in the terminal:

```
[storyboard] ⚠ Config overlap: "tools.secret-code" is defined in both toolbar.config.json and storyboard.config.json.toolbar — storyboard.config.json wins.
```

This helps users understand why a config value isn't taking effect without breaking their setup.

When the same key exists in **the same file** (JSON parse handles this — last value wins), no warning is needed.

### How it works

1. **Build time (data plugin)**: Read all config files, deep-merge by priority, detect overlaps and emit warnings, produce a single `initConfig(unifiedConfig)` call in the virtual module
2. **Runtime (single store)**: One `configStore.js` holds the full merged config. Supports subscriptions and domain-specific getters
3. **Backward compatibility**: Existing stores (`toolbarConfigStore`, `canvasConfig`, etc.) become thin wrappers that read from the unified store. **No consumer code needs to change.** All existing imports (`getToolbarConfig`, `initFeatureFlags`, etc.) continue to work
4. **Prototype overrides**: When navigating to a prototype with local config files, the store accepts scoped overrides — generalized from the current toolbar-only pattern

### Size concern analysis

Current total config size: **~36 KB** across all files

| File | Size |
|------|------|
| `widgets.config.json` | 24.6 KB |
| `toolbar.config.json` | 7.2 KB |
| `commandpalette.config.json` | 1.8 KB |
| `paste.config.json` | 1.5 KB |
| `storyboard.config.json` | 0.9 KB |

**Verdict: size is not a concern.** 36 KB as a single object is negligible — smaller than most data already emitted by the virtual module. One parse + one store instead of 8 separate init calls is strictly faster.

## Implementation Todos

### Phase 1: Unified config store (foundation)

- **unified-config-store** — Create `packages/core/src/configStore.js`:
  - `initConfig(config)` — seed the full unified config
  - `getConfig(domain?)` — get full config or a domain slice
  - `setOverrides(domain, overrides)` / `clearOverrides(domain)` — prototype-level overrides
  - `subscribeToConfig(callback)` — single subscription point
  - `getConfigSnapshot()` — for `useSyncExternalStore`

- **use-config-hook** — Create `packages/react/src/hooks/useConfig.js`:
  - `useConfig(domain?)` — React hook wrapping `useSyncExternalStore`

### Phase 2: Build-time unification (data plugin)

- **data-plugin-unify** — Update `packages/react/src/vite/data-plugin.js`:
  - Read all config files in one pass with priority-aware merge
  - Detect key overlaps between user config files, emit terminal warnings
  - Emit a single `initConfig(unified)` call in the virtual module
  - Keep per-file HMR watching — any config file change invalidates the virtual module

### Phase 3: Mount simplification + backward compat wrappers

- **mount-simplify** — Simplify `mountStoryboardCore()`:
  - Replace scattered init calls with unified store reads
  - Keep side effects (theme, body classes, etc.) sourced from one place
  - Remove `consumeClientToolbarOverrides()` pattern

- **backward-compat-wrappers** — Turn existing stores into thin wrappers:
  - `toolbarConfigStore.js` → `getConfig('toolbar')`
  - `commandPaletteConfig.js` → `getConfig('commandPalette')`
  - `canvasConfig.js` → `getConfig('canvas')`
  - `uiConfig.js` → `getConfig('ui')`
  - `featureFlags.js` → `getConfig('featureFlags')` + localStorage sync
  - `comments/config.js` → `getConfig('comments')`
  - `customerModeConfig.js` → `getConfig('customerMode')`
  - `plugins.js` → `getConfig('plugins')`
  - All existing public API exports (`getToolbarConfig`, `initFeatureFlags`, etc.) continue to work unchanged

### Phase 4: Prototype override generalization

- **proto-overrides** — Generalize prototype-level overrides:
  - Any config file placed in a prototype directory overrides its domain
  - Data plugin discovers prototype-local configs for all domains (not just toolbar)
  - `StoryboardProvider` calls `setOverrides(domain, ...)` on route change

## Notes

- **No consumer migration** — existing imports work unchanged. The wrappers delegate to the unified store internally. Consumers can optionally adopt `getConfig()` / `useConfig()` for cleaner code, but it's not required.
- **Feature flags** have localStorage sync logic — the wrapper preserves this by reading from unified store for defaults and overlaying localStorage values.
- **Custom handlers** (`custom:` prefix) are registered at runtime via `mountStoryboardCore({ handlers })` — separate from config, stays as-is.
- **paste.config.json and widgets.config.json** are currently pure module-level imports (not reactive stores). Making them go through the unified store makes them overridable per-prototype — a net positive.
