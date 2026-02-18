# `packages/core/src/interceptHideParams.js`

<!--
source: packages/core/src/interceptHideParams.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../architecture.index.md)

## Goal

Detects `?hide` and `?show` URL query parameters and triggers the corresponding hide-mode transitions. This module serves as the entry point for toggling hide mode via URL — users (or links) can append `?hide` to activate clean-URL mode or `?show` to restore overrides to the hash.

Called both at app startup and on every client-side navigation (via `popstate`), making hide mode toggleable through browser back/forward navigation as well.

## Composition

### Exports

| Export | Type | Description |
|--------|------|-------------|
| `interceptHideParams()` | `() → void` | Check current URL for `?hide` or `?show` and act on them. Idempotent. |
| `installHideParamListener()` | `() → void` | Run `interceptHideParams()` immediately, then install a `popstate` listener for future navigations. Call once at startup. |

### Logic flow

```
interceptHideParams()
  ├── URL has ?hide → activateHideMode() → return
  └── URL has ?show → deactivateHideMode() → return
```

Both `activateHideMode()` and `deactivateHideMode()` (from [`hideMode.js`](./hideMode.js.md)) handle stripping the query param from the URL after acting on it.

## Dependencies

| Module | Imports |
|--------|---------|
| [`packages/core/src/hideMode.js`](./hideMode.js.md) | `activateHideMode`, `deactivateHideMode` |

## Dependents

| File | How |
|------|-----|
| [`packages/core/src/index.js`](./index.js.md) | Re-exports `interceptHideParams`, `installHideParamListener` |
| [`src/index.jsx`](../../../src/index.jsx.md) | Calls `installHideParamListener()` at startup via `@dfosco/storyboard-core` |
| [`packages/react/src/hashPreserver.js`](../../react/src/hashPreserver.js.md) | Imports `interceptHideParams` and calls it after client-side navigations and on `popstate` |

## Notes

- `interceptHideParams()` returns early after the first matching param (`?hide` takes priority over `?show` if both are present).
- The function is safe to call multiple times — it only acts if the param is currently in the URL.
- The `popstate` listener installed by `installHideParamListener()` ensures that browser back/forward through a `?hide`/`?show` URL re-triggers the mode transition.
