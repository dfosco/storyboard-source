# `packages/storyboard/src/core/data/loader.js`

<!--
source: packages/storyboard/src/core/data/loader.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`loader.js` is the central runtime for the storyboard data system. It owns the in-memory index seeded by the Vite plugin and provides the lookup, scope resolution, and reference-merging APIs that React hooks consume.

Every high-level data hook in the internals layer ultimately depends on this file, either directly through calls such as `loadObject` or indirectly through shared helpers like `getByPath` that are re-exported from core. It is the single source of truth for flow, object, record, prototype, folder, canvas, and story discovery.

## Composition

```js
export function init(index) { /* seed flows, objects, records, metadata */ }
export function loadFlow(flowName = 'default') { /* resolve $global + $ref */ }
export function loadRecord(recordName) { /* return record array */ }
export function loadObject(objectName, scope) { /* resolve object scope */ }
export function resolveFlowName(scope, name) { /* scoped fallback */ }
export function resolveRecordName(scope, name) { /* scoped fallback */ }
export function resolveObjectName(scope, name) { /* scoped fallback */ }
```

- Exports the core data access surface: initialization, list helpers, metadata readers, flow/object/record loaders, and scope resolvers.
- Returns concrete data structures synchronously once the index has been seeded.
- There is no React subscription here; hooks re-render when their own subscription layers decide to re-read loader-backed data.
- The loader drives re-computation indirectly by being called from hooks such as `useFlowData`, `useObject`, `useRecord`, and `useFlows`.

## Dependencies

- This file is framework-agnostic and mostly self-contained; it depends on the in-memory indices seeded by `init()`.

## Dependents

- `packages/storyboard/src/internals/hooks/useSceneData.js` uses shared data path helpers and flow semantics built on this loader.
- `packages/storyboard/src/internals/hooks/useObject.js` uses `loadObject` and `resolveObjectName`.
- `packages/storyboard/src/internals/hooks/useRecord.js` uses `loadRecord` and `resolveRecordName`.
- `packages/storyboard/src/internals/hooks/useFlows.js` uses `getFlowsForPrototype` and flow metadata from this loader.
- The provider behind `packages/storyboard/src/internals/StoryboardContext.js` is seeded from this loader-driven data index.

## Notes

- Flow loading resolves `$global` merges before resolving nested `$ref` references, which keeps the resulting flow object flat for React consumers.
