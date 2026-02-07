# `src/index.jsx`

<!--
source: src/index.jsx
category: entry
importance: high
-->

> [← Architecture Index](../architecture.index.md)

## Goal

The application entry point. It mounts the React component tree into the DOM, wrapping everything in `StrictMode`, Primer's `ThemeProvider` (set to `auto` color mode), and `BaseStyles`. It renders the Generouted `<Routes />` component which loads the file-based route tree, and includes the global `<ColorModeSwitcher />` for theme toggling.

This file also imports the global CSS reset (`reset.css`) and shared styles (`globals.css`) that apply across the entire app.

<details>
<summary>Technical details</summary>

### Composition

- Creates a React root on `document.getElementById('root')`
- Render tree: `StrictMode` → `ThemeProvider(colorMode="auto")` → `BaseStyles` → `ColorModeSwitcher` + `Routes`
- Imports `reset.css` and `globals.css` as side-effect-only imports

### Dependencies

- `react`, `react-dom/client` — React 19 root API
- `@generouted/react-router` — `Routes` component (auto-generated from `src/pages/`)
- `@primer/react` — `ThemeProvider`, `BaseStyles`
- `./components/ColorModeSwitcher` — Global theme switcher
- `./reset.css`, `./globals.css` — Global styles

### Dependents

Referenced by `index.html` as the app entry point. No other files import this module.

</details>
