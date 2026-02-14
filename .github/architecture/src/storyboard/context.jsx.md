# `src/storyboard/context.jsx`

<!--
source: src/storyboard/context.jsx
category: storyboard
importance: high
-->

> [← Architecture Index](../../architecture.index.md)

## Goal

The `StoryboardProvider` component that loads scene data and provides it to the component tree via React context. It determines which scene to load from four sources (in priority order): the `?scene=` URL parameter, the `sceneName` prop, a matching scene file for the current page (e.g., `Overview.scene.json` for `/Overview`), or the default `"default"`. It blocks rendering children until the scene is fully loaded, showing a loading fallback or error message as needed.

This is the runtime core of the storyboard system — it calls [`loadScene()`](./core/loader.js.md) on mount, stores the result in state, and exposes it through [`StoryboardContext`](./StoryboardContext.js.md) so any descendant can call [`useSceneData()`](./hooks/useSceneData.js.md) or [`useOverride()`](./hooks/useOverride.js.md). It also supports optional record merging: when `recordName` and `recordParam` props are provided, it uses [`findRecord()`](./core/loader.js.md) to look up a record entry by a URL route param and injects the matched entry under the `"record"` key in scene data.

## Composition

The component accepts five props:

```jsx
export default function StoryboardProvider({ sceneName, recordName, recordParam, fallback, children })
```

- `sceneName` — override the scene to load
- `recordName` — name of a `*.record.json` collection (e.g., `"posts"`)
- `recordParam` — URL route parameter whose value is matched against record entry `id`
- `fallback` — custom loading UI
- `children` — rendered once data is loaded

**Scene name resolution** — Reads directly from `window.location.search` to avoid React Router re-renders, and uses page-scene matching as a fallback:

```js
function getSceneParam() {
  return new URLSearchParams(window.location.search).get('scene')
}

function getPageSceneName() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  if (path === '/') return 'index'
  const last = path.split('/').pop()
  return last || 'index'
}

const pageScene = getPageSceneName()
const activeSceneName = getSceneParam() || sceneName || (sceneExists(pageScene) ? pageScene : 'default')
```

This bypasses React Router's `useSearchParams()` hook, which would cause a full re-render on every navigation event including hash changes. The `getPageSceneName()` helper derives a scene name from the current pathname (e.g., `/Overview` → `"Overview"`, `/` → `"index"`), and if a matching scene file exists (checked via [`sceneExists()`](./core/loader.js.md)), it is loaded automatically.

The context value shape provided to descendants:

```js
const value = {
  data,        // resolved scene object (or null)
  error,       // error message string (or null)
  loading,     // boolean
  sceneName: activeSceneName,
}
```

**Record merging** — When `recordName` and `recordParam` are both provided, the provider reads the matching URL param via `useParams()` from `react-router-dom`, looks up the record entry via [`findRecord()`](./core/loader.js.md), and deep-merges it under the `"record"` key:

```js
if (recordName && recordParam && params[recordParam]) {
  const entry = findRecord(recordName, params[recordParam])
  if (entry) {
    sceneData = deepMerge(sceneData, { record: entry })
  }
}
```

The component blocks rendering until loading completes:

```jsx
if (loading) {
  return fallback ?? <Text>Loading scene…</Text>
}
if (error) {
  return <Text color="danger.fg">Error loading scene: {error}</Text>
}
return (
  <StoryboardContext.Provider value={value}>
    {children}
  </StoryboardContext.Provider>
)
```

Also re-exports [`StoryboardContext`](./StoryboardContext.js.md) as a named export.

## Dependencies

- `react` — `useState`, `useEffect`
- `react-router-dom` — `useParams` for reading URL route parameters (used in record merging)
- `@primer/react` — `Text`
- [`src/storyboard/core/loader.js`](./core/loader.js.md) — `loadScene`, `sceneExists`, `findRecord`, `deepMerge`
- [`src/storyboard/StoryboardContext.js`](./StoryboardContext.js.md) — `StoryboardContext`

## Dependents

- [`src/pages/_app.jsx`](../pages/_app.jsx.md) — wraps the entire route tree
- [`src/storyboard/index.js`](./index.js.md) — re-exported as the public `StoryboardProvider`

## Notes

- **React Router interaction** — The provider no longer uses `react-router-dom`'s `useSearchParams()` because React Router (via `generouted`) patches `history.replaceState/pushState`. This means any query param change triggers a full route tree re-render, even if only the hash changed. By reading the search param directly from `window.location.search`, the provider only responds to actual scene changes.
- **No loading flash on navigation** — The provider only shows the loading fallback on initial mount (when `data` is `null`). On subsequent navigations within the same scene, children continue rendering with the existing data while the effect re-runs. Since `loadScene` resolves near-instantly (all data is eagerly bundled via the [`storyboardData()`](./vite/data-plugin.js.md) Vite plugin), there is no visible gap.
- **Record merging is optional** — If `recordName`/`recordParam` are not provided, the provider behaves exactly as before. When they are provided, the matched record entry is injected as `data.record`, accessible via `useSceneData('record')` or `useSceneData('record.fieldName')`.
