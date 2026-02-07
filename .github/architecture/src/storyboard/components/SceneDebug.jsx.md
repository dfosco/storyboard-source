# `src/storyboard/components/SceneDebug.jsx`

<!--
source: src/storyboard/components/SceneDebug.jsx
category: storyboard
importance: high
-->

> [← Architecture Index](../../../architecture.index.md)

## Goal

A debug/development component that loads a scene and renders its fully resolved data as formatted JSON. It's used to verify the loader pipeline is working correctly — confirming that `$ref` and `$global` directives resolve as expected. It loads scene data independently via [`loadScene()`](../core/loader.js.md) rather than through the [`StoryboardProvider`](../context.jsx.md) context.

Scene selection follows: `sceneName` prop first, then `?scene=` URL param, then `"default"`.

## Composition

```jsx
export default function SceneDebug({ sceneName } = {}) {
  const [searchParams] = useSearchParams()
  const sceneFromUrl = searchParams.get('scene')
  const activeSceneName = sceneName || sceneFromUrl || 'default'

  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadScene(activeSceneName)
      .then((sceneData) => { setData(sceneData); setLoading(false) })
      .catch((err) => { setError(err.message); setLoading(false) })
  }, [activeSceneName])

  // Renders loading state, error state, or JSON.stringify(data, null, 2)
}
```

The component manages its own loading lifecycle independently of the [`StoryboardProvider`](../context.jsx.md). It renders one of three states:
- **Loading**: `<Text>Loading scene: {activeSceneName}...</Text>`
- **Error**: Error title + message
- **Success**: `<pre>{JSON.stringify(data, null, 2)}</pre>`

Uses `PropTypes` for prop validation and CSS Modules from `SceneDebug.module.css`.

## Dependencies

- `react` — `useState`, `useEffect`
- `react-router-dom` — `useSearchParams`
- `@primer/react` — `Text`
- `prop-types` — PropTypes validation
- [`src/storyboard/core/loader.js`](../core/loader.js.md) — `loadScene`
- `src/storyboard/components/SceneDebug.module.css` — CSS Modules

## Dependents

Currently not imported by any page. Available as a standalone debug tool.

## Notes

Unlike the [`StoryboardProvider`](../context.jsx.md), this component checks `sceneName` prop before the URL param (provider checks URL first). This is a minor inconsistency but allows explicit prop control to take priority in debug scenarios.
