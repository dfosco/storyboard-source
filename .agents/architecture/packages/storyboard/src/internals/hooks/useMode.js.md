# `packages/storyboard/src/internals/hooks/useMode.js`

<!--
source: packages/storyboard/src/internals/hooks/useMode.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`useMode` exposes the design-mode registry to React components. It translates the core mode store into a hook that can drive toolbars, menus, and mode-specific UI.

The file stays deliberately small: registration and activation live in core state, while this hook only handles subscription, snapshot invalidation, and a stable switch callback.

## Composition

```js
export function useMode() {
  const snapshot = useSyncExternalStore(subscribeToMode, getModeSnapshot)
  void snapshot

  const mode = getCurrentMode()
  const modes = getRegisteredModes()
  const currentModeConfig = modes.find((m) => m.name === mode)
  const switchMode = useCallback((name, options) => activateMode(name, options), [])

  return { mode, modes, switchMode, currentModeConfig }
}
```

- Signature: `useMode(): { mode, modes, switchMode, currentModeConfig }`.
- Returns the active mode name, the registered modes array, a switch callback, and the config object for the current mode.
- Subscribes to the mode store with `useSyncExternalStore`.
- Re-renders whenever the mode snapshot changes, even though the snapshot string itself is only used as an invalidation signal.

## Dependencies

- Uses the core mode store exported from `../../core/index.js`.

## Dependents

- No direct in-repo dependents were found in this worktree; this is a public React integration hook.

## Notes

- The `void snapshot` pattern is intentional: React needs the snapshot to subscribe, but the hook reads the richer mode state through dedicated getters.
