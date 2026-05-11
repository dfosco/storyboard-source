# `packages/storyboard/src/core/session/session.js`

<!--
source: packages/storyboard/src/core/session/session.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Small hash-state adapter for storyboard overrides. It keeps transient session values in `window.location.hash` so override changes do not flow through React Router search-param handling and re-render the route tree.

This file is the low-level read/write API that higher-level session systems build on, especially [`packages/storyboard/src/core/session/hideMode.js`](./hideMode.js.md) and [`packages/storyboard/src/core/session/bodyClasses.js`](./bodyClasses.js.md).

## Composition

It has two private helpers: `parseHash()` normalizes the current hash into `URLSearchParams`, and `writeHash()` writes serialized params back with native `window.location.hash` assignment. The public surface is a four-function CRUD layer:

```js
export function getParam(key) {
  return parseHash().get(key)
}

export function setParam(key, value) {
  const params = parseHash()
  params.set(key, String(value))
  writeHash(params)
}
```

`getAllParams()` returns a plain object snapshot, while `removeParam()` deletes one key and reserializes the remaining hash entries.

## Dependencies

- Browser `window.location.hash` and `URLSearchParams` APIs for storage/serialization.
- No internal imports; this is the leaf primitive for URL-backed session state.

## Dependents

- [`packages/storyboard/src/core/session/bodyClasses.js`](./bodyClasses.js.md) reads all active hash overrides.
- [`packages/storyboard/src/core/session/hideMode.js`](./hideMode.js.md) restores snapshots back into the hash via `setParam()`.
- ``packages/storyboard/src/core/index.js`` re-exports the API.

## Notes

Dot-notation keys are not interpreted here; they are stored as literal hash keys so callers can encode nested override paths without extra schema logic.
