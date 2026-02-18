# `src/pages/_app.jsx`

<!--
source: src/pages/_app.jsx
category: routing
importance: high
-->

> [← Architecture Index](../../architecture.index.md)

## Goal

Root layout component for the app. This is a special generouted file — `_app.jsx` wraps all page routes with the `StoryboardProvider` and a `Suspense` boundary for lazy-loaded pages. Every page in `src/pages/` is rendered as a child of this component via React Router's `<Outlet>`.

## Composition

```js
export default function App() {
  return (
    <StoryboardProvider>
      <Suspense fallback={<PageLoading />}>
        <Outlet />
      </Suspense>
    </StoryboardProvider>
  )
}
```

`PageLoading` is an inline loading spinner component using CSS animation and Primer design tokens for colors.

## Dependencies

- [`packages/react/src/context.jsx`](../../packages/react/src/context.jsx.md) — `StoryboardProvider`
- `react-router-dom` — `Outlet` for nested route rendering
- `react` — `Suspense` for lazy page loading

## Dependents

- All page components in `src/pages/` are rendered within this layout
