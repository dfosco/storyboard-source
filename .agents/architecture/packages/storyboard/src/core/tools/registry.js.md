# `packages/storyboard/src/core/tools/registry.js`

<!--
source: packages/storyboard/src/core/tools/registry.js
category: core-tools
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

This file is the built-in module registry for declarative toolbar tools. [`packages/storyboard/src/core/ui/CoreUIBar.jsx`](../../core/ui/CoreUIBar.jsx) asks it for core handler loaders, then resolves `core:*` handler references from toolbar config without eagerly importing every tool implementation up front.

Its main architectural job is code splitting. Instead of importing all handlers at startup, it exports a plain object of lazy import functions. That keeps infrequently used tools—especially menu-only and canvas-only tools—out of the initial bundle until a configured tool is actually resolved.

## Composition

The registry is a single object literal plus a backwards-compatible alias:

```js
export const coreHandlers = {
  create:               () => import('./handlers/create.js'),
  theme:                () => import('./handlers/theme.js'),
  'palette-theme':      () => import('./handlers/paletteTheme.js'),
  comments:             () => import('./handlers/comments.js'),
  flows:                () => import('./handlers/flows.js'),
  inspector:            () => import('./handlers/inspector.js'),
  devtools:             () => import('./handlers/devtools.js'),
  'feature-flags':      () => import('./handlers/featureFlags.js'),
  autosync:             () => import('./handlers/autosync.js'),
  'canvas-add-widget':  () => import('./handlers/canvasAddWidget.js'),
  'canvas-agents':      () => import('./handlers/canvasAgents.js'),
  'canvas-toolbar':     () => import('./handlers/canvasToolbar.js'),
  'agents-ready':       () => import('./handlers/agentsReady.js'),
  'hide-toolbars':      () => import('./handlers/hideToolbars.js'),
  'command-palette':    () => import('./handlers/commandPalette.js'),
  'hide-chrome':        () => import('./handlers/hideChrome.js'),
}

export const toolModules = coreHandlers
```

Each value is a zero-argument loader that returns the handler module on demand. The loaded module is expected to expose the standard tool shape—`{ id, component?, handler?, setup?, guard? }`—so the caller can run guards, setup side effects, or render a custom component without knowing the module internals.

The `toolModules` alias keeps older call sites working while the newer `coreHandlers` name better reflects that this file only owns built-in storyboard handlers, not consumer-provided custom handlers.

## Dependencies

- No static imports; every dependency is a dynamic `import()` of a sibling handler such as [`packages/storyboard/src/core/tools/handlers/create.js`](handlers/create.js.md) or [`packages/storyboard/src/core/tools/handlers/canvasToolbar.js`](handlers/canvasToolbar.js.md).
- The lazy import boundary pairs with `CoreUIBar`'s `resolveHandlerModule(...)` flow in [`packages/storyboard/src/core/ui/CoreUIBar.jsx`](../../../../../../../packages/storyboard/src/core/ui/CoreUIBar.jsx).

## Dependents

- [`packages/storyboard/src/core/ui/CoreUIBar.jsx`](../../../../../../../packages/storyboard/src/core/ui/CoreUIBar.jsx) imports `coreHandlers` and passes it into handler resolution for toolbar config entries.
- Every built-in handler doc linked above is reachable through this registry; removing an entry breaks config references like `core:flows` or `core:hide-chrome`.

## Notes

The registry is intentionally declarative: it contains no branching, no handler logic, and no UI rendering. That makes it the canonical place to audit the built-in tool surface area.

Because the imports are dynamic, missing optional dependencies fail at the point a specific tool loads rather than on initial application boot.
