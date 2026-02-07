# `src/pages/_app.jsx`

<!--
source: src/pages/_app.jsx
category: routing
importance: high
-->

> [← Architecture Index](../../architecture.index.md)

## Goal

The root layout component for all routes, following Generouted's `_app.jsx` convention. It wraps the entire route tree in a `<StoryboardProvider>`, making scene data available to every page via React context. The `<Outlet />` renders the matched child route.

This is the bridge between the routing system and the storyboard data system — by placing the provider here, all pages automatically have access to scene data without needing to set up their own loading logic.

## Composition

```jsx
export default function App() {
  return (
    <StoryboardProvider>
      <Outlet />
    </StoryboardProvider>
  )
}
```

No props — the `StoryboardProvider` reads the scene name from the URL's `?scene=` param or defaults to `"default"`. Every page component rendered via `<Outlet />` can call `useSceneData()` to access the loaded scene.

## Dependencies

- `react-router-dom` — `Outlet` for nested route rendering
- `../storyboard/context.jsx` — `StoryboardProvider`

## Dependents

Consumed automatically by Generouted as the root layout. All page components in `src/pages/` render inside this layout.
