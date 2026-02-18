# `packages/core/src/session.js`

<!--
source: packages/core/src/session.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Provides URL hash-based session state for storyboard overrides. Session params are stored in the URL fragment (`#key=value`) rather than query params to avoid triggering React Router re-renders. React Router (via generouted) patches `history.replaceState`/`pushState`, so any search-param change would cause a full route tree re-render. The hash is invisible to the router.

## Composition

```js
export function getParam(key)        // Read a single hash param
export function setParam(key, value) // Write a single hash param
export function getAllParams()       // Return all params as { key: value }
export function removeParam(key)     // Remove a single param
```

Internal helpers:
- `parseHash()` — Parses `window.location.hash` into `URLSearchParams`
- `writeHash(params)` — Writes params back via `window.location.hash =` (not `history.replaceState`, which would trigger React Router)

Hash format: `#key1=value1&key2=value2`

## Dependencies

None — pure browser API usage.

## Dependents

- [`packages/core/src/index.js`](./index.js.md) — Re-exports all functions
- [`packages/core/src/hideMode.js`](./hideMode.js.md) — Imports `setParam` for restoring hash on deactivate
- [`packages/react/src/hooks/useOverride.js`](../../react/src/hooks/useOverride.js.md) — Imports `getParam`, `setParam`, `removeParam`
- [`packages/react/src/hooks/useSceneData.js`](../../react/src/hooks/useSceneData.js.md) — Imports `getParam`, `getAllParams`
- [`packages/react/src/hooks/useLocalStorage.js`](../../react/src/hooks/useLocalStorage.js.md) — Imports `getParam`
- [`packages/react/src/hooks/useRecord.js`](../../react/src/hooks/useRecord.js.md) — Imports `getAllParams`

## Notes

Uses `window.location.hash =` instead of `history.replaceState` because generouted/React Router patches `replaceState` and would trigger a full route re-render. Native hash assignment only fires `hashchange`, which React Router ignores.
