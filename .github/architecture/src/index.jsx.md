# `src/index.jsx`

<!--
source: src/index.jsx
category: entry
importance: high
-->

> [← Architecture Index](../architecture.index.md)

## Goal

The application entry point. It mounts the React component tree into the DOM, wrapping everything in `StrictMode`, Primer's `ThemeProvider` (set to `auto` color mode), and `BaseStyles`. It creates the React Router instance via `createBrowserRouter`, installs the hash-preserving navigation interceptor, and renders the route tree.

This file also imports the global CSS reset (`reset.css`) and shared styles (`globals.css`) that apply across the entire app.

## Composition

The full render tree:

```jsx
const router = createBrowserRouter(routes, {
    basename: import.meta.env.BASE_URL,
})

installHashPreserver(router, import.meta.env.BASE_URL)

root.render(
    <StrictMode>
        <ThemeProvider colorMode="auto">
            <BaseStyles>
                <ColorModeSwitcher />
                <RouterProvider router={router} />
                {import.meta.env.DEV && <DevTools />}
            </BaseStyles>
        </ThemeProvider>
    </StrictMode>
)
```

- `ThemeProvider` is set to `colorMode="auto"` — it follows the system preference by default, switchable at runtime via `ColorModeSwitcher`.
- `RouterProvider` renders the Generouted route tree from `src/pages/`. The root layout is [`src/pages/_app.jsx`](./pages/_app.jsx.md).
- `installHashPreserver()` is called once at startup. It intercepts all internal `<a>` clicks at the document level, prevents default browser navigation (which causes full page reloads), and uses `router.navigate()` for client-side transitions — preserving URL hash params across page navigations.
- `DevTools` is only rendered in development mode.
- `reset.css` and `globals.css` are imported as side effects for global styles.

## Dependencies

- `react`, `react-dom/client` — React 19 root API (`createRoot`)
- `react-router-dom` — `RouterProvider`, `createBrowserRouter`
- `@generouted/react-router` — `routes` (auto-generated from `src/pages/`)
- `@primer/react` — `ThemeProvider`, `BaseStyles`
- `src/components/ColorModeSwitcher.jsx` — Global theme toggle
- [`src/storyboard/components/DevTools/DevTools.jsx`](./storyboard/components/DevTools/DevTools.jsx.md) — Dev tools panel (dev only)
- [`src/storyboard/core/hashPreserver.js`](./storyboard/core/hashPreserver.js.md) — Navigation interceptor

## Dependents

Referenced by `index.html` as the app entry point via `<script type="module" src="/src/index.jsx">`. No other files import this module.
