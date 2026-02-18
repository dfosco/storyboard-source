# `packages/react/src/index.js`

<!--
source: packages/react/src/index.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Public barrel file for the `@dfosco/storyboard-react` package. Every React-facing export — context provider, hooks, hash preserver, and form context — is re-exported from this single entry point so consumers only need one import path. It intentionally contains zero logic; its job is to define the public API surface and keep internal file structure private.

## Composition

The file is a pure re-export module. It groups exports by category:

**Context & Provider**

```js
export { default as StoryboardProvider } from './context.jsx'
export { StoryboardContext } from './StoryboardContext.js'
```

**Hooks**

```js
export { useSceneData, useSceneLoading } from './hooks/useSceneData.js'
export { useOverride } from './hooks/useOverride.js'
export { useOverride as useSession } from './hooks/useOverride.js' // deprecated alias
export { useScene } from './hooks/useScene.js'
export { useRecord, useRecords } from './hooks/useRecord.js'
export { useRecordOverride } from './hooks/useRecordOverride.js'
export { useLocalStorage } from './hooks/useLocalStorage.js'
export { useHideMode } from './hooks/useHideMode.js'
export { useUndoRedo } from './hooks/useUndoRedo.js'
```

**React Router integration**

```js
export { installHashPreserver } from './hashPreserver.js'
```

**Form context** (consumed by design-system packages)

```js
export { FormContext } from './context/FormContext.js'
```

`useSession` is a **deprecated alias** for `useOverride` — kept for backward compatibility.

## Dependencies

| Module | Purpose |
|--------|---------|
| [`./context.jsx`](./context.jsx.md) | `StoryboardProvider` component |
| [`./StoryboardContext.js`](./StoryboardContext.js.md) | Raw React context object |
| [`./hashPreserver.js`](./hashPreserver.js.md) | `installHashPreserver` |
| [`./context/FormContext.js`](./context/FormContext.js.md) | `FormContext` |
| `./hooks/useSceneData.js` | `useSceneData`, `useSceneLoading` |
| `./hooks/useOverride.js` | `useOverride` |
| `./hooks/useScene.js` | `useScene` |
| `./hooks/useRecord.js` | `useRecord`, `useRecords` |
| `./hooks/useRecordOverride.js` | `useRecordOverride` |
| `./hooks/useLocalStorage.js` | `useLocalStorage` |
| [`./hooks/useHideMode.js`](./hooks/useHideMode.js.md) | `useHideMode` |
| `./hooks/useUndoRedo.js` | `useUndoRedo` |

## Dependents

Consumed across the app and all design-system packages via `@dfosco/storyboard-react`:

- `src/pages/_app.jsx` — imports `StoryboardProvider`
- `src/pages/Dashboard.jsx` — imports `useSceneData`
- `src/pages/Repositories.jsx` — imports `useSceneData`
- `src/pages/SecurityAdvisory.jsx` — imports `useSceneData`
- `src/pages/Forms.jsx` — imports `useOverride`
- `src/pages/Signup.jsx` — imports `useOverride`
- `src/pages/issues/index.jsx` — imports `useSceneData`, `useOverride`, `useRecords`
- `src/pages/issues/[id].jsx` — imports `useSceneData`, `useOverride`, `useRecord`, `useRecordOverride`
- `src/pages/posts/index.jsx` — imports `useRecords`
- `src/pages/posts/[id].jsx` — imports `useRecord`
- `src/components/IssueFormFields/IssueFormFields.jsx` — imports `useOverride`
- `packages/react-primer/src/StoryboardForm.jsx` — imports `FormContext`
- `packages/react-primer/src/TextInput.jsx` — imports `FormContext`, `useOverride`
- `packages/react-primer/src/Select.jsx` — imports `FormContext`, `useOverride`
- `packages/react-primer/src/Checkbox.jsx` — imports `FormContext`, `useOverride`
- `packages/react-primer/src/Textarea.jsx` — imports `FormContext`, `useOverride`
- `packages/react-primer/src/SceneDataDemo.jsx` — imports `useOverride`, `useScene`
- `packages/react-reshaped/src/StoryboardForm.jsx` — imports `FormContext`
- `packages/react-reshaped/src/TextInput.jsx` — imports `FormContext`, `useOverride`
- `packages/react-reshaped/src/Select.jsx` — imports `FormContext`, `useOverride`
- `packages/react-reshaped/src/Checkbox.jsx` — imports `FormContext`, `useOverride`
- `packages/react-reshaped/src/Textarea.jsx` — imports `FormContext`, `useOverride`

## Notes

- The `@dfosco/storyboard-react/vite` export path resolves separately to [`packages/react/src/vite/data-plugin.js`](./vite/data-plugin.js.md), not through this barrel.
- The `@dfosco/storyboard-react/hash-preserver` export path is also a separate entry point used in `src/index.jsx`.
