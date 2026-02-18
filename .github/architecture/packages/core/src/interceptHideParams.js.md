# `packages/core/src/interceptHideParams.js`

<!--
source: packages/core/src/interceptHideParams.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Intercepts `?hide` and `?show` URL query parameters to trigger hide mode transitions. Called at app startup and on every client-side navigation (via popstate). When `?hide` is present, it activates hide mode (moves overrides from URL hash to localStorage). When `?show` is present, it deactivates hide mode (restores overrides to the URL hash).

## Composition

```js
export function interceptHideParams() {
  const url = new URL(window.location.href)
  if (url.searchParams.has('hide')) { activateHideMode(); return }
  if (url.searchParams.has('show')) { deactivateHideMode(); return }
}

export function installHideParamListener() {
  interceptHideParams()
  window.addEventListener('popstate', () => interceptHideParams())
}
```

## Dependencies

- [`packages/core/src/hideMode.js`](./hideMode.js.md) — `activateHideMode`, `deactivateHideMode`

## Dependents

- [`packages/core/src/index.js`](./index.js.md) — Re-exports both functions
- [`packages/react/src/hashPreserver.js`](../../react/src/hashPreserver.js.md) — Imports `interceptHideParams` for post-navigation checks
- [`src/index.jsx`](../../../src/index.jsx.md) — Calls `installHideParamListener()` at startup
