# `packages/core/src/hideMode.js`

<!--
source: packages/core/src/hideMode.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Implements hide mode and the undo/redo override history system. In normal mode, overrides live in the URL hash (`#key=value`). In hide mode, overrides are moved to localStorage so the URL stays clean — useful when sharing storyboards with stakeholders. The module also provides a full history stack with undo/redo support, allowing users to navigate through previous override states.

The localStorage mirror stores three keys under the `storyboard:` prefix: `historyState` (ordered array of `[position, route, paramString]` entries), `currentState` (index into the history for the active snapshot), and `nextState` (redo target index, cleared on new writes that fork the timeline). The hide flag itself is stored as `storyboard:__hide__`.

## Composition

**Hide mode toggle:**
```js
export function isHideMode()         // Check if hide mode is active
export function activateHideMode()   // Snapshot → set flag → clear URL
export function deactivateHideMode() // Restore params → remove flag
```

**History stack:**
```js
export function pushSnapshot(paramString?, route?)  // Append to history, fork timeline
export function undo()    // Move back, returns { route, params } or null
export function redo()    // Move forward, returns { route, params } or null
export function canUndo() // boolean
export function canRedo() // boolean
```

**Shadow read/write (used by useOverride in hide mode):**
```js
export function getShadow(key)     // Read from current snapshot
export function setShadow(key, value) // Push new snapshot with key
export function removeShadow(key)  // Push new snapshot without key
export function getAllShadows()    // All entries from current snapshot
```

**History sync:** `syncHashToHistory()` and `installHistorySync()` keep localStorage history in sync with browser navigation (back/forward).

History is capped at `MAX_HISTORY = 200` entries.

## Dependencies

- [`packages/core/src/localStorage.js`](./localStorage.js.md) — `getLocal`, `setLocal`, `removeLocal`, `notifyChange` for persisting history state
- [`packages/core/src/session.js`](./session.js.md) — `setParam` for restoring hash params on deactivate

## Dependents

- [`packages/core/src/index.js`](./index.js.md) — Re-exports all public functions
- [`packages/core/src/interceptHideParams.js`](./interceptHideParams.js.md) — Imports `activateHideMode`, `deactivateHideMode`
- [`packages/react/src/hooks/useOverride.js`](../../react/src/hooks/useOverride.js.md) — Imports hide mode and shadow functions
- [`packages/react/src/hooks/useSceneData.js`](../../react/src/hooks/useSceneData.js.md) — Imports `isHideMode`, `getShadow`, `getAllShadows`
- [`packages/react/src/hooks/useHideMode.js`](../../react/src/hooks/useHideMode.js.md) — Imports `isHideMode`, `activateHideMode`, `deactivateHideMode`
- [`packages/react/src/hooks/useUndoRedo.js`](../../react/src/hooks/useUndoRedo.js.md) — Imports `undo`, `redo`, `canUndo`, `canRedo`
- [`src/index.jsx`](../../../src/index.jsx.md) — Imports `installHistorySync`
