# `src/storyboard/components/TextInput.jsx`

<!--
source: src/storyboard/components/TextInput.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../architecture.index.md)

## Goal

A wrapped version of Primer React's `TextInput` that integrates with [`StoryboardForm`](./StoryboardForm.jsx.md). Inside a form, it buffers values in local state and registers with the form's draft system. Session values serve as initial defaults. Outside a form, it behaves as a normal controlled Primer `TextInput`.

## Composition

```jsx
export default function TextInput({ name, onChange, value: controlledValue, ...props })
```

**Inside a `StoryboardForm`:**
1. Reads `form.prefix` from `FormContext` to build the full session path (`prefix.name`)
2. Reads session value via `useSession(path)` as the initial default
3. Manages a local `draft` state via `useState`
4. Subscribes to form context updates via `form.subscribe(name, callback)`
5. On change, updates local draft and calls `form.setDraft(name, value)`
6. All Primer props are passed through unchanged

**Outside a form (no `FormContext`):**
- Falls back to `controlledValue` prop, behaves like standard Primer `TextInput`

## Dependencies

- `react` — `useContext`, `useState`, `useEffect`
- `@primer/react` — `TextInput` (as `PrimerTextInput`)
- [`src/storyboard/context/FormContext.js`](../context/FormContext.js.md) — `FormContext`
- [`src/storyboard/hooks/useSession.js`](../hooks/useSession.js.md) — `useSession`

## Dependents

- [`src/storyboard/components/SceneDataDemo.jsx`](./SceneDataDemo.jsx.md)
- [`src/pages/Forms.jsx`](../../pages/Forms.jsx.md)
- [`src/storyboard/index.js`](../index.js.md) — Re-exported as `TextInput`

## Notes

The same pattern (local draft + form context + session fallback) is shared by all wrapped input components: `Textarea`, `Select`, and `Checkbox`.
