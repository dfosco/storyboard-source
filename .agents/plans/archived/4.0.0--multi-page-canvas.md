# Slice 04 — Multi-Page Canvas (`t05`)

## Goal

Support grouped canvas pages under `/canvas/*` folders, with stable IDs and an in-canvas page selector.

## Scope

- Replace basename-only canvas identity with path-stable IDs.
- Group `*.canvas.jsonl` pages by folder.
- Add top-left page selector in canvas UI.
- Support direct links and reload-safe page selection.

## Key files

- `packages/core/src/canvas/server.js`
- `packages/react/src/vite/data-plugin.js`
- `packages/react/src/context.jsx`
- `packages/react/src/canvas/useCanvas.js`
- `packages/react/src/canvas/CanvasPage.jsx`

## Implementation checklist

- [ ] Define canonical group/page ID shape end-to-end.
- [ ] Update server read/list/update/create to resolve by path-stable identity.
- [ ] Update data plugin indexing for grouped pages.
- [ ] Add page selector UI and route/deep-link synchronization.
- [ ] Ensure duplicate basenames across folders do not collide.

## Acceptance criteria

- Folder-grouped canvas pages are discoverable and switchable.
- Page state is isolated per page and stable across reload.
- Duplicate basenames in different folders no longer conflict.

## Verification

### Automated
- [ ] Path-based ID resolution tests
- [ ] Duplicate basename non-collision tests
- [ ] Page selector route/deep-link restore tests

### Agent-browser
- [ ] Switch pages via selector, reload, and deep-link to page
- [ ] Validate page-isolated widget edits

### Manual
- [ ] Selector remains discoverable and reliable in large canvases
