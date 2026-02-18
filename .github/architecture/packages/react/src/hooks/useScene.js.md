# `packages/react/src/hooks/useScene.js`

<!--
source: packages/react/src/hooks/useScene.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Provides the current scene name and a function to programmatically switch scenes by updating the `?scene=` query parameter. Used for scene switching UI and navigation.

## Composition

```js
export function useScene() {
  const context = useContext(StoryboardContext)
  // throws if outside StoryboardProvider

  const switchScene = useCallback((name) => {
    const url = new URL(window.location.href)
    url.searchParams.set('scene', name)
    window.location.href = url.toString() // preserves hash
  }, [])

  return { sceneName: context.sceneName, switchScene }
}
```

## Dependencies

- [`packages/react/src/StoryboardContext.js`](../StoryboardContext.js.md) — Reads `sceneName` from context

## Dependents

- [`packages/react/src/index.js`](../index.js.md) — Re-exports `useScene`
