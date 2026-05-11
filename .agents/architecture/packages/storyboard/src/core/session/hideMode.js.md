# `packages/storyboard/src/core/session/hideMode.js`

<!--
source: packages/storyboard/src/core/session/hideMode.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Hide mode moves override state out of the URL and into localStorage-backed history so storyboard can offer clean shareable URLs while still supporting mutable overrides, undo, and redo. It is the coordinator between hash state, snapshot persistence, and browser navigation events.

## Composition

The file manages three storage keys—history, current index, and next index—and exposes both mode toggles and history traversal helpers.

```js
export function activateHideMode() {
  pushSnapshot()
  setLocal(HIDE_FLAG, '1')
  url.searchParams.delete('hide')
  url.hash = ''
}

export function undo() {
  setLocal(NEXT_KEY, String(current))
  setLocal(CURRENT_KEY, String(prevIndex))
  applySnapshot(params)
}
```

Beyond toggling, it offers `getShadow()` / `setShadow()` for override reads and writes against the current snapshot, plus `syncHashToHistory()` and `installHistorySync()` to keep browser navigation aligned with stored history.

## Dependencies

- [`packages/storyboard/src/core/session/localStorage.js`](./localStorage.js.md) for persistence and notifications.
- [`packages/storyboard/src/core/session/session.js`](./session.js.md) to restore visible URL params when leaving hide mode.
- Browser `window.history`, `window.location`, `hashchange`, and `popstate` APIs.

## Dependents

- [`packages/storyboard/src/core/session/bodyClasses.js`](./bodyClasses.js.md) reads `isHideMode()` and shadow values.
- [`packages/storyboard/src/core/session/interceptHideParams.js`](./interceptHideParams.js.md) triggers activate/deactivate from query params.
- ``packages/storyboard/src/core/mountStoryboardCore.js`` installs history sync at startup.
- ``packages/storyboard/src/core/index.js`` re-exports the full API.
- [`packages/storyboard/src/core/session/hideMode.test.js`](./hideMode.test.js.md) covers history semantics.

## Notes

Non-adjacent browser jumps truncate future history, which makes the local timeline behave more like navigation state than a branching persistent log.
