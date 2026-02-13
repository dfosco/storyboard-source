# `src/storyboard/components/StoryboardForm.jsx`

<!--
source: src/storyboard/components/StoryboardForm.jsx
category: storyboard
importance: high
-->

> [← Architecture Index](../../../architecture.index.md)

## Goal

A form wrapper that buffers input values locally and only persists them to the URL hash (overrides) on submit. This is the designer-friendly alternative to manually wiring `useOverride()` + `onChange` handlers for every field.

## Composition

```jsx
export default function StoryboardForm({ data, onSubmit, children, ...props })
```

**Props:**
- `data` — Root path prefix for all child fields (e.g., `data="checkout"`)
- `onSubmit` — Optional callback fired after values are flushed to hash
- All other props are passed through to the native `<form>` element

**Internal state:**
- `draftsRef` — A `useRef({})` holding draft values keyed by field name
- `listenersRef` — A `useRef({})` holding per-field re-render callbacks

**Submit behavior:**
1. Calls `e.preventDefault()` internally
2. Iterates over all draft entries and calls `setParam(prefix.name, value)` for each
3. Calls the `onSubmit` callback if provided

**Context provided to children** via [`FormContext`](../context/FormContext.js.md):

```js
{ prefix, getDraft, setDraft, subscribe }
```

## Dependencies

- `react` — `useRef`, `useCallback`
- [`src/storyboard/context/FormContext.js`](../context/FormContext.js.md) — `FormContext`
- [`src/storyboard/core/session.js`](../core/session.js.md) — `setParam`

## Dependents

- [`src/storyboard/components/SceneDataDemo.jsx`](./SceneDataDemo.jsx.md) — Edit User form
- [`src/pages/Forms.jsx`](../../pages/Forms.jsx.md) — Example form page
- [`src/storyboard/index.js`](../index.js.md) — Re-exported as `StoryboardForm`
