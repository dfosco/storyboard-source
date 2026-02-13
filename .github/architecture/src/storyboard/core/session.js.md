# `src/storyboard/core/session.js`

<!--
source: src/storyboard/core/session.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../architecture.index.md)

## Goal

URL hash-based utilities for storyboard session state management. Session params are stored in the URL hash fragment (after `#`) to avoid triggering React Router re-renders. React Router (used by `generouted`) patches `history.replaceState/pushState`, so any search param change causes a full route tree re-render. The hash is invisible to the router and only fires `hashchange` events that React Router ignores.

This module provides the low-level primitives for reading and writing hash parameters. Most code should use the [`useOverride`](../hooks/useOverride.js.md) hook instead of calling these functions directly.

## Composition

**URL hash format:**

```
#key1=value1&key2=value2
```

Example with scene and session params:

```
/page?scene=default#user.name=Alice&settings.theme=dark
```

The module exports four functions:

**`getParam(key)`** — Read a single session param:

```js
export function getParam(key) {
  return parseHash().get(key)
}
```

**`setParam(key, value)`** — Write a single session param:

```js
export function setParam(key, value) {
  const params = parseHash()
  params.set(key, String(value))
  writeHash(params)
}
```

**`getAllParams()`** — Return all session params as a plain object:

```js
export function getAllParams() {
  const params = parseHash()
  const result = {}
  for (const [key, value] of params.entries()) {
    result[key] = value
  }
  return result
}
```

**`removeParam(key)`** — Remove a session param:

```js
export function removeParam(key) {
  const params = parseHash()
  params.delete(key)
  writeHash(params)
}
```

**Internal helpers:**

**`parseHash()`** — Parse current hash into a `URLSearchParams`:

```js
function parseHash() {
  const raw = window.location.hash.replace(/^#/, '')
  return new URLSearchParams(raw)
}
```

**`writeHash(params)`** — Write `URLSearchParams` back to the hash:

```js
function writeHash(params) {
  const str = params.toString()
  window.location.hash = str
}
```

Uses direct `window.location.hash` assignment instead of `history.replaceState()` because `generouted`/React Router patches `replaceState` and would trigger a full route re-render. Native hash assignment only fires `hashchange`, which React Router ignores.

## Dependencies

None — pure browser API (`window.location`, `URLSearchParams`)

## Dependents

- [`src/storyboard/hooks/useOverride.js`](../hooks/useOverride.js.md) — Uses `getParam`, `setParam`, `removeParam`
- [`src/storyboard/index.js`](../index.js.md) — Re-exports all four public functions

## Notes

- **Why hash instead of search params?** — React Router (via `generouted`) patches `history.replaceState/pushState` to intercept navigation. Any search param change (even via `replaceState`) causes a full route tree re-render. Hash changes are invisible to the router and avoid this overhead.
- **String coercion** — `setParam` converts all values to strings via `String(value)` before storing. This matches `URLSearchParams` behavior.
- **Concurrent updates** — Each read-modify-write cycle in `setParam`/`removeParam` parses the current hash fresh, so concurrent updates won't clobber each other as long as they're operating on different keys.
