# `src/storyboard/components/Select.jsx`

<!--
source: src/storyboard/components/Select.jsx
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

A wrapped Primer `Select` that integrates with the storyboard form system. Inside a [`StoryboardForm`](./StoryboardForm.jsx.md), values are buffered locally and only written to session on form submit. Outside a form, it behaves as a normal controlled Primer Select.

This is part of the storyboard form component family alongside [`TextInput`](./TextInput.jsx.md), [`Textarea`](./Textarea.jsx.md), and [`Checkbox`](./Checkbox.jsx.md), all sharing the same draft-buffering pattern via [`FormContext`](../context/FormContext.js).

## Composition

```jsx
export default function Select({ name, onChange, value: controlledValue, children, ...props })
```

Key behavior:
- Reads the form context via [`FormContext`](../context/FormContext.js) to determine if it's inside a `StoryboardForm`
- Constructs the full data path by combining the form prefix with the field name
- Initializes from the session value via [`useSession()`](../hooks/useSession.js.md)
- Subscribes to form draft updates and syncs local state
- On change, updates the local draft and calls the parent `onChange` handler

```jsx
const handleChange = (e) => {
  if (isConnected) {
    setDraftState(e.target.value)
    form.setDraft(name, e.target.value)
  }
  if (onChange) onChange(e)
}
```

Forwards Primer's static sub-components:

```js
Select.Option = PrimerSelect.Option
```

## Dependencies

- `react` — `useContext`, `useState`, `useEffect`
- `@primer/react` — `Select` (as `PrimerSelect`)
- [`src/storyboard/context/FormContext.js`](../context/FormContext.js) — `FormContext`
- [`src/storyboard/hooks/useOverride.js`](../hooks/useOverride.js.md) — `useOverride`

## Dependents

- [`src/storyboard/index.js`](../index.js.md) — re-exports as `Select`
- [`src/pages/Forms.jsx`](../../pages/Forms.jsx) — used via storyboard barrel import
