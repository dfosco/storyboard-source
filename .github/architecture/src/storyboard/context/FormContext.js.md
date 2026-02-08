# `src/storyboard/context/FormContext.js`

<!--
source: src/storyboard/context/FormContext.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../architecture.index.md)

## Goal

A React context that connects [`StoryboardForm`](../components/StoryboardForm.jsx.md) to its child input components (`TextInput`, `Textarea`, `Select`, `Checkbox`). The form provides the context value; inputs consume it to read/write draft state.

## Composition

```js
export const FormContext = createContext(null)
```

**Context value shape** (provided by `StoryboardForm`):

```js
{
  prefix: string,                    // data path prefix (e.g. "checkout")
  getDraft: (name) => any,           // read local draft value for a field
  setDraft: (name, value) => void,   // write local draft value
  subscribe: (name, listener) => unsubscribe,  // subscribe to draft updates
}
```

When `FormContext` is `null` (no parent `StoryboardForm`), wrapped inputs fall back to controlled component behavior.

## Dependencies

- `react` — `createContext`

## Dependents

- [`src/storyboard/components/StoryboardForm.jsx`](../components/StoryboardForm.jsx.md) — Provides context value
- [`src/storyboard/components/TextInput.jsx`](../components/TextInput.jsx.md) — Consumes context
- [`src/storyboard/components/Textarea.jsx`](../components/Textarea.jsx.md) — Consumes context
- [`src/storyboard/components/Select.jsx`](../components/Select.jsx.md) — Consumes context
- [`src/storyboard/components/Checkbox.jsx`](../components/Checkbox.jsx.md) — Consumes context
