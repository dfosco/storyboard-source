# `packages/react/src/StoryboardContext.js`

<!--
source: packages/react/src/StoryboardContext.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Defines the single React context object used by all Storyboard hooks. Separated into its own file so that both the provider ([`context.jsx`](./context.jsx.md)) and every hook can import it without circular dependencies — the context module has no imports besides `react` itself.

## Composition

The entire file is three lines:

```js
import { createContext } from 'react'

export const StoryboardContext = createContext(null)
```

The default value is `null`, meaning any hook that calls `useContext(StoryboardContext)` outside a `<StoryboardProvider>` will receive `null`.

## Dependencies

| Module | Purpose |
|--------|---------|
| `react` | `createContext` |

## Dependents

- [`packages/react/src/context.jsx`](./context.jsx.md) — imports `StoryboardContext` to provide data via `<StoryboardContext.Provider>`
- [`packages/react/src/index.js`](./index.js.md) — re-exports `StoryboardContext` as part of the public API
- `packages/react/src/hooks/useSceneData.js` — reads scene data from context
- `packages/react/src/hooks/useScene.js` — reads scene metadata from context
- `packages/react/src/hooks/useOverride.js` — reads scene data for override operations
- `packages/react/src/hooks/useLocalStorage.js` — reads scene data for localStorage operations

## Notes

- The `null` default is intentional — hooks should fail gracefully or throw a helpful message when no provider is present rather than silently returning stale data.
