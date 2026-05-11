# `src/index.jsx`

<!--
source: src/index.jsx
category: entry
importance: high
-->

> [← Architecture Index](../architecture.index.md)

## Goal

[`src/index.jsx`](./index.jsx.md) is the browser entry point for the prototype app. It turns Vite's generated route table into a running React application, installs Storyboard's navigation and chrome integration, and establishes the shared UI shell by combining React Router with Primer's theme and base styles.

It also handles one repo-specific startup edge case: after a new canvas file is created, Vite performs a full reload before the new route exists in memory. This entry point preserves the intended destination through `?redirect=` and performs an immediate base-path-aware redirect before React mounts. In practice, [`src/index.jsx`](./index.jsx.md) is the bridge between [`vite.config.js`](../vite.config.js.md), [`storyboard.config.json`](../storyboard.config.json.md), and the exported runtime surface from [`packages/storyboard/package.json`](../packages/storyboard/package.json.md).

## Composition

The file starts with app-shell imports: React root creation, the generated route list, Primer providers, CSS resets, and the unified Storyboard package exports used to mount runtime UI:

```jsx
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { routes } from './routes'
import { ThemeProvider, BaseStyles } from '@primer/react'
import ThemeSync from './components/ThemeSync/ThemeSync.jsx'
import { installHashPreserver } from '@dfosco/storyboard/hash-preserver'
import { mountStoryboardCore } from '@dfosco/storyboard/core'
import storyboardConfig from '../storyboard.config.json'
```

Before creating the router, it handles the canvas-creation reload path. The redirect is synchronous and uses `import.meta.env.BASE_URL` so branch-prefixed URLs remain correct:

```js
const redirectParam = new URLSearchParams(window.location.search).get('redirect')
if (redirectParam) {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  window.location.replace(base + redirectParam)
}
```

Routing is then built from generouted's `routes` export, again anchored to the current base path supplied by [`vite.config.js`](../vite.config.js.md):

```js
const router = createBrowserRouter(routes, {
    basename: import.meta.env.BASE_URL,
})

installHashPreserver(router, import.meta.env.BASE_URL)
mountStoryboardCore(storyboardConfig, { basePath: import.meta.env.BASE_URL })
```

Those two setup calls are the key architectural seam in the file: `installHashPreserver(...)` keeps Storyboard's URL-hash state intact across router navigations, while `mountStoryboardCore(...)` mounts the non-page chrome and runtime features configured by [`storyboard.config.json`](../storyboard.config.json.md).

Finally, the file renders the React tree. Primer wraps the app globally, `ThemeSync` bridges Storyboard theme state into Primer, and `RouterProvider` owns page rendering:

```jsx
root.render(
    <StrictMode>
        <ThemeProvider colorMode="auto">
            <BaseStyles>
                <ThemeSync />
                <RouterProvider router={router} />
            </BaseStyles>
        </ThemeProvider>
    </StrictMode>
)
```

## Dependencies

- `react` and `react-dom/client` — create and render the root application tree.
- `react-router-dom` — supplies `createBrowserRouter` and `RouterProvider` for the route graph generated from `./routes`.
- `@primer/react` — provides the top-level theme and base-style providers that all pages render under.
- `./components/ThemeSync/ThemeSync.jsx` — keeps Primer theme state aligned with Storyboard runtime theme state.
- `@dfosco/storyboard/hash-preserver` and `@dfosco/storyboard/core` — imported from the package surface declared in [`packages/storyboard/package.json`](../packages/storyboard/package.json.md).
- [`../storyboard.config.json`](../storyboard.config.json.md) — runtime configuration passed directly into `mountStoryboardCore(...)`.
- Local CSS files plus `@dfosco/storyboard/comments/ui/comment-layout.css` — establish global styling before route content renders.

## Dependents

- `index.html` loads [`src/index.jsx`](./index.jsx.md) as the app's module entry.
- [`vite.config.js`](../vite.config.js.md) includes `src/index.jsx` in `server.warmup.clientFiles`.
- Documentation and migration skills in the repo treat this file as the canonical app bootstrap target when describing consumer setup.

## Notes

- `import.meta.env.BASE_URL` is used for redirect handling, router basename, hash preservation, and core mounting; these all need to stay aligned for branch URL support.
- `rootElement` is assumed to exist in `index.html`; this file does not guard against a missing `#root`, because the HTML shell is treated as part of the app contract.
