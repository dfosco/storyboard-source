# `packages/react/src/hooks/useSession.js`

<!--
source: packages/react/src/hooks/useSession.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Deprecated backwards-compatibility alias for [`useOverride`](./useOverride.js.md). This file exists solely to avoid breaking existing code that imports `useSession` — new code should use `useOverride` directly.

## Composition

### Export: `useSession` (re-export)

```js
/**
 * @deprecated Use `useOverride` instead.
 */
export { useOverride as useSession } from './useOverride.js'
```

A named re-export that maps `useSession` → `useOverride`. No additional logic.

## Dependencies

| Import | Source |
|--------|--------|
| `useOverride` | [`./useOverride.js`](./useOverride.js.md) |

## Dependents

| File | Usage |
|------|-------|
| [`packages/react/src/index.js`](../index.js.md) | Re-exports `useSession` as public API (deprecated) |

## Notes

- Marked `@deprecated` in the JSDoc. Can be removed once all consumers have migrated to `useOverride`.
