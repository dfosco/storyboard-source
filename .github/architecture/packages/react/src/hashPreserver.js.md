# `packages/react/src/hashPreserver.js`

<!--
source: packages/react/src/hashPreserver.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Preserves URL hash params across all navigations — both `<a>` clicks and programmatic `router.navigate()` calls. Without this, React Router would strip the hash on every navigation, losing all override state. Also intercepts `?hide` and `?show` params on every navigation to trigger hide mode transitions.

## Composition

**`installHashPreserver(router, basename?)`** — Call once at app startup. Installs two interceptors:

1. **Click handler** — Intercepts `<a>` clicks, carries the current hash to the target URL (unless the target has its own hash), prevents full page reload by calling `router.navigate()`, and triggers `interceptHideParams` post-navigation.

2. **Navigate wrapper** — Monkey-patches `router.navigate()` to append the current hash to navigation targets that don't already include one.

```js
export function installHashPreserver(router, basename = '') {
  // 1. Intercept <a> clicks
  document.addEventListener('click', (e) => {
    // Skip modifier keys, _blank targets, external links
    // Carry current hash or use target's own hash
    e.preventDefault()
    router.navigate(pathname + targetUrl.search + hash)
    setTimeout(interceptHideParams, 0)
  })

  // 2. Intercept programmatic navigation
  const originalNavigate = router.navigate.bind(router)
  router.navigate = (to, opts) => {
    if (hasCurrentHash && typeof to === 'string' && !to.includes('#')) {
      to = to + currentHash
    }
    return originalNavigate(to, opts).then((result) => {
      interceptHideParams()
      return result
    })
  }
}
```

## Dependencies

- [`packages/core/src/interceptHideParams.js`](../../core/src/interceptHideParams.js.md) — `interceptHideParams` for post-navigation hide/show detection

## Dependents

- [`packages/react/src/index.js`](./index.js.md) — Re-exports `installHashPreserver`
- [`src/index.jsx`](../../../src/index.jsx.md) — Calls `installHashPreserver(router, basename)` at startup
