# `packages/storyboard/src/core/session/interceptHideParams.js`

<!--
source: packages/storyboard/src/core/session/interceptHideParams.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Startup/navigation adapter for the `?hide` and `?show` query params. It lets links or browser navigation request a hide-mode transition without pushing that concern into router code.

## Composition

The implementation is intentionally small: inspect the current URL and delegate to hide-mode toggles. `installHideParamListener()` also runs the interception immediately and on future `popstate` events.

```js
export function interceptHideParams() {
  const url = new URL(window.location.href)
  if (url.searchParams.has('hide')) return activateHideMode()
  if (url.searchParams.has('show')) return deactivateHideMode()
}
```

## Dependencies

- [`packages/storyboard/src/core/session/hideMode.js`](./hideMode.js.md) for the actual mode transitions.
- Browser `URL` parsing and `popstate` events.

## Dependents

- ``packages/storyboard/src/core/mountStoryboardCore.js`` installs the listener during core startup.
- ``packages/storyboard/src/core/index.js`` re-exports both helpers.
- [`packages/storyboard/src/core/session/interceptHideParams.test.js`](./interceptHideParams.test.js.md) covers precedence and listener wiring.

## Notes

When both params are present, `?hide` wins because the function returns immediately after activating hide mode.
