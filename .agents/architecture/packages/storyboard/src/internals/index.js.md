# `packages/storyboard/src/internals/index.js`
<!--
source: packages/storyboard/src/internals/index.js
category: storyboard
importance: high
-->
> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

This is the public barrel export for `@dfosco/storyboard-react` — the React-layer of the storyboard system. It aggregates every React-specific binding (hooks, provider, UI components) into a single entry point, keeping the internals directory from leaking paths into consumer code. Everything exported here is intentionally design-system–agnostic: no Primer, no Reshaped — just React and React Router dependencies.

The file also documents the full public surface at a glance. Deprecated aliases (`useSceneData`, `useSession`, `Viewfinder`) are re-exported here until removal to maintain backwards compatibility without cluttering individual implementation files. The split between this file and `core/index.js` mirrors the core/react architectural boundary: any export here has a React dependency; anything framework-agnostic lives in core.

## Composition

```js
// Context & Provider
export { default as StoryboardProvider } from './context.jsx'
export { StoryboardContext } from './StoryboardContext.js'

// Hooks
export { useFlowData, useFlowLoading } from './hooks/useSceneData.js'
export { useOverride } from './hooks/useOverride.js'
export { useRecord, useRecords } from './hooks/useRecord.js'
export { useObject } from './hooks/useObject.js'
// ... (useFlow, useFlows, useLocalStorage, useHideMode, useUndoRedo, useFeatureFlag, useMode, useThemeState, useConfig)

// React Router integration
export { installHashPreserver } from './hashPreserver.js'

// Workspace dashboard + deprecated Viewfinder alias
export { default as Workspace } from './Workspace.jsx'
export { default as Viewfinder } from './Workspace.jsx'

// UI components (lazy-loaded by context.jsx, exported here for standalone use)
export { default as StoryboardCommandPalette } from './CommandPalette/CommandPalette.jsx'
export { default as BranchBar } from './BranchBar/BranchBar.jsx'
export { default as AuthModal } from './AuthModal/AuthModal.jsx'

// Canvas
export { default as CanvasPage } from './canvas/CanvasPage.jsx'
export { useCanvas } from './canvas/useCanvas.js'

// Error boundaries
export { default as PrototypeErrorBoundary, ImportErrorFallback, AppErrorBoundary } from './PrototypeErrorBoundary.jsx'

// Icon
export { default as Icon } from './Icon.jsx'
```

Key naming:
- `StoryboardProvider` — the root React context provider (see [`context.jsx`](./context.jsx.md))
- `StoryboardContext` — the raw React context object (see [`StoryboardContext.js`](./StoryboardContext.js.md))
- `Workspace` / `Viewfinder` — alias pair; both point to `Workspace.jsx` → `Viewfinder.jsx`
- `StoryboardCommandPalette` — exported for consumers who want the palette standalone

## Dependencies

- [`context.jsx`](./context.jsx.md) — `StoryboardProvider`
- [`StoryboardContext.js`](./StoryboardContext.js.md) — raw context
- [`hashPreserver.js`](./hashPreserver.js.md) — `installHashPreserver`
- [`Workspace.jsx`](./Workspace.jsx.md) — workspace/viewfinder export
- [`CommandPalette/CommandPalette.jsx`](./CommandPalette/CommandPalette.jsx.md) — command palette
- [`BranchBar/BranchBar.jsx`](./BranchBar/BranchBar.jsx.md) — branch bar
- [`AuthModal/AuthModal.jsx`](./AuthModal/AuthModal.jsx.md) — auth modal
- [`PrototypeErrorBoundary.jsx`](./PrototypeErrorBoundary.jsx.md) — error boundaries
- [`Icon.jsx`](./Icon.jsx.md) — icon component
- `./hooks/*` — all data and state hooks
- `./canvas/*` — canvas page and hook
- `./context/FormContext.js` — form context

## Dependents

- `packages/storyboard/src/index.js` (root package barrel) — re-exports this whole surface to consumers
- Consumer application `_app.jsx` files that import `StoryboardProvider`, `installHashPreserver`, etc.
- Internal hooks that cross-import (e.g. hooks importing `StoryboardContext` directly rather than through the barrel)

## Notes

- `Viewfinder` is a deprecated alias for `Workspace` — the file was renamed as part of the SaaS-home redesign but both names are preserved.
- `StoryboardCommandPalette` is lazy-loaded inside `StoryboardProvider` automatically (via `context.jsx`), but it's also exported here so consumers can mount it independently.
- The `FormContext` export is specifically intended for downstream design-system packages (e.g. `@dfosco/storyboard-react-primer`) that need to integrate with Storyboard form state without taking a hard dep on the full internals.
