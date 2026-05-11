# `packages/storyboard/src/internals/Workspace.jsx`
<!--
source: packages/storyboard/src/internals/Workspace.jsx
category: storyboard
importance: medium
-->
> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

Canonical entry point for the workspace homescreen component. This is a thin re-export shim that points to `Viewfinder.jsx` (the legacy filename). New code should import from `Workspace.jsx`; the `Viewfinder.jsx` filename is preserved for backwards compat.

## Composition

```js
export { default, default as Workspace } from './Viewfinder.jsx'
```

Both the default export and the named `Workspace` export resolve to the same component defined in [`Viewfinder.jsx`](./Viewfinder.jsx.md).

## Dependencies

- [`Viewfinder.jsx`](./Viewfinder.jsx.md) — the actual implementation

## Dependents

- [`index.js`](./index.js.md) — `export { default as Workspace } from './Workspace.jsx'` and deprecated `export { default as Viewfinder } from './Workspace.jsx'`

## Notes

- The rename from `Viewfinder` → `Workspace` happened when the component was redesigned as a SaaS-style homescreen. The file rename was done via a shim to avoid breaking any existing imports.
