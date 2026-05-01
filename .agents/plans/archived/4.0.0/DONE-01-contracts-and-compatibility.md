# Slice 00 — Contracts and Compatibility

## Goal

Define shared contracts first so feature slices can ship independently without rework.

## Deliverables

- `storyboard.config.json` schema additions for:
  - paste URL rules
  - GitHub embed behavior and `gh` guard copy/link
  - command palette providers/ranking knobs
- Canonical path-based canvas identity contract (replace basename-only assumptions).
- Compatibility contract for legacy canvas/component data.

## Key files

- `storyboard.config.json`
- `packages/react/src/vite/data-plugin.js`
- `packages/core/src/canvas/server.js`
- `packages/react/src/context.jsx`

## Implementation checklist

- [ ] Document config shape and defaults.
- [ ] Define migration/fallback behavior for projects without new config keys.
- [ ] Define path-based canvas ID format used by plugin, server, and client.
- [ ] Confirm branch base-path behavior for URL matching and same-origin logic.

## Exit criteria

- Existing projects load unchanged on 4.0 branch.
- All downstream slices can consume these contracts without changing them again.
