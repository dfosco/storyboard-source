# `packages/storyboard/src/core/data/viewfinder.js`
<!--
source: packages/storyboard/src/core/data/viewfinder.js
category: storyboard
importance: medium
-->
> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

Higher-level data layer that builds the structured prototype/canvas index powering the Workspace viewfinder UI. It consumes `loader.js` primitives and composes them into a hierarchical index of folders → prototypes → flows → canvases, with sort orders, route resolution, and metadata. Also provides utility functions used by route link generation across the app.

## Composition

```js
// Deterministic hash for seeding generative placeholders (avatar colours, etc.)
export function hash(str) { /* djb2-like integer hash */ }

// Append flow tokens object as URL query params (filters reserved keys: flow, scene)
export function appendTokens(url, tokens) { ... }

// Resolve the route URL for a named flow (including ?flow= param if non-default)
// Priority: known-route match → flow.meta.route → flow._route → "/?flow=name"
// Flows with `meta.default: true` pointing to a route omit the ?flow= param
export function resolveFlowRoute(flowName, knownRoutes = []) { ... }

// Get flow display metadata (title, description, author)
export function getFlowMeta(flowName) { ... }

// Main entry point: build the full prototype/canvas index
export function buildPrototypeIndex(knownRoutes = []) {
  // Returns:
  // {
  //   folders: FolderEntry[],       // folders with nested prototypes + canvases
  //   prototypes: ProtoEntry[],     // ungrouped prototypes
  //   canvases: CanvasEntry[],      // ungrouped canvases (multi-page groups collapsed)
  //   globalFlows: FlowEntry[],     // flows not scoped to any prototype
  //   sorted: { title: {...}, updated: {...} }  // pre-sorted views
  // }
}
```

Canvas grouping: multiple `.canvas.jsonl` files sharing a `_group` key are collapsed into a single entry with a `pages` array. Page order is controlled by `_canvasMeta.pageOrder`.

## Dependencies

- [`./loader.js`](./loader.js.md) — `loadFlow`, `listFlows`, `listPrototypes`, `getPrototypeMetadata`, `listFolders`, `getFolderMetadata`, `listCanvases`, `getCanvasData`

## Dependents

- `packages/storyboard/src/internals/Viewfinder.jsx` — calls `buildPrototypeIndex()` to render the workspace homescreen
- `packages/storyboard/src/core/index.js` — re-exports `buildPrototypeIndex`, `resolveFlowRoute`, `getFlowMeta`, `appendTokens`, `hash`
- `packages/storyboard/src/core/data/viewfinder.test.js` — unit tests

## Notes

- `resolveFlowRoute` has a `resolveSceneRoute` alias marked `@deprecated` (kept for client migration).
- `getFlowMeta` checks `data.meta`, `data.flowMeta`, and `data.sceneMeta` in priority order for backwards compatibility with legacy flow schemas.
- External prototypes (those with a `url` field in their `.prototype.json`) appear in the index with `isExternal: true` and `externalUrl` set; the Viewfinder renders these as links opening in a new tab.
- Canvas entries with `_folder` in their data are assigned to the matching folder, just like prototypes.
