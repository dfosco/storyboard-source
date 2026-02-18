# `packages/core/src/devtools.js`

<!--
source: packages/core/src/devtools.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../architecture.index.md)

## Goal

Implements the Storyboard DevTools — a vanilla JS floating toolbar for development. Framework-agnostic: mounts itself directly to the DOM with no React/Vue dependency. Provides a beaker button (bottom-right corner) that opens a dropdown menu with actions: show scene info (overlay with resolved scene JSON), navigate to viewfinder, and reset all hash params. Toggleable with `Cmd+.` / `Ctrl+.`. Also dynamically loads comments menu items when the comments system is enabled.

## Composition

**`mountDevTools(options?)`** — Mount the devtools to the DOM. Idempotent (safe to call multiple times). Accepts an optional `{ container }` option.

The function builds the entire DOM structure imperatively:
- Floating trigger button with beaker icon
- Dropdown menu with scene info, viewfinder, and reset buttons
- Overlay panel for displaying resolved scene JSON
- Keyboard shortcut handler (`Cmd+.` / `Ctrl+.`)
- Dynamic comments menu items via lazy import

All CSS is defined as a template string constant (`STYLES`) and injected via a `<style>` element. SVG icons are inline strings to avoid external dependencies.

## Dependencies

- [`packages/core/src/loader.js`](./loader.js.md) — `loadScene` for displaying scene data in the info panel
- `packages/core/src/comments/config.js` — `isCommentsEnabled` for conditional comments menu

## Dependents

- [`packages/core/src/index.js`](./index.js.md) — Re-exports `mountDevTools`
- [`src/index.jsx`](../../../src/index.jsx.md) — Calls `mountDevTools()` at app startup
