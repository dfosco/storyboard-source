# `src/storyboard/hooks/useSceneData.js`

<!--
source: src/storyboard/hooks/useSceneData.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../architecture.index.md)

## Goal

The primary consumer-facing hooks for the storyboard system. `useSceneData(path?)` lets any component access scene data by dot-notation path, while `useSceneLoading()` exposes the loading state. These hooks are the recommended way for page and component code to read storyboard data.

Both hooks enforce that they are used within a `<StoryboardProvider>` by checking for a `null` context and throwing a descriptive error if missing.

<details>
<summary>Technical details</summary>

### Composition

- **`useSceneData(path?)`** (exported) — Reads `StoryboardContext`, returns `undefined` during loading/error, the full `data` object if no path is given, or the value at the dot-notation `path`. Logs a `console.warn` and returns `{}` if the path doesn't resolve to a value.
- **`useSceneLoading()`** (exported) — Returns `context.loading` boolean. Throws if used outside provider.

### Dependencies

- `react` — `useContext`
- `../StoryboardContext.js` — `StoryboardContext`
- `../core/dotPath.js` — `getByPath`

### Dependents

- `src/storyboard/components/SceneDataDemo.jsx` — uses `useSceneData()` to display user and navigation data
- `src/storyboard/index.js` — re-exports both hooks

### Notes

- When a path is provided but not found, the hook returns an empty object `{}` (not `undefined`) and logs a warning. This prevents downstream destructuring errors while still surfacing the issue during development.

</details>
