# `src/storyboard/hooks/useSession.js`

<!--
source: src/storyboard/hooks/useSession.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../architecture.index.md)

## Goal

**Deprecated.** This file is a backwards-compatibility re-export of [`useOverride`](./useOverride.js.md). New code should import `useOverride` directly.

## Composition

```js
/**
 * @deprecated Use `useOverride` instead.
 */
export { useOverride as useSession } from './useOverride.js'
```

## Dependencies

- [`src/storyboard/hooks/useOverride.js`](./useOverride.js.md) — The actual implementation

## Dependents

- [`src/storyboard/index.js`](../index.js.md) — Re-exports `useSession` as a deprecated alias
