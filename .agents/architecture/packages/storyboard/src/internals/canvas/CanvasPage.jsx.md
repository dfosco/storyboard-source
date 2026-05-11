# `packages/storyboard/src/internals/canvas/CanvasPage.jsx`

<!--
source: packages/storyboard/src/internals/canvas/CanvasPage.jsx
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/internals/canvas/CanvasPage.jsx`](./CanvasPage.jsx.md) is the heart of Storyboard’s canvas widget surface. It turns a canvas record plus optional JSX exports from [`packages/storyboard/src/internals/canvas/useCanvas.js`](./useCanvas.js.md) into the live editing experience: JSON widgets, component widgets, connectors, selection state, viewport persistence, zoom, marquee selection, keyboard shortcuts, drag/drop, copy/paste, page switching, and optimistic writes back through [`packages/storyboard/src/internals/canvas/canvasApi.js`](./canvasApi.js.md). It also owns the browser-side bridge that tells the rest of the app—and the Vite dev server—which canvas is active, which widgets are selected, and what the current viewport looks like.

Architecturally, the file is a large orchestration layer rather than a narrow view component. It coordinates the widget registry in [`packages/storyboard/src/internals/canvas/widgets/index.js`](./widgets/index.js.md), connector geometry from [`packages/storyboard/src/internals/canvas/connectorGeometry.js`](./connectorGeometry.js.md), marquee behavior from [`packages/storyboard/src/internals/canvas/useMarqueeSelect.js`](./useMarqueeSelect.js.md), undo/redo history from [`packages/storyboard/src/internals/canvas/useUndoRedo.js`](./useUndoRedo.js.md), theming from [`packages/storyboard/src/internals/canvas/canvasTheme.js`](./canvasTheme.js.md), and terminal leasing from [`packages/storyboard/src/internals/canvas/WebGLContextPool.jsx`](./WebGLContextPool.jsx.md). It additionally handles agent status, done/working broadcasts, hot-pool integration, GitHub enrichment, and selection-driven status flips, which makes it the main “canvas runtime” and a known refactor candidate when the team wants to split orchestration from rendering and bridge concerns.

## Composition

Major structure and handler families:

- **Pure helpers and constants** — zoom limits, viewport persistence keys, widget fallback sizes, theme resolution, center/snap helpers, canvas bounds, and agent-widget detection.
- **`WidgetRenderer` / `ChromeWrappedWidget`** — resolve widget types through [`packages/storyboard/src/internals/canvas/widgets/index.js`](./widgets/index.js.md), compute dynamic chrome features, and route widget-level actions like delete, duplicate, split screen, GitHub refresh, and broadcast toggles.
- **`CanvasTitleEditable`** — inline page/folder title editing backed by [`packages/storyboard/src/internals/canvas/canvasApi.js`](./canvasApi.js.md), including HMR-aware navigation after folder renames.
- **Canvas loading and local mirrors** — hydrates `canvas`, `jsxExports`, `localWidgets`, `localSources`, `localConnectors`, selection state, and snap/theme settings from [`packages/storyboard/src/internals/canvas/useCanvas.js`](./useCanvas.js.md).
- **Optimistic write pipeline** — `dirtyRef`, in-flight counters, grace timers, and `queueWrite()` serialize saves so HMR echoes and async API responses do not clobber newer local state.
- **Widget/source mutation handlers** — `handleWidgetUpdate`, `handleSourceUpdate`, drag end handlers, copy/duplicate flows, delete flows, and batch connector duplication all snapshot through [`packages/storyboard/src/internals/canvas/useUndoRedo.js`](./useUndoRedo.js.md) before persisting.
- **Connector handlers** — add/remove, alt-click auto-connect, drag-preview creation, nearest-anchor snapping, and endpoint drag affordances that feed [`packages/storyboard/src/internals/canvas/ConnectorLayer.jsx`](./ConnectorLayer.jsx.md).
- **Viewport lifecycle** — load saved viewport, zoom-to-fit on first load, persist zoom/scroll, center on URL-selected widgets, and throttle viewport broadcasts to the dev server.
- **Canvas/CoreUIBar bridge** — mounted/unmounted status, zoom broadcasts, snap-state broadcasts, add-widget/update-widget listeners, undo/redo listeners, zoom-to-fit listeners, and fullscreen prototype events.
- **Selection bridge** — writes selected widget ids and viewport to the HMR channel so `.selectedwidgets.json` and companion state stay synchronized for external agents.
- **Paste/drop/image pipeline** — resolves pasted text through widget paste rules, treats same-origin URLs as prototypes, enriches GitHub links, uploads pasted/dropped images, and supports cross-canvas widget-reference paste.
- **Agent-status surface** — derives done/working agent lists, broadcasts them to collaboration UI, updates document title, subscribes to HMR agent-status events, and recenters on requested agents.
- **WebGL pool visibility sync** — computes viewport rectangles and pushes terminal/agent visibility priorities into [`packages/storyboard/src/internals/canvas/WebGLContextPool.jsx`](./WebGLContextPool.jsx.md).
- **Input affordances** — keyboard shortcuts, cmd/ctrl wheel zoom, iframe-forwarded wheel zoom, touch pinch zoom, space-drag panning, and marquee selection via [`packages/storyboard/src/internals/canvas/useMarqueeSelect.js`](./useMarqueeSelect.js.md).
- **Final composition** — renders [`packages/storyboard/src/internals/canvas/PageSelector.jsx`](./PageSelector.jsx.md), [`packages/storyboard/src/internals/canvas/MarqueeOverlay.jsx`](./MarqueeOverlay.jsx.md), [`packages/storyboard/src/internals/canvas/ConnectorLayer.jsx`](./ConnectorLayer.jsx.md), and the widget tree inside the zoomed canvas surface.

Representative orchestration points:

```jsx
const doneAgents = useMemo(() => {
  const widgets = localWidgets ?? []
  const out = []
  for (const w of widgets) {
    if (!isAgentWidget(w)) continue
    if (w?.props?.status === 'done') {
      out.push({ id: w.id, type: w.type, alias: w.props?.alias || null })
    }
  }
  return out
}, [localWidgets])

