# `packages/storyboard/src/internals/canvas/widgets/pasteRules.js`

<!--
source: packages/storyboard/src/internals/canvas/widgets/pasteRules.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

`pasteRules.js` is the config-driven resolver that maps pasted text or URLs to widget descriptors. [`CanvasPage.jsx`](../CanvasPage.jsx.md) uses it to decide whether a paste should create a prototype embed, Figma widget, CodePen widget, link preview, or another configured widget type.

It complements the registry in [`index.js`](./index.js.md): [`index.js`](./index.js.md) resolves a widget type to a React component, while this file resolves pasted content to the `{ type, props }` pair that should be created. [`WidgetChrome.jsx`](./WidgetChrome.jsx.md) is not involved directly, but the created widgets ultimately surface their actions there.

## Composition

```js
export function createPasteContext(origin, basePath) { ... }
export function compileRule(ruleDef) { ... }
export function resolvePaste(text, context, overrideRules = []) { ... }
```

Config / rule shape:

- source of truth is `paste.config.json`
- rule fields include `name`, `match`, `widget`, and `props`
- `match` can combine `hostname`, `pathname`, `pattern`, `sameOrigin`, `isUrl`, and `any`
- prop templates can interpolate `$url`, `$src`, `$pathname`, `$search`, `$hash`, `$hostname`, and `$origin`

Key behavior:

- `createPasteContext()` understands branch-prefixed Storyboard URLs.
- `buildTemplateVars()` creates replacement tokens from the parsed URL.
- `resolvePropValue()` applies template substitution and optional URL sanitization.
- rules are compiled once at module load; runtime override rules are compiled on demand and prepended.

## Dependencies

- `paste.config.json` for default rule definitions.
- [`CanvasPage.jsx`](../CanvasPage.jsx.md) as the main consumer.
- Widget types documented in [`index.js`](./index.js.md), especially paste-created iframe widgets.

## Dependents

- `CanvasPage.jsx` imports `createPasteContext()` and `resolvePaste()`.
- `pasteRules.test.js` exercises rule compilation and branch-path handling.

## Notes

- Image pastes and widget-reference pastes intentionally stay outside this file because they need direct clipboard or canvas API access.
- Branch URL support is built in via `BRANCH_PREFIX_RE`, matching the repo-wide requirement for branch-safe URL logic.
