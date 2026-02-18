# `packages/react/src/hashPreserver.js`

<!--
source: packages/react/src/hashPreserver.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Preserves URL hash parameters across all client-side navigations in a React Router app. Storyboard stores runtime overrides in the URL hash (e.g. `#user.name=Jane`), so losing the hash on navigation would reset all user-entered state. This module patches two navigation vectors — `<a>` link clicks and programmatic `router.navigate()` calls — to carry the current hash forward automatically.

Additionally, it intercepts `?hide` and `?show` query parameters on every navigation, delegating to `interceptHideParams()` from `@dfosco/storyboard-core` to toggle hide mode.

## Composition

### `installHashPreserver(router, basename)`

Single exported function. Called once at app startup (in `src/index.jsx`) with the React Router instance and the base URL.

**1. Click interception** — A document-level `click` listener intercepts all internal `<a>` clicks:

```js
document.addEventListener('click', (e) => {
  // Skip modifier keys, _blank targets, external origins
  const anchor = e.target.closest('a[href]')
  // ...
  e.preventDefault()
  router.navigate(pathname + targetUrl.search + hash)
  setTimeout(interceptHideParams, 0)
})
```

- Skips links with modifier keys (Cmd/Ctrl+click for new tab)
- Skips `target="_blank"` and external origins
- Strips the `basename` to get the route-relative path
- If the target has its own `#hash`, uses that; otherwise carries the current hash

**2. Programmatic navigate wrapper** — Monkey-patches `router.navigate()`:

```js
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
```

Only appends hash when the target path doesn't already contain one.

### Hash preservation rules

| Condition | Hash behavior |
|-----------|---------------|
| Target has own `#fragment` | Uses target's hash |
| Current URL has a hash, target does not | Carries current hash forward |
| No hash on current URL | No hash added |
| External link | Ignored (normal browser navigation) |

## Dependencies

| Module | Purpose |
|--------|---------|
| `@dfosco/storyboard-core` | `interceptHideParams` — processes `?hide`/`?show` query params |

## Dependents

- [`packages/react/src/index.js`](./index.js.md) — re-exports `installHashPreserver`
- `src/index.jsx` — calls `installHashPreserver(router, import.meta.env.BASE_URL)` at app startup via the `@dfosco/storyboard-react/hash-preserver` entry point

## Notes

- The `basename` is normalized to strip trailing slashes. When the app runs under a sub-path (e.g. `/storyboard`), the basename is stripped from the target pathname before handing it to `router.navigate()`, which expects root-relative paths.
- `interceptHideParams` is called asynchronously (via `setTimeout`) after click navigation to ensure the URL has settled before reading query params.
