# `packages/react/src/index.js`

<!--
source: packages/react/src/index.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Barrel export for `@dfosco/storyboard-react` — the React framework binding for the storyboard system. Re-exports the provider, context, all hooks, the hash preserver, and the form context. This is the main entry point for React consumers of the storyboard data system. It is design-system-agnostic — no Primer, Reshaped, or other UI library dependencies.

## Composition

```js
// Context & Provider
export { default as StoryboardProvider } from './context.jsx'
export { StoryboardContext } from './StoryboardContext.js'

// Hooks
export { useSceneData, useSceneLoading } from './hooks/useSceneData.js'
export { useOverride } from './hooks/useOverride.js'
export { useOverride as useSession } from './hooks/useOverride.js' // deprecated alias
export { useScene } from './hooks/useScene.js'
export { useRecord, useRecords } from './hooks/useRecord.js'
export { useRecordOverride } from './hooks/useRecordOverride.js'
export { useLocalStorage } from './hooks/useLocalStorage.js'
export { useHideMode } from './hooks/useHideMode.js'
export { useUndoRedo } from './hooks/useUndoRedo.js'

// React Router integration
export { installHashPreserver } from './hashPreserver.js'

// Form context
export { FormContext } from './context/FormContext.js'
```

## Dependencies

- [`packages/react/src/context.jsx`](./context.jsx.md) — StoryboardProvider component
- [`packages/react/src/StoryboardContext.js`](./StoryboardContext.js.md) — React context object
- [`packages/react/src/hashPreserver.js`](./hashPreserver.js.md) — Hash preservation across navigations
- [`packages/react/src/context/FormContext.js`](./context/FormContext.js.md) — Form context for design system packages
- All hooks in [`packages/react/src/hooks/`](./hooks/)

## Dependents

- [`src/pages/_app.jsx`](../../../src/pages/_app.jsx.md) — Imports `StoryboardProvider`
- [`src/index.jsx`](../../../src/index.jsx.md) — Imports `installHashPreserver`
- Any page or component that uses storyboard hooks
