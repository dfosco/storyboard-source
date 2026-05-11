# `packages/storyboard/src/internals/StoryboardContext.js`

<!--
source: packages/storyboard/src/internals/StoryboardContext.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

`StoryboardContext` is the minimal React context that carries flow data, loading state, current flow, and prototype scope through the internals layer. Nearly every data-oriented hook in this directory is built around reading this context first.

Keeping the context definition tiny isolates provider shape from hook logic. The heavy lifting happens in the provider implementation, while this file supplies the shared token that hooks can import without circular coupling.

## Composition

```js
import { createContext } from 'react'

export const StoryboardContext = createContext(null)
```

- Export: `StoryboardContext`.
- Returns no data by itself; consumers receive whatever the active provider supplies.
- There is no subscription logic in this file beyond React context propagation.
- Components re-render when the nearest provider publishes a new context value.

## Dependencies

- Depends only on React `createContext`.

## Dependents

- `packages/storyboard/src/internals/hooks/useFlows.js` reads flow and prototype scope from the context.
- `packages/storyboard/src/internals/hooks/useLocalStorage.js`, `useOverride.js`, and `useSceneData.js` read flow data and loading state from it.
- `packages/storyboard/src/internals/hooks/useObject.js` and `useRecord.js` read prototype scope from it.
- `packages/storyboard/src/internals/hooks/useScene.js` reads the active flow name from it.

## Notes

- The provider that fills this context works with the loader APIs documented in [`packages/storyboard/src/core/data/loader.js`](../core/data/loader.js.md).
