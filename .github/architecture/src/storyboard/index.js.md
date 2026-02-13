# `src/storyboard/index.js`

<!--
source: src/storyboard/index.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../architecture.index.md)

## Goal

The public barrel file for the storyboard system. All external imports of storyboard functionality should go through this module. It exports the provider, hooks, utilities, form components, and the navigation/hash preservation API.

## Composition

```js
export { default as StoryboardProvider } from './context.jsx'
export { useSceneData, useSceneLoading } from './hooks/useSceneData.js'
export { useSession } from './hooks/useSession.js'
export { useScene } from './hooks/useScene.js'
export { getByPath } from './core/dotPath.js'
export { loadScene, sceneExists } from './core/loader.js'
export { getParam, setParam, getAllParams, removeParam } from './core/session.js'
export { installHashPreserver } from './core/hashPreserver.js'
export { default as DevTools } from './components/DevTools/DevTools.jsx'
export { default as StoryboardForm } from './components/StoryboardForm.jsx'
export { default as TextInput } from './components/TextInput.jsx'
export { default as Checkbox } from './components/Checkbox.jsx'
export { default as Select } from './components/Select.jsx'
export { default as Textarea } from './components/Textarea.jsx'
```

The module exports four main categories:
1. **Scene data access** — `StoryboardProvider`, `useSceneData`, `useSceneLoading`, `useScene` for read-only scene data and scene switching
2. **Session state** — `useSession` hook and direct utilities (`getParam`, `setParam`, etc.) for URL hash-based state management
3. **Form components** — `StoryboardForm`, `TextInput`, `Textarea`, `Select`, `Checkbox` for designer-friendly form binding with submit-based persistence
4. **Navigation** — `installHashPreserver` for client-side navigation with hash preservation

## Dependencies

- [`src/storyboard/context.jsx`](./context.jsx.md) — Provider component
- [`src/storyboard/hooks/useSceneData.js`](./hooks/useSceneData.js.md) — Scene data access hooks
- [`src/storyboard/hooks/useSession.js`](./hooks/useSession.js.md) — Session state hook
- [`src/storyboard/hooks/useScene.js`](./hooks/useScene.js.md) — Scene switching hook
- [`src/storyboard/core/dotPath.js`](./core/dotPath.js.md) — Path utility
- [`src/storyboard/core/loader.js`](./core/loader.js.md) — Scene loader
- [`src/storyboard/core/session.js`](./core/session.js.md) — Session utilities
- [`src/storyboard/core/hashPreserver.js`](./core/hashPreserver.js.md) — Navigation interceptor
- [`src/storyboard/components/StoryboardForm.jsx`](./components/StoryboardForm.jsx.md) — Form wrapper
- [`src/storyboard/components/TextInput.jsx`](./components/TextInput.jsx.md) — Wrapped TextInput
- [`src/storyboard/components/Textarea.jsx`](./components/Textarea.jsx.md) — Wrapped Textarea
- [`src/storyboard/components/Select.jsx`](./components/Select.jsx.md) — Wrapped Select
- [`src/storyboard/components/Checkbox.jsx`](./components/Checkbox.jsx.md) — Wrapped Checkbox

## Dependents

This is the intended public import path for external consumers. Pages like [`src/pages/Forms.jsx`](../pages/Forms.jsx.md) import form components from here. Internal files may also import from specific sub-modules directly (e.g., [`src/pages/_app.jsx`](../pages/_app.jsx.md) imports from [`src/storyboard/context.jsx`](./context.jsx.md)).
