# `src/storyboard/hooks/useOverride.js`

<!--
source: src/storyboard/hooks/useOverride.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../architecture.index.md)

## Goal

A React hook that provides read/write access to URL hash-based overrides on top of scene data. It uses `useSyncExternalStore` to subscribe to hash changes reactively, ensuring components re-render when overrides update.

The hook prioritizes URL hash params over scene defaults: if a hash param exists for the given path, it wins; otherwise, the scene JSON value is used. This enables URL-based state overrides that persist across page refreshes without mutating the underlying scene data.

**When to use `useOverride` vs `useSceneData`:**
- Use [`useSceneData(path)`](./useSceneData.js.md) when you just need to **read** data (overrides are applied transparently)
- Use `useOverride(path)` when you need to **write** — i.e., programmatically set or clear an override

## Composition

**Hook signature:**

```js
export function useOverride(path)
```

Returns a tuple:

```js
const [value, setValue, clearValue] = useOverride('settings.theme')
```

- `value` — Current value (override if present, otherwise scene default)
- `setValue(newValue)` — Write an override to the URL hash
- `clearValue()` — Remove the override, reverting to scene default

**Read priority:**

```
URL hash param  →  Scene JSON value  →  undefined
```

**Write target:**

```
URL hash only (scene JSON is read-only)
```

**Implementation:**

The hook uses `useSyncExternalStore` to subscribe to `hashchange` events:

```js
function subscribeToHash(callback) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

const getSnapshot = useCallback(() => getParam(path), [path])
const hashValue = useSyncExternalStore(subscribeToHash, getSnapshot)
```

**Value resolution:**

```js
const sceneDefault = data != null ? getByPath(data, path) : undefined
const value = hashValue !== null ? hashValue : sceneDefault
```

If the hash param exists (even if empty string), it takes precedence. Otherwise, the scene data is used as the fallback.

**Setters:**

```js
const setValue = useCallback((newValue) => {
  setParam(path, newValue)
}, [path])

const clearValue = useCallback(() => {
  removeParam(path)
}, [path])
```

Both setters are memoized with the `path` as the dependency.

## Dependencies

- `react` — `useCallback`, `useContext`, `useSyncExternalStore`
- [`src/storyboard/StoryboardContext.js`](../StoryboardContext.js.md) — `StoryboardContext` for scene data
- [`src/storyboard/core/dotPath.js`](../core/dotPath.js.md) — `getByPath` to read nested scene values
- [`src/storyboard/core/session.js`](../core/session.js.md) — `getParam`, `setParam`, `removeParam`

## Dependents

- [`src/storyboard/components/Checkbox.jsx`](../components/Checkbox.jsx.md) — Reads override value for form initialization
- [`src/storyboard/components/Select.jsx`](../components/Select.jsx.md) — Reads override value for form initialization
- [`src/storyboard/components/Textarea.jsx`](../components/Textarea.jsx.md) — Reads override value for form initialization
- [`src/storyboard/components/TextInput.jsx`](../components/TextInput.jsx.md) — Reads override value for form initialization
- [`src/storyboard/components/SceneDataDemo.jsx`](../components/SceneDataDemo.jsx.md) — Uses `useOverride` to demonstrate read/write overrides
- [`src/pages/Forms.jsx`](../../pages/Forms.jsx) — Uses `useOverride` to clear checkout overrides
- [`src/storyboard/index.js`](../index.js.md) — Re-exports the hook

## Notes

- **Must be inside `StoryboardProvider`** — The hook throws an error if used outside a provider because it needs access to scene data.
- **Dot-notation paths** — The `path` parameter supports nested keys like `'user.profile.name'` via [`getByPath`](../core/dotPath.js.md).
- **Why `useSyncExternalStore`?** — React 18's `useSyncExternalStore` is designed for subscribing to external state (like browser APIs). It handles concurrent rendering correctly and avoids tearing issues.
- **Backwards compatibility** — The old name `useSession` is still available as a deprecated re-export from [`src/storyboard/hooks/useSession.js`](./useSession.js.md) and the barrel file.
