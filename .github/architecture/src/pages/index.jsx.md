# `src/pages/index.jsx`

<!--
source: src/pages/index.jsx
category: page
importance: medium
-->

> [← Architecture Index](../../architecture.index.md)

## Goal

The root page component (`/` route). Renders the `Playground` component and the `ColorModeSwitcher`.

## Composition

```js
import Playground from '../components/Playground.jsx'
import ColorModeSwitcher from '../components/ColorModeSwitcher.jsx'

function Code() {
  return (
    <>
      <Playground />
      <ColorModeSwitcher />
    </>
  )
}
export default Code
```

## Dependencies

- `src/components/Playground.jsx` — Main playground component
- `src/components/ColorModeSwitcher.jsx` — Theme/color mode toggle

## Dependents

- Rendered by the generouted router when navigating to `/`