useEffect(() => {
  const detail = { canvasId, doneAgents, workingAgents }
  document.dispatchEvent(new CustomEvent('storyboard:done-agents-changed', { detail }))
  function handleRequest() {
    document.dispatchEvent(new CustomEvent('storyboard:done-agents-changed', { detail }))
  }
  document.addEventListener('storyboard:done-agents-request', handleRequest)
  return () => document.removeEventListener('storyboard:done-agents-request', handleRequest)
}, [canvasId, doneAgents, workingAgents])
```

```jsx
useEffect(() => {
  if (!import.meta.hot) return
  function handler(data) {
    const widgetId = data?.widgetId
    if (!widgetId) return
    const widgets = stateRef.current.widgets ?? []
    const widget = widgets.find((w) => w?.id === widgetId)
    if (!widget) return
    let nextStatus = null
    if (data.status === 'done' || data.status === 'completed') nextStatus = 'done'
    else if (data.status === 'error') nextStatus = 'error'
    else if (data.status === 'cancelled') nextStatus = 'idle'
    else if (data.status === 'working') nextStatus = 'working'
    else if (data.status === 'running' || data.status === 'pending') nextStatus = 'running'
    if (!nextStatus) return
    if (widget.props?.status === nextStatus) return
    const updates = { status: nextStatus }
    if (nextStatus === 'error' && data.message) updates.errorMessage = data.message
    handleWidgetUpdateRef.current?.(widgetId, updates)
  }
  import.meta.hot.on('storyboard:agent-status', handler)
  return () => {
    if (typeof import.meta.hot.off === 'function') {
      import.meta.hot.off('storyboard:agent-status', handler)
    }
  }
}, [])
```

```jsx
const handleWidgetSelect = useCallback((widgetId, shiftKey) => {
  if (justDraggedRef.current) return
  if (shiftKey) {
    setSelectedWidgetIds(prev => {
      const next = new Set(prev)
      if (next.has(widgetId)) next.delete(widgetId)
      else next.add(widgetId)
      return next
    })
  } else {
    setSelectedWidgetIds(new Set([widgetId]))
  }
  const widgets = stateRef.current.widgets ?? []
  const target = widgets.find((w) => w?.id === widgetId)
  if (target?.props?.status === 'done' && isAgentWidget(target)) {
    handleWidgetUpdateRef.current?.(widgetId, { status: 'running' })
  }
}, [])
```

The render path is intentionally broad:

```jsx
return (
  <WebGLContextPoolProvider>
    <div className={styles.canvasTitle}>…<PageSelector … /></div>
    <div ref={scrollRef} className={styles.canvasScroll} …>
      <MarqueeOverlay rect={marqueeScreenRect} />
      <div ref={zoomElRef} className={styles.canvasZoom} …>
        <ConnectorLayer … />
        <Canvas {...canvasProps} onDragStart={…} onDrag={…} onDragEnd={…}>
          {allChildren}
        </Canvas>
      </div>
    </div>
  </WebGLContextPoolProvider>
)
```

## Dependencies

- [`packages/storyboard/src/internals/canvas/useCanvas.js`](./useCanvas.js.md) — loads build-time and server-refreshed canvas data plus JSX exports.
- [`packages/storyboard/src/internals/canvas/useUndoRedo.js`](./useUndoRedo.js.md) — snapshots composite canvas state for undo/redo.
- [`packages/storyboard/src/internals/canvas/useMarqueeSelect.js`](./useMarqueeSelect.js.md) — marquee selection math and drag lifecycle.
- [`packages/storyboard/src/internals/canvas/canvasApi.js`](./canvasApi.js.md) — all persistence, image, page, connector, GitHub, and batch operations.
- [`packages/storyboard/src/internals/canvas/canvasTheme.js`](./canvasTheme.js.md) — Primer-compatible theme attrs and CSS variables.
- [`packages/storyboard/src/internals/canvas/ConnectorLayer.jsx`](./ConnectorLayer.jsx.md) and [`packages/storyboard/src/internals/canvas/connectorGeometry.js`](./connectorGeometry.js.md) — connector rendering and anchor selection.
- [`packages/storyboard/src/internals/canvas/WebGLContextPool.jsx`](./WebGLContextPool.jsx.md) — pool provider and visibility updater for terminal-like widgets.
- [`packages/storyboard/src/internals/canvas/PageSelector.jsx`](./PageSelector.jsx.md) and [`packages/storyboard/src/internals/canvas/MarqueeOverlay.jsx`](./MarqueeOverlay.jsx.md) — secondary canvas UI.
- [`packages/storyboard/src/internals/canvas/widgets/index.js`](./widgets/index.js.md) plus adjacent widget config/props helpers — map widget types to concrete renderers and chrome behavior.
- `../../core/index.js`, `virtual:storyboard-data-index`, and canvas primitives in `../../canvas/index.js` — shared runtime data, flags, story routes, and drag surface primitives.

## Dependents

- [`packages/storyboard/src/internals/context.jsx`](../context.jsx.md) lazy-loads this page for canvas routes.
- `packages/storyboard/src/internals/index.js` re-exports it as a public internal surface.
- Canvas-focused tests (`CanvasPage.bridge.test.jsx`, `CanvasPage.dragdrop.test.jsx`, `CanvasPage.multiselect.test.jsx`) exercise its orchestration behavior.
- Core bridge modules such as `packages/storyboard/src/core/canvas/selectedWidgets.js` document or consume the HMR events this page emits.

## Notes

- The file keeps optimistic local state separate from server pushes and uses a serialized write queue plus dirty grace window to avoid watcher races.
- Zoom is applied imperatively to the DOM to avoid rerendering the entire widget tree on every wheel tick.
- The same component owns both user-facing editing and agent-facing bridge concerns, which is why it is repeatedly referenced as a refactor candidate.
