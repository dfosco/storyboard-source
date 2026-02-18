# `packages/core/src/hideMode.js`

<!--
source: packages/core/src/hideMode.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../architecture.index.md)

## Goal

Implements "hide mode" — a clean-URL presentation mode where all override parameters are moved from the URL hash into localStorage. In normal mode, overrides live in `#key=value`; in hide mode, the URL stays pristine while overrides persist in localStorage shadow storage.

Also provides a full undo/redo history stack backed by localStorage, allowing users to navigate back and forth through override states. The history system works in both normal and hide mode.

## Composition

### Exports — Hide Mode

| Export | Type | Description |
|--------|------|-------------|
| `isHideMode()` | `() → boolean` | Check if hide mode is active |
| `activateHideMode()` | `() → void` | Snapshot current state, set hide flag, clear URL |
| `deactivateHideMode()` | `() → void` | Restore params to URL hash, remove hide flag |

### Exports — History Stack

| Export | Type | Description |
|--------|------|-------------|
| `pushSnapshot(paramString?, route?)` | `function` | Push a new state onto the history stack |
| `undo()` | `() → {route, params} \| null` | Move back one state |
| `redo()` | `() → {route, params} \| null` | Move forward one state |
| `canUndo()` | `() → boolean` | Check if undo is available |
| `canRedo()` | `() → boolean` | Check if redo is available |
| `getOverrideHistory()` | `() → Array<[number, string, string]>` | Full history stack |
| `getCurrentIndex()` | `() → number \| null` | Current position in history |
| `getNextIndex()` | `() → number \| null` | Redo target position |
| `getCurrentSnapshot()` | `() → string \| null` | Current snapshot's param string |
| `getCurrentRoute()` | `() → string \| null` | Current snapshot's route |
| `syncHashToHistory()` | `() → void` | Sync localStorage when URL changes externally |
| `installHistorySync()` | `() → void` | Install hashchange/popstate listeners (call once at startup) |

### Exports — Shadow Read/Write

| Export | Type | Description |
|--------|------|-------------|
| `getShadow(key)` | `(string) → string \| null` | Read a value from current shadow snapshot |
| `setShadow(key, value)` | `(string, string) → void` | Write a value (pushes new snapshot) |
| `removeShadow(key)` | `(string) → void` | Remove a value (pushes new snapshot) |
| `getAllShadows()` | `() → Record<string, string>` | All shadow entries as plain object |

### localStorage keys

All stored under `storyboard:` prefix via [`localStorage.js`](./localStorage.js.md):

| Key | Format | Description |
|-----|--------|-------------|
| `historyState` | `JSON array` | `[[position, route, paramString], ...]` ordered chronologically |
| `currentState` | `string (number)` | Index into `historyState` for active snapshot |
| `nextState` | `string (number)` | Index for redo target (`null` if none) |
| `__hide__` | `'1'` or absent | Hide mode flag |

### History model

```
historyState: [ [0, "/", "a=1"], [1, "/", "a=1&b=2"], [2, "/page", "c=3"] ]
                                    ↑ currentState=1     ↑ nextState=2

undo → currentState=0, nextState=1
redo → currentState=2, nextState=null (or 3 if exists)
new write → appends at currentState+1, clears nextState (forks timeline)
```

## Dependencies

| Module | Imports |
|--------|---------|
| [`packages/core/src/localStorage.js`](./localStorage.js.md) | `getLocal`, `setLocal`, `removeLocal`, `notifyChange` |
| [`packages/core/src/session.js`](./session.js.md) | `setParam` |

## Dependents

| File | How |
|------|-----|
| [`packages/core/src/index.js`](./index.js.md) | Re-exports all public functions |
| [`packages/core/src/interceptHideParams.js`](./interceptHideParams.js.md) | Imports `activateHideMode`, `deactivateHideMode` |
| [`src/index.jsx`](../../../src/index.jsx.md) | Calls `installHistorySync()` at startup via `@dfosco/storyboard-core` |
| [`packages/react/src/hooks/useHideMode.js`](../../react/src/hooks/useHideMode.js.md) | Imports `isHideMode`, `activateHideMode`, `deactivateHideMode` |
| [`packages/react/src/hooks/useOverride.js`](../../react/src/hooks/useOverride.js.md) | Imports `isHideMode`, `getShadow`, `setShadow`, `removeShadow` |
| [`packages/react/src/hooks/useSceneData.js`](../../react/src/hooks/useSceneData.js.md) | Imports `isHideMode`, `getShadow`, `getAllShadows` |
| [`packages/react/src/hooks/useUndoRedo.js`](../../react/src/hooks/useUndoRedo.js.md) | Imports `undo`, `redo`, `canUndo`, `canRedo` |

## Notes

- **MAX_HISTORY** is capped at 200 entries. When exceeded, the oldest entries are trimmed and positions are renumbered.
- `pushSnapshot()` deduplicates: if the current state already matches the same route + params, the push is silently skipped.
- `syncHashToHistory()` is a no-op in hide mode (URL is empty, nothing to sync).
- The history model uses a "fork" paradigm: any new write after an undo discards the future (redo) timeline.
- `deactivateHideMode()` restores overrides to the URL hash by calling `setParam()` for each key individually, then strips `?show` from the query string.
