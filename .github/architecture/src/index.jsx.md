# `src/index.jsx`

<!--
source: src/index.jsx
category: entry
importance: high
-->

> [← Architecture Index](../architecture.index.md)

## Goal

Application entry point. Creates the React root, sets up the router, installs framework-level integrations (hash preserver, hide param listener, history sync, devtools, comments), and renders the app wrapped in Primer's `ThemeProvider` with `colorMode="auto"`.

## Composition

```js
const router = createBrowserRouter(routes, { basename: import.meta.env.BASE_URL })

installHashPreserver(router, import.meta.env.BASE_URL)
installHideParamListener()
installHistorySync()
initCommentsConfig(storyboardConfig)
mountDevTools()
mountComments()

root.render(
  <StrictMode>
    <ThemeProvider colorMode="auto">
      <BaseStyles>
        <ColorModeSwitcher />
        <RouterProvider router={router} />
      </BaseStyles>
    </ThemeProvider>
  </StrictMode>
)
```

Integrations are installed before render to ensure they're ready when components mount.

## Dependencies

- [`packages/react/src/hashPreserver.js`](../packages/react/src/hashPreserver.js.md) — `installHashPreserver`
- [`packages/core/src/index.js`](../packages/core/src/index.js.md) — `installHideParamListener`, `installHistorySync`, `mountDevTools`
- `@generouted/react-router` — `routes` for file-based routing
- `@primer/react` — `ThemeProvider`, `BaseStyles`
- `storyboard.config.json` — Comments configuration

## Dependents

- [`index.html`](../index.html) — Script entry point (`<script type="module" src="/src/index.jsx">`)
