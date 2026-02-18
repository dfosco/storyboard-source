# `packages/react/src/StoryboardContext.js`

<!--
source: packages/react/src/StoryboardContext.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Defines the React context object used by the storyboard system. Separated into its own file so that both the provider ([`packages/react/src/context.jsx`](./context.jsx.md)) and consumer hooks can import it without circular dependencies.

## Composition

```js
import { createContext } from 'react'
export const StoryboardContext = createContext(null)
```

Context value shape (set by `StoryboardProvider`):
```js
{ data: object|null, error: string|null, loading: boolean, sceneName: string }
```

## Dependencies

- `react` — `createContext`

## Dependents

- [`packages/react/src/context.jsx`](./context.jsx.md) — Sets context value via `StoryboardContext.Provider`
- [`packages/react/src/index.js`](./index.js.md) — Re-exports `StoryboardContext`
- [`packages/react/src/hooks/useSceneData.js`](./hooks/useSceneData.js.md) — Reads context
- [`packages/react/src/hooks/useOverride.js`](./hooks/useOverride.js.md) — Reads context
- [`packages/react/src/hooks/useScene.js`](./hooks/useScene.js.md) — Reads context
- [`packages/react/src/hooks/useLocalStorage.js`](./hooks/useLocalStorage.js.md) — Reads context
