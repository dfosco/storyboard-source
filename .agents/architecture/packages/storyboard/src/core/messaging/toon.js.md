# `packages/storyboard/src/core/messaging/toon.js`

<!--
source: packages/storyboard/src/core/messaging/toon.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/core/messaging/toon.js`](./toon.js.md) isolates optional TOON serialization at the HTTP edge. The core bus and JSONL adapter stay JSON-native; this file simply lets [`packages/storyboard/src/core/messaging/routes.js`](./routes.js.md) negotiate `text/toon` for clients that support it.

## Composition

The dependency is lazy and resilient by design:

```js
async function loadToon() {
  try {
    const toon = await import(/* @vite-ignore */ '@toon-format/toon')
    _encode = toon.encode || toon.default?.encode
    _decode = toon.decode || toon.default?.decode
  } catch {
    console.warn('[messaging-bus] @toon-format/toon not available, TOON format disabled')
  }
}
```

The public API is a three-function boundary:

```js
export function negotiateFormat(req) {
  return req.headers?.accept?.includes('text/toon') ? 'toon' : 'json'
}

export async function serializeResponse(data, format) { /* encode or JSON.stringify */ }
export async function parseRequestBody(body, contentType) { /* decode toon or JSON.parse */ }
```

## Dependencies

- Optional peer dependency `@toon-format/toon`, loaded with a guarded dynamic import.

## Dependents

- [`packages/storyboard/src/core/messaging/routes.js`](./routes.js.md)
- [`packages/storyboard/src/core/messaging/index.js`](./index.js.md)

## Notes

- The module never retries a failed dynamic import in-process, so a missing TOON package degrades once and then stays on the JSON path.

