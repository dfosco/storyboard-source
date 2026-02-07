# `src/pages/index.jsx`

<!--
source: src/pages/index.jsx
category: page
importance: medium
-->

> [← Architecture Index](../../architecture.index.md)

## Goal

The home page route (`/`). Renders the `Playground` component and `ColorModeSwitcher`, serving as the default landing page and development sandbox for the app.

<details>
<summary>Technical details</summary>

### Composition

- **Default export**: `Code` component
- Renders `<Playground />` and `<ColorModeSwitcher />` in a fragment

### Dependencies

- `../components/Playground.jsx` — Main playground/sandbox component
- `../components/ColorModeSwitcher.jsx` — Theme toggle

### Dependents

Auto-registered as the `/` route by Generouted via file-based routing.

</details>
