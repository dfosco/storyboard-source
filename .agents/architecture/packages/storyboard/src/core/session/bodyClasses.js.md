# `packages/storyboard/src/core/session/bodyClasses.js`

<!--
source: packages/storyboard/src/core/session/bodyClasses.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

DOM synchronization layer that projects storyboard state into CSS classes on `<body>`. It turns active overrides into `sb-{key}--{value}` classes and the current flow into `sb-scene--{name}`, giving CSS and surrounding chrome a simple styling surface.

## Composition

The file sanitizes keys/values into class-safe tokens, diffs current vs desired override classes, and exposes both one-shot and installed sync APIs.

```js
export function syncOverrideClasses() {
  const overrides = isHideMode() ? getAllShadows() : getAllParams()
  for (const [key, value] of Object.entries(overrides)) {
    desired.add(overrideClass(key, value))
  }
}
```

`setFlowClass()` owns the single `sb-scene--*` class, while `installBodyClassSync()` combines hash and storage subscriptions and also refreshes feature-flag body classes.

## Dependencies

- [`packages/storyboard/src/core/session/session.js`](./session.js.md) for normal-mode overrides.
- [`packages/storyboard/src/core/session/hideMode.js`](./hideMode.js.md) for hide-mode shadow reads.
- [`packages/storyboard/src/core/session/hashSubscribe.js`](./hashSubscribe.js.md) and [`packages/storyboard/src/core/session/localStorage.js`](./localStorage.js.md) for reactivity.
- ``packages/storyboard/src/core/stores/featureFlags.js`` for `syncFlagBodyClasses()`.

## Dependents

- ``packages/storyboard/src/core/mountStoryboardCore.js`` installs body-class syncing at startup.
- ``packages/storyboard/src/core/index.js`` re-exports the public API.
- [`packages/storyboard/src/core/session/bodyClasses.test.js`](./bodyClasses.test.js.md) validates class lifecycles.

## Notes

Override classes intentionally exclude other `sb-*` classes unless they match the double-dash override pattern, which prevents comment-mode and feature-flag classes from being stripped accidentally.
