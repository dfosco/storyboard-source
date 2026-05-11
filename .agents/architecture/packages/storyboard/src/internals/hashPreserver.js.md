# `packages/storyboard/src/internals/hashPreserver.js`

<!--
source: packages/storyboard/src/internals/hashPreserver.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

`installHashPreserver` patches navigation so storyboard override hashes survive route changes. It intercepts anchor clicks and programmatic router navigations, carries the current hash forward when appropriate, and also checks for `?hide`/`?show` toggles after navigation.

This file is architectural glue between routing and the override system. Hooks such as `useOverride`, `useFlowData`, `useObject`, and `useRecord` assume hash state is durable across page changes; this installer makes that assumption true.

## Composition

```js
export function installHashPreserver(router, basename = '') {
  document.addEventListener('click', (e) => {
    // keep current hash unless target has its own hash or is external
    router.navigate(pathname + targetUrl.search + hash)
    setTimeout(interceptHideParams, 0)
  })

  const originalNavigate = router.navigate.bind(router)
  router.navigate = (to, opts) => {
    if (window.location.hash && typeof to === 'string' && !to.includes('#')) {
      to = to + window.location.hash
    }
    return originalNavigate(to, opts).then((result) => {
      interceptHideParams()
      return result
    })
  }
}
```

- Signature: `installHashPreserver(router, basename = '')`.
- Returns nothing; it mutates router behavior and installs a document click listener.
- It does not subscribe through React, but it reacts to every navigation event.
- The practical effect is that hooks reading hash-backed overrides do not lose state when routes change.

## Dependencies

- Uses `interceptHideParams` from the core index to keep hide/show query params in sync with storage state.

## Dependents

- `packages/storyboard/src/internals/hooks/useOverride.js`, `useSceneData.js`, `useObject.js`, `useRecord.js`, and `useUndoRedo.js` rely on the preserved hash semantics this installer provides.
- The package also exports this file publicly as `@dfosco/storyboard/hash-preserver`.

## Notes

- The foreign-branch guard deliberately avoids client-side interception when a link points at another `/branch--.../` path, forcing a full browser navigation through Caddy instead.
