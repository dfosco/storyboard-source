# `packages/react/src/hooks/useSession.js`

<!--
source: packages/react/src/hooks/useSession.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Deprecated backwards-compatibility alias. Re-exports `useOverride` as `useSession` for code that still uses the old name.

## Composition

```js
export { useOverride as useSession } from './useOverride.js'
```

## Dependencies

- [`packages/react/src/hooks/useOverride.js`](./useOverride.js.md) — Source of the re-export

## Dependents

- [`packages/react/src/index.js`](../index.js.md) — Also re-exports the deprecated alias
