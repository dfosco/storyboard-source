# `packages/storyboard/src/internals/context.jsx`
<!--
source: packages/storyboard/src/internals/context.jsx
category: storyboard
importance: high
-->
> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

`context.jsx` is the heart of the React data layer. It exports `StoryboardProvider` — the component that every prototype page is wrapped in. The provider is responsible for determining which flow to load (via URL params, file-matching heuristics, or explicit props), loading and resolving the flow data synchronously from the core loader, and publishing the result through [`StoryboardContext`](./StoryboardContext.js.md) so all descendant hooks can consume it.

Beyond flow loading, the provider also acts as the runtime router for three mutually-exclusive content types: regular prototype pages, canvas pages (`/canvas/*`), and story/component pages (`/components/*`). When a canvas or story route is detected, the provider skips flow loading entirely and renders `CanvasPageLazy` or `StoryPageLazy` instead. This centralises all route-type detection in one place, ensuring the right rendering path is used without requiring per-page logic. The `CommandPaletteLazy` is always mounted as a sibling so it's globally available, and a `SectionErrorBoundary` wraps canvas and story sections to prevent a crash in one section from taking down the whole app.

## Composition

```jsx
// Root export — thin shell, always renders CommandPaletteLazy as sibling
export default function StoryboardProvider({ flowName, sceneName, recordName, recordParam, children }) {
  return (
    <>
      <StoryboardProviderInner ...>{children}</StoryboardProviderInner>
      <Suspense fallback={null}>
        <CommandPaletteLazy basePath={basePath} />
      </Suspense>
    </>
  )
}

// Inner — the actual logic
function StoryboardProviderInner({ flowName, sceneName, recordName, recordParam, children }) {
  const location = useLocation()
  const params = useParams()

  // Canvas detection (module-scope route map, built once)
  const canvasId = useMemo(() => matchCanvasRoute(location.pathname), [location.pathname])

  // Story detection (live lookup against HMR-mutable stories object)
  const storyName = useMemo(() => matchStoryRoute(location.pathname), [location.pathname, storyIndexKey])

  // Flow name resolution: URL param → explicit prop → page-matching → prototype-default → 'default'
  const activeFlowName = useMemo(() => resolveFlowName(...), [...deps])

  // Flow loading (synchronous, via core loader)
  const { data, error, flowTokens } = useMemo(() => {
    let flowData = loadFlow(activeFlowName)
    // Extract tokens from flow data
    // Merge record entry if recordName/recordParam configured
    setFlowClass(activeFlowName)
    return { data: flowData, error: null, flowTokens }
  }, [...deps])

  // Prototype-level tokens from .prototype.json metadata
  const protoTokens = useMemo(() => getPrototypeMetadata(prototypeName)?.tokens, [prototypeName])
  // Merged tokens → applied as URL search params via replaceState
  useEffect(() => { /* apply mergedTokens to URL */ }, [mergedTokens])

  // Render paths:
  if (canvasId) return <StoryboardContext.Provider value={...}><CanvasPageLazy .../></StoryboardContext.Provider>
  if (storyName) return <StoryboardContext.Provider value={...}><StoryPageLazy .../></StoryboardContext.Provider>
  if (isMissingCanvasRoute || isMissingStoryRoute) return <NotFoundUI />
  if (error) return <ErrorUI />
  return <StoryboardContext.Provider value={{ data, error, loading, flowName, prototypeName }}>{children}</StoryboardContext.Provider>
}
```

Key patterns:
- **Module-scope canvas route map** — built once at import time from the virtual data index; O(1) lookup per navigation
- **Live story route lookup** — iterates `stories` object on every call so HMR mutations (add/remove story files) are immediately reflected without full reload
- **`storyboard:story-index-changed` event** — dispatched by the HMR handler in the virtual module; bumps `storyIndexKey` to force `matchStoryRoute` re-evaluation
- **Flow resolution priority**: `?flow=` param → explicit prop → page-scoped flow → prototype-named flow → scoped default → global default → `null`
- **Token application**: prototype + flow tokens merged (flow wins); applied to URL via `replaceState` so they're accessible as search params without triggering navigation
- **Branch URL handling**: `stripBasePath()` strips the app sub-path (e.g. `/storyboard`) and correctly handles `branch--name` prefixes

## Dependencies

- [`StoryboardContext.js`](./StoryboardContext.js.md) — context object
- [`../core/index.js`](../core/index.js.md) — `loadFlow`, `flowExists`, `findRecord`, `resolveFlowName`, `resolveRecordName`, `deepMerge`, `setFlowClass`, `installBodyClassSync`, `isModesEnabled`, `getPrototypeMetadata`
- `virtual:storyboard-data-index` — `canvases`, `stories` objects (seeded by [`data-plugin.js`](./vite/data-plugin.js.md))
- `react-router-dom` — `useParams`, `useLocation`
- `./hooks/usePrototypeReloadGuard.js` — suppresses HMR full-reloads when prototype-auto-reload is off
- `./canvas/CanvasPage.jsx`, `./story/StoryPage.jsx`, `./CommandPalette/CommandPalette.jsx` — lazy-loaded sections

## Dependents

- [`index.js`](./index.js.md) — exports `StoryboardProvider` as the primary export
- Consumer application `_app.jsx` / route files that wrap prototype pages with `<StoryboardProvider>`
- All data hooks (`useFlowData`, `useOverride`, `useObject`, `useRecord`) — consume `StoryboardContext`

## Notes

- `SectionErrorBoundary` (class component, defined inline) catches canvas/story section crashes and shows a minimal error UI + home link — prevents a broken canvas from killing the prototype workspace.
- `installBodyClassSync()` is called in an effect on mount; it registers the reactive body class sync for flow overrides.
- `@dfosco/storyboard/ui-runtime` (design modes) is dynamically imported with `.catch()` so it degrades gracefully if the optional package is absent.
- The `canvasGroupMap` (sibling pages within a canvas folder) is sorted at module load time using `pageOrder` from `.meta.json`.
