# `src/pages/index.jsx`

<!--
source: src/pages/index.jsx
category: page
importance: medium
-->

> [← Architecture Index](../../architecture.index.md)

## Goal

The home page route (`/`). Renders the `Playground` component and `ColorModeSwitcher`, serving as the default landing page and development sandbox.

## Composition

```jsx
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

- `../components/Playground.jsx` — Main playground/sandbox component
- `../components/ColorModeSwitcher.jsx` — Theme toggle

## Dependents

Auto-registered as the `/` route by Generouted via file-based routing.
