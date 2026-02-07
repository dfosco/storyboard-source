# `src/storyboard/StoryboardContext.js`

<!--
source: src/storyboard/StoryboardContext.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../architecture.index.md)

## Goal

Defines the React context object used by the storyboard system. Extracted into its own file to avoid circular dependency issues — the context is created here and consumed by both the provider (`context.jsx`) and the hooks (`useSceneData.js`).

The context is initialized with `null`, which allows hooks to detect when they are used outside a `StoryboardProvider` and throw a helpful error.

## Composition

```js
import { createContext } from 'react'

export const StoryboardContext = createContext(null)
```

The default value is `null` (not an empty object) — this is intentional so that `useSceneData` and `useSceneLoading` can detect a missing provider via `context === null`.

## Dependencies

- `react` — `createContext`

## Dependents

- `src/storyboard/context.jsx` — provides the context value via `StoryboardContext.Provider`
- `src/storyboard/hooks/useSceneData.js` — consumes the context via `useContext(StoryboardContext)`
