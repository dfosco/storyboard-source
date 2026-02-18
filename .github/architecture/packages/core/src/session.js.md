# `packages/core/src/session.js`

<!--
source: packages/core/src/session.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Provides URL hash-based session state management for the storyboard system. Session params are stored in the hash fragment (`#key1=value1&key2=value2`) rather than in query-string search params. This design is critical because React Router (via `@generouted/react-router`) patches `history.replaceState` / `history.pushState` — any search-param change would trigger a full route tree re-render. The hash is invisible to the router, so state changes only fire `hashchange` events that React Router ignores.

## Composition

### Internal helpers

| Function | Purpose |
|----------|---------|
| `parseHash()` | Strips the leading `#` from `window.location.hash` and returns a `URLSearchParams` instance. |
| `writeHash(params)` | Serializes a `URLSearchParams` to a string and assigns it to `window.location.hash`. Uses direct hash assignment (not `history.replaceState`) to avoid triggering React Router. |

### Exports

| Function | Signature | Purpose |
|----------|-----------|---------|
| `getParam` | `(key: string) → string\|null` | Reads a single param from the hash. |
| `setParam` | `(key: string, value: string) → void` | Writes a single param to the hash. Coerces value to `String`. |
| `getAllParams` | `() → Record<string, string>` | Returns all hash params as a plain object. |
| `removeParam` | `(key: string) → void` | Deletes a single param from the hash. |

### Hash format

```
/page?scene=default#user.name=Alice&settings.theme=dark
       ↑ query param            ↑ hash session params
```

Query params (like `?scene=`) are managed by React Router / the browser. Hash params are managed by this module and are used for storyboard overrides and state.

## Dependencies

None — uses only browser globals (`window.location.hash`, `URLSearchParams`).

## Dependents

**Direct (internal) import:**

- [`packages/core/src/index.js`](./index.js.md) — re-exports `getParam`, `setParam`, `getAllParams`, `removeParam`
- `packages/core/src/hideMode.js` — `import { setParam } from './session.js'`

**Indirect consumers** (via `@dfosco/storyboard-core` barrel):

- [`packages/react/src/hooks/useOverride.js`](../../react/src/hooks/useOverride.js.md) — `getParam`, `setParam`, `removeParam`
- [`packages/react/src/hooks/useSceneData.js`](../../react/src/hooks/useSceneData.js.md) — `getParam`, `getAllParams`
- [`packages/react/src/hooks/useRecord.js`](../../react/src/hooks/useRecord.js.md) — `getAllParams`
- [`packages/react/src/hooks/useLocalStorage.js`](../../react/src/hooks/useLocalStorage.js.md) — `getParam`
- [`packages/react-primer/src/StoryboardForm.jsx`](../../react-primer/src/StoryboardForm.jsx.md) — `setParam`
- [`packages/react-reshaped/src/StoryboardForm.jsx`](../../react-reshaped/src/StoryboardForm.jsx.md) — `setParam`
- [`src/pages/issues/index.jsx`](../../../src/pages/issues/index.jsx.md) — `setParam`, `removeParam`
- [`src/pages/issues/[id].jsx`](../../../src/pages/issues/[id].jsx.md) — `setParam`, `removeParam`

## Notes

- **Why hash instead of search params:** React Router's generouted integration patches `history.replaceState` and `history.pushState`. Modifying `window.location.search` through these APIs causes a full route tree re-render. Using `window.location.hash` avoids this entirely — `hashchange` events are ignored by React Router.
- **Direct assignment, not replaceState:** `writeHash` deliberately uses `window.location.hash = str` rather than `history.replaceState()` because the latter is patched by React Router and would still trigger re-renders.
