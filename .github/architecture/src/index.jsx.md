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

## Composition

The full render tree:

```jsx
root.render(
    <StrictMode>
        <ThemeProvider colorMode="auto">
            <BaseStyles>
                <ColorModeSwitcher />
                <Routes />
            </BaseStyles>
        </ThemeProvider>
    </StrictMode>
)
```

- `ThemeProvider` is set to `colorMode="auto"` — it follows the system preference by default, switchable at runtime via `ColorModeSwitcher`.
- `<Routes />` is the Generouted entry point that renders the file-based route tree from `src/pages/`.
- `reset.css` and `globals.css` are imported as side effects for global styles.

## Dependencies

- `react`, `react-dom/client` — React 19 root API (`createRoot`)
- `@generouted/react-router` — `Routes` component (auto-generated from `src/pages/`)
- `@primer/react` — `ThemeProvider`, `BaseStyles`
- `./components/ColorModeSwitcher` — Global theme toggle
- `./reset.css`, `./globals.css` — Global stylesheets

## Dependents

Referenced by `index.html` as the app entry point via `<script type="module" src="/src/index.jsx">`. No other files import this module.
