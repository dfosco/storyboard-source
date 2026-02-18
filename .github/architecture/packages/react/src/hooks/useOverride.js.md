# `packages/react/src/hooks/useOverride.js`

<!--
source: packages/react/src/hooks/useOverride.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Core hook for reading and writing overrides on top of scene data. Overrides are the primary mechanism for making storyboard prototypes interactive — they let users tweak any scene value via the URL hash without modifying the underlying JSON.

The hook has two modes: **normal mode** writes to the URL hash (with a shadow copy to localStorage), while **hide mode** (activated by `?hide`) writes exclusively to shadow localStorage so the URL stays clean for presentations. This dual-write strategy allows hot-swapping between modes without data loss.

## Composition

### Export: `useOverride(path)`

Returns a tuple `[value, setValue, clearValue]`.

```js
export function useOverride(path) {
  const { data } = useContext(StoryboardContext)
  const hidden = isHideMode()
  const sceneDefault = data != null ? getByPath(data, path) : undefined

  // Subscribe to both hash and localStorage for reactivity
  const getHashSnap = useCallback(() => getParam(path), [path])
  const hashValue = useSyncExternalStore(subscribeToHash, getHashSnap)
  useSyncExternalStore(subscribeToStorage, getStorageSnapshot)

  // Resolved value depends on mode
  let value
  if (hidden) {
    const shadowValue = getShadow(path)
    value = shadowValue !== null ? shadowValue : sceneDefault
  } else {
    value = hashValue !== null ? hashValue : sceneDefault
  }

  // setValue/clearValue target hash or shadow depending on mode
  return [value, setValue, clearValue]
}
```

**Normal mode read priority:** URL hash param → scene JSON default → `undefined`
**Hide mode read priority:** shadow localStorage → scene JSON default → `undefined`

- **`setValue(newValue)`** — writes to URL hash + shadow (normal) or shadow only (hide).
- **`clearValue()`** — removes from URL hash + shadow (normal) or shadow only (hide).

## Dependencies

| Import | Source |
|--------|--------|
| `useCallback`, `useContext`, `useSyncExternalStore` | `react` |
| `StoryboardContext` | [`../StoryboardContext.js`](../StoryboardContext.js.md) |
| `getByPath` | `@dfosco/storyboard-core` |
| `getParam`, `setParam`, `removeParam` | `@dfosco/storyboard-core` |
| `subscribeToHash` | `@dfosco/storyboard-core` |
| `isHideMode`, `getShadow`, `setShadow`, `removeShadow` | `@dfosco/storyboard-core` |
| `subscribeToStorage`, `getStorageSnapshot` | `@dfosco/storyboard-core` |

## Dependents

| File | Usage |
|------|-------|
| [`packages/react/src/index.js`](../index.js.md) | Re-exports `useOverride` as public API |
| [`packages/react/src/hooks/useRecordOverride.js`](./useRecordOverride.js.md) | Delegates to `useOverride` with a prefixed path |
| [`packages/react/src/hooks/useSession.js`](./useSession.js.md) | Deprecated re-export alias |
| `src/pages/issues/index.jsx` | Override issue list fields |
| `src/pages/issues/[id].jsx` | Override individual issue fields |
| `src/pages/Forms.jsx` | Override form field values |
| `src/pages/Signup.jsx` | Override signup form values |
| `src/components/IssueFormFields/IssueFormFields.jsx` | Override issue form inputs |
| `packages/react-primer/src/TextInput.jsx` | Primer TextInput storyboard binding |
| `packages/react-primer/src/Checkbox.jsx` | Primer Checkbox storyboard binding |
| `packages/react-primer/src/Select.jsx` | Primer Select storyboard binding |
| `packages/react-primer/src/Textarea.jsx` | Primer Textarea storyboard binding |
| `packages/react-primer/src/SceneDataDemo.jsx` | Demo component |
| `packages/react-reshaped/src/TextInput.jsx` | Reshaped TextInput storyboard binding |
| `packages/react-reshaped/src/Checkbox.jsx` | Reshaped Checkbox storyboard binding |
| `packages/react-reshaped/src/Select.jsx` | Reshaped Select storyboard binding |
| `packages/react-reshaped/src/Textarea.jsx` | Reshaped Textarea storyboard binding |

## Notes

- Every `setValue` call in normal mode mirrors the value to shadow localStorage. This ensures that toggling into hide mode preserves all existing overrides.
- The `isHideMode()` check inside `setValue`/`clearValue` is called at invocation time (not at hook render time), so mode can change between renders and writes still go to the correct target.
