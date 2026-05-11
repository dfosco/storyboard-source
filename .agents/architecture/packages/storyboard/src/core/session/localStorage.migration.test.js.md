# `packages/storyboard/src/core/session/localStorage.migration.test.js`

<!--
source: packages/storyboard/src/core/session/localStorage.migration.test.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Focused test for the legacy-key migration path in the storage adapter. It exists to prevent regressions in the one-time cleanup that accompanies the new app-specific namespace format.

## Composition

The test seeds bare `storyboard:*` keys, dynamically re-imports the module to force fresh initialization, then verifies only the legacy keys disappear:

```js
localStorage.setItem('storyboard:legacy-key', 'should-vanish')
await import('./localStorage.js?reimport-1')
expect(localStorage.getItem('storyboard:legacy-key')).toBeNull()
```

Using a cache-busted import is the important detail: migration runs at module evaluation time.

## Dependencies

- [`packages/storyboard/src/core/session/localStorage.js`](./localStorage.js.md).
- Vitest async import support.

## Dependents

- Consumed only by tests.

## Notes

This suite isolates migration from the broader storage contract so namespace upgrades can be changed confidently without obscuring failures behind unrelated assertions.
