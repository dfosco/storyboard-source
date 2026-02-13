# `src/storyboard/hooks/useScene.js`

<!--
source: src/storyboard/hooks/useScene.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Provides the `useScene()` hook for reading the current scene name and programmatically switching to a different scene. This is the interface for scene navigation — components use it to build scene switchers (e.g., in DevTools) or to react to which scene is active.

The hook reads from [`StoryboardContext`](../StoryboardContext.js.md) and navigates by updating the `?scene=` URL parameter, triggering a full page load to re-initialize the provider with the new scene.

## Composition

```js
export function useScene() {
  const context = useContext(StoryboardContext)
  if (context === null) {
    throw new Error('useScene must be used within a <StoryboardProvider>')
  }

  const switchScene = useCallback((name) => {
    const url = new URL(window.location.href)
    url.searchParams.set('scene', name)
    url.hash = ''  // Clear hash params (they belonged to the old scene)
    window.location.href = url.toString()
  }, [])

  return {
    sceneName: context.sceneName,
    switchScene,
  }
}
```

Returns an object with:
- **`sceneName`** — the currently active scene name (e.g., `"default"`, `"Repositories"`)
- **`switchScene(name)`** — navigates to a new scene by setting `?scene=` and clearing hash params

## Dependencies

- `react` — `useContext`, `useCallback`
- [`src/storyboard/StoryboardContext.js`](../StoryboardContext.js.md) — `StoryboardContext`

## Dependents

- [`src/storyboard/components/SceneDataDemo.jsx`](../components/SceneDataDemo.jsx.md) — uses `useScene()` for scene switching demo
- [`src/storyboard/index.js`](../index.js.md) — re-exports `useScene`

## Notes

- `switchScene()` clears the URL hash entirely because hash params (session overrides) belong to the old scene and should not carry over. This triggers a full page navigation via `window.location.href` assignment, not a React Router navigation.
