# `packages/storyboard/src/internals/PrototypeErrorBoundary.jsx`
<!--
source: packages/storyboard/src/internals/PrototypeErrorBoundary.jsx
category: storyboard
importance: medium
-->
> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

Provides three error boundary / error display components for catching different failure modes in prototype rendering. The boundaries isolate crashes so a single broken prototype never takes down the workspace, other prototypes, or the canvas system.

## Composition

```jsx
// Route-level error boundary (React Router v6.4+ errorElement)
// Accessed via useRouteError() — used as errorElement on prototype routes
export default function PrototypeErrorBoundary() {
  const error = useRouteError()
  return <ErrorDisplay error={error} />
}

// Fallback rendered as the route Component when lazy import() itself fails
// (syntax error, missing dependency, network failure)
export function ImportErrorFallback({ error, route }) {
  return <ErrorDisplay error={error} hint={`Failed to load module: ${route}`} />
}

// App-level last-resort class boundary (generouted wires via _app.Catch)
// Catches errors that escape all route-level boundaries
export function AppErrorBoundary() {
  const error = useRouteError()
  return <main>Something went wrong — {error.message}<br/>← Back / Reload</main>
}

// Shared error display with collapsible stack trace
function ErrorDisplay({ error, hint }) { ... }
class StackTrace extends Component { /* details/summary toggle */ }
```

## Dependencies

- `react` — `Component` (StackTrace class component)
- `react-router-dom` — `useRouteError`
- CSS Modules — `PrototypeErrorBoundary.module.css`

## Dependents

- Consumer `routes.jsx` — sets `errorElement={<PrototypeErrorBoundary />}` on every lazy prototype route
- Consumer `_app.jsx` — exports `AppErrorBoundary` as `Catch` (generouted's `_app?.Catch` pattern)
- [`index.js`](./index.js.md) — exports all three

## Notes

- `PrototypeErrorBoundary` and `AppErrorBoundary` both use `useRouteError()` (React Router's hook-based error access) — they are not React class error boundaries. The class pattern is only used for `StackTrace` (which doesn't need to be an error boundary itself).
- `ImportErrorFallback` is used when the lazy `import()` itself throws (network failure, syntax error in the file). It receives the error as a prop since there's no route error context at that point.
