# `packages/react/src/hooks/useScene.js`

<!--
source: packages/react/src/hooks/useScene.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Provides a hook for reading the current scene name and programmatically switching between scenes. Scenes are the top-level data contexts in storyboard — switching scenes reloads all data while preserving hash params.

## Composition

### Export: `useScene()`

Returns `{ sceneName, switchScene }`.

```js
export function useScene() {
  const context = useContext(StoryboardContext)
  if (context === null) {
    throw new Error('useScene must be used within a <StoryboardProvider>')
  }

  const switchScene = useCallback((name) => {
    const url = new URL(window.location.href)
    url.searchParams.set('scene', name)
    window.location.href = url.toString()
  }, [])

  return {
    sceneName: context.sceneName,
    switchScene,
  }
}
```

- **`sceneName`** — the currently active scene (e.g. `"default"`), sourced from `StoryboardContext`.
- **`switchScene(name)`** — navigates to a different scene by setting the `?scene=` query parameter. This triggers a full page navigation (not a React state update), which causes `StoryboardProvider` to reload data for the new scene.

## Dependencies

| Import | Source |
|--------|--------|
| `useContext`, `useCallback` | `react` |
| `StoryboardContext` | [`../StoryboardContext.js`](../StoryboardContext.js.md) |

## Dependents

| File | Usage |
|------|-------|
| [`packages/react/src/index.js`](../index.js.md) | Re-exports `useScene` as public API |
| `packages/react-primer/src/SceneDataDemo.jsx` | Scene switcher in demo component |

## Notes

- `switchScene` sets `window.location.href`, which causes a full page reload. Hash params in the URL are preserved across the navigation since they are part of the URL string.
- The hook throws if used outside a `<StoryboardProvider>`.
