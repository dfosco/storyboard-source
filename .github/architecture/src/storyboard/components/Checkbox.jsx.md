# `src/storyboard/components/Checkbox.jsx`

<!--
source: src/storyboard/components/Checkbox.jsx
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

A wrapped Primer `Checkbox` that integrates with the storyboard form system. Inside a [`StoryboardForm`](./StoryboardForm.jsx.md), values are buffered locally and only written to session on form submit. Outside a form, it behaves as a normal controlled Primer Checkbox.

This component stores boolean state as `"true"` / `"false"` string values in the URL hash, consistent with the string-based session parameter system in [`src/storyboard/core/session.js`](../core/session.js.md).

## Composition

```jsx
export default function Checkbox({ name, onChange, checked: controlledChecked, ...props })
```

Key behavior:
- Reads the form context via [`FormContext`](../context/FormContext.js) to determine if it's inside a `StoryboardForm`
- Constructs the full data path by combining the form prefix with the field name: `form.prefix + '.' + name`
- Initializes from the session value via [`useSession()`](../hooks/useSession.js.md), converting to boolean (`"true"` → `true`)
- Subscribes to form draft updates so the checkbox reflects changes from other sources
- On change, updates the local draft and calls the parent `onChange` handler

```jsx
const handleChange = (e) => {
  if (isConnected) {
    setDraftState(e.target.checked)
    form.setDraft(name, e.target.checked ? 'true' : 'false')
  }
  if (onChange) onChange(e)
}
```

## Dependencies

- `react` — `useContext`, `useState`, `useEffect`
- `@primer/react` — `Checkbox` (as `PrimerCheckbox`)
- [`src/storyboard/context/FormContext.js`](../context/FormContext.js) — `FormContext`
- [`src/storyboard/hooks/useSession.js`](../hooks/useSession.js.md) — `useSession`

## Dependents

- [`src/storyboard/index.js`](../index.js.md) — re-exports as `Checkbox`
- [`src/pages/Forms.jsx`](../../pages/Forms.jsx) — used via storyboard barrel import
