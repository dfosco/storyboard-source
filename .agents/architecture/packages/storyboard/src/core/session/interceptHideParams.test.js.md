# `packages/storyboard/src/core/session/interceptHideParams.test.js`

<!--
source: packages/storyboard/src/core/session/interceptHideParams.test.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Unit coverage for query-param interception. It verifies that the URL adapter calls the right hide-mode transition and wires navigation listeners correctly.

## Composition

The suite mocks hide-mode exports, then drives `window.history.pushState()` through several query-string combinations:

```js
window.history.pushState(null, '', '?hide&show')
interceptHideParams()
expect(activateHideMode).toHaveBeenCalledTimes(1)
```

A separate block checks that listener installation performs an immediate pass before subscribing to `popstate`.

## Dependencies

- [`packages/storyboard/src/core/session/interceptHideParams.js`](./interceptHideParams.js.md).
- Mocked [`packages/storyboard/src/core/session/hideMode.js`](./hideMode.js.md) exports via Vitest.

## Dependents

- Consumed only by tests.

## Notes

Mocking keeps these tests focused on URL parsing and delegation, not on the much larger hide-mode state machine.
