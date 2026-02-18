# `packages/react/src/context/FormContext.js`

<!--
source: packages/react/src/context/FormContext.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Provides a shared React context for Storyboard form components. The `FormContext` connects `<StoryboardForm>` (defined in design-system packages like `react-primer` and `react-reshaped`) to its child input components (`TextInput`, `Select`, `Checkbox`, `Textarea`), passing down the data path prefix and draft read/write functions without prop drilling.

This context lives in the framework-agnostic `@dfosco/storyboard-react` package so that multiple design-system bindings can share the same context identity — a `<StoryboardForm>` from Primer and a `<TextInput>` from Reshaped would interoperate correctly because they reference the same `FormContext` object.

## Composition

```js
import { createContext } from 'react'

export const FormContext = createContext(null)
```

### Context value shape (provided by `<StoryboardForm>`)

```js
{
  prefix: string,                  // data path prefix (e.g. "checkout")
  getDraft: (name) => any,         // read local draft value for a field
  setDraft: (name, value) => void, // write local draft value
}
```

Default value is `null` — input components check for the context and fall back to standalone behavior when no form wrapper is present.

## Dependencies

| Module | Purpose |
|--------|---------|
| `react` | `createContext` |

## Dependents

- [`packages/react/src/index.js`](../index.js.md) — re-exports `FormContext` as part of the public API
- `packages/react-primer/src/StoryboardForm.jsx` — provides `FormContext.Provider` with prefix and draft helpers
- `packages/react-primer/src/TextInput.jsx` — consumes `FormContext` to resolve field paths
- `packages/react-primer/src/Select.jsx` — consumes `FormContext`
- `packages/react-primer/src/Checkbox.jsx` — consumes `FormContext`
- `packages/react-primer/src/Textarea.jsx` — consumes `FormContext`
- `packages/react-reshaped/src/StoryboardForm.jsx` — provides `FormContext.Provider`
- `packages/react-reshaped/src/TextInput.jsx` — consumes `FormContext`
- `packages/react-reshaped/src/Select.jsx` — consumes `FormContext`
- `packages/react-reshaped/src/Checkbox.jsx` — consumes `FormContext`
- `packages/react-reshaped/src/Textarea.jsx` — consumes `FormContext`

## Notes

- This is the most widely consumed context in the project — it bridges the core React package and every design-system binding. Any change to the value shape is a cross-package breaking change.
