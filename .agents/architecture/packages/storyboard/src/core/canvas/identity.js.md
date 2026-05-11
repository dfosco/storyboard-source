# `packages/storyboard/src/core/canvas/identity.js`

<!--
source: packages/storyboard/src/core/canvas/identity.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/core/canvas/identity.js`](./identity.js.md) defines the canonical ID scheme for canvases. It converts file paths into stable, path-aware identifiers so server routes, Vite indexing, rename handling, and browser selection state can refer to canvases without basename collisions.

## Composition

`toCanvasId()` is the main normalizer. It strips the storage prefix, removes `.folder` segments, and namespaces prototype canvases with `proto:`:

```js
export function toCanvasId(relPath) {
  let p = relPath.replace(/\\/g, '/')
  if (p.startsWith('src/canvas/')) {
    p = p.slice('src/canvas/'.length)
  } else if (p.startsWith('src/prototypes/')) {
    p = p.slice('src/prototypes/'.length)
    prefix = 'proto:'
  }
```

The companion helpers parse and down-convert IDs for migration-friendly callers:

```js
export function parseCanvasId(id) {
  let namespace = 'canvas'
  let raw = id
  if (raw.startsWith('proto:')) {
    namespace = 'prototype'
    raw = raw.slice('proto:'.length)
  }
  const segments = raw.split('/').filter(Boolean)
  const name = segments[segments.length - 1] || raw
  return { namespace, segments, name }
}
```

```js
export function canvasIdBasename(id) {
  return parseCanvasId(id).name
}

export function isLegacyCanvasId(id) {
  return !id.includes('/') && !id.startsWith('proto:')
}
```

The file also keeps a migration inventory in `CANVAS_IDENTITY_CONSUMERS` so downstream path-based-ID adoption can be tracked centrally.

## Dependencies

This file has no imports.

## Dependents

Derived by import search:

- `packages/storyboard/src/core/canvas/selectedWidgets.js`
- `packages/storyboard/src/core/canvas/server.js`
- `packages/storyboard/src/core/rename-watcher/watcher.js`
- `packages/storyboard/src/internals/vite/data-plugin.js`
- `packages/storyboard/src/core/canvas/deriveCanvasId.test.js` and `packages/storyboard/src/core/canvas/identity.test.js`
- `packages/storyboard/package.json` exports it as `./canvas/identity`

## Notes

The file preserves support for legacy bare-name IDs, but only as a compatibility layer. New code should treat path-based IDs as canonical because prototype and `src/canvas/` namespaces can otherwise collide.
