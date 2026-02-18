# Feature Flag System

## Problem

Storyboard needs a feature flag system for toggling experimental features at runtime. Flags should be:

- Defined in a new `storyboard.config.json` at the project root
- Implemented as core functions (framework-agnostic) with a thin React hook wrapper
- Visible and toggleable in the DevTools debug menu
- Persisted in localStorage for defaults, written to URL hash on change so outcomes are shareable

## Approach

Inspired by the rethink project's `FEATURE_FLAGS` pattern but adapted to storyboard's architecture:

- **Core** (`packages/core`): Full feature flag API — `initFeatureFlags()`, `getFlag()`, `setFlag()`, `toggleFlag()`, `getAllFlags()`, `resetFlags()`. Uses existing `localStorage.js` for default persistence and `session.js` (URL hash) for shareable overrides. Read priority: **hash → localStorage → config defaults**.
- **React** (`packages/react`): A single `useFeatureFlag(key)` hook using `useSyncExternalStore` that wraps core's `getFlag()`.
- **Vite plugin** (`packages/react/src/vite/data-plugin.js`): Discovers `storyboard.config.json` at project root, reads `featureFlags`, and calls `initFeatureFlags()` in the generated virtual module.
- **DevTools** (`packages/react-primer/src/DevTools/DevTools.jsx` + `packages/core/src/devtools.js`): Feature flags appear as toggleable menu items with checkmarks.

## Config File Shape

```json
// storyboard.config.json (project root)
{
  "featureFlags": {
    "some-feature": true,
    "experimental-thing": false
  }
}
```

This is a new file. It will hold all global config keys for the project. Feature flags are the first key; more can be added later.

## Persistence & Read Priority

1. **URL hash** (`#flag.some-feature=true`) — highest priority, shareable
2. **localStorage** (`storyboard:flag.some-feature`) — persists across reloads
3. **Config defaults** (from `storyboard.config.json`) — fallback

When a user toggles a flag via DevTools:
- The override is written to the **URL hash** (so the result is immediately shareable)
- localStorage holds the config defaults (seeded at init)

When `resetFlags()` is called:
- All `flag.*` hash params and localStorage overrides are removed
- Flags revert to config defaults

## Todos

### 1. `core-feature-flags` — Create `featureFlags.js` in core

**File:** `packages/core/src/featureFlags.js`

Functions:
- `initFeatureFlags(defaults)` — stores flag defaults in module-level state, seeds localStorage with defaults (doesn't overwrite existing)
- `getFlag(key)` → `boolean` — reads hash → localStorage → defaults
- `setFlag(key, value)` — writes to URL hash (`flag.{key}=true/false`)
- `toggleFlag(key)` — reads current value, writes opposite to hash
- `getAllFlags()` → `{ key: { default, current } }` — returns all flags with resolved values
- `resetFlags()` — removes all `flag.*` hash params and localStorage overrides
- `getFlagKeys()` → `string[]` — returns all registered flag keys

Uses existing imports from `session.js` (`getParam`, `setParam`, `removeParam`, `getAllParams`) and `localStorage.js` (`getLocal`, `setLocal`, `removeLocal`).

All flag keys in hash/localStorage are prefixed with `flag.` (e.g., `flag.some-feature`).

### 2. `core-exports` — Export feature flag functions from core barrel

**File:** `packages/core/src/index.js`

Add exports for all feature flag functions.

### 3. `react-hook` — Create `useFeatureFlag` hook

**File:** `packages/react/src/hooks/useFeatureFlag.js`

```js
import { useSyncExternalStore } from 'react'
import { getFlag, subscribeToHash, getHashSnapshot, subscribeToStorage, getStorageSnapshot } from '@dfosco/storyboard-core'

export function useFeatureFlag(key) {
  // Subscribe to both hash and storage changes for reactivity
  const hashSnap = useSyncExternalStore(subscribeToHash, getHashSnapshot)
  const storageSnap = useSyncExternalStore(subscribeToStorage, getStorageSnapshot)
  // Re-derive on every snapshot change
  return getFlag(key)
}
```

### 4. `react-exports` — Export hook from react barrel

**File:** `packages/react/src/index.js`

Add `useFeatureFlag` export.

### 5. `vite-config` — Update Vite plugin to discover `storyboard.config.json`

**File:** `packages/react/src/vite/data-plugin.js`

In `generateModule()`:
- Check for `storyboard.config.json` at project root
- If found, parse it and extract `featureFlags`
- Add `import { initFeatureFlags } from '@dfosco/storyboard-core'` to the generated module
- Add `initFeatureFlags(...)` call with the parsed defaults

In `configureServer()`:
- Watch `storyboard.config.json` for changes, invalidate on change

### 6. `devtools-primer` — Add flag toggles to React DevTools

**File:** `packages/react-primer/src/DevTools/DevTools.jsx`

- Import `getAllFlags`, `toggleFlag` from core
- Add a divider + "Feature Flags" group header after existing menu items
- For each flag, render an `ActionList.Item` with a check icon for enabled flags
- `onSelect` calls `toggleFlag(key)` which writes to hash
- Re-render on hash changes (already reactive via `useSyncExternalStore` or `useEffect` listening to hash)

### 7. `devtools-core` — Add flag toggles to vanilla JS DevTools

**File:** `packages/core/src/devtools.js`

- Import `getAllFlags`, `toggleFlag` from `./featureFlags.js`
- Add a separator + feature flag toggle buttons to the menu
- Each button shows flag name + check/uncheck icon
- Click handler calls `toggleFlag(key)`
- Listen for hash changes to update check state

### 8. `create-config` — Create initial `storyboard.config.json`

**File:** `storyboard.config.json` (project root)

```json
{
  "featureFlags": {}
}
```

Empty to start — consuming projects add their own flags.

### 9. `build-verify` — Verify build passes

Run `npm run build` and `npm run lint` to ensure everything works.

## Dependency Order

```
core-feature-flags → core-exports → react-hook → react-exports
                                  → vite-config
                                  → devtools-primer
                                  → devtools-core
core-feature-flags → create-config
All → build-verify
```
