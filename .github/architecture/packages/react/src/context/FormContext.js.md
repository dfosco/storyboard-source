# `packages/react/src/context/FormContext.js`

<!--
source: packages/react/src/context/FormContext.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Provides a React context for the `<StoryboardForm>` component to communicate with child form inputs. Design-system packages (like Primer or Reshaped integrations) use this context to connect form fields to the storyboard override system.

## Composition

```js
import { createContext } from 'react'
export const FormContext = createContext(null)
```

Value shape:
```js
{ prefix: string, getDraft: (name) => any, setDraft: (name, value) => void }
```

## Dependencies

- `react` — `createContext`

## Dependents

- [`packages/react/src/index.js`](../index.js.md) — Re-exports `FormContext`
