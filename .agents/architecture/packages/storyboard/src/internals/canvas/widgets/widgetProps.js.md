# `packages/storyboard/src/internals/canvas/widgets/widgetProps.js`

<!--
source: packages/storyboard/src/internals/canvas/widgets/widgetProps.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

`widgetProps.js` is the thin runtime schema API for canvas widgets. It re-exports generated schemas from [`widgetConfig.js`](./widgetConfig.js.md) and gives widgets a consistent way to read prop values with defaults, build default prop objects, and preserve backward-compatible named schema exports.

Every widget in [`index.js`](./index.js.md) reads through this layer, and [`WidgetChrome.jsx`](./WidgetChrome.jsx.md) indirectly depends on it because toolbar actions mutate the same flat `props` objects these helpers interpret.

## Composition

```js
export function readProp(props, key, schema) { ... }
export function readAllProps(props, schema) { ... }
export function getDefaults(schema) { ... }
export const schemas = configSchemas
```

Schema / prop model:

- prop defs contain `type`, `label`, `category`, `defaultValue`, optional `options`, `min`, and `max`
- props are stored flat on each canvas widget object, not nested by category
- missing, `null`, `undefined`, or `NaN` numeric values fall back to schema defaults

Named compatibility exports include:

```js
export const stickyNoteSchema = schemas['sticky-note']
export const markdownSchema = schemas['markdown']
export const prototypeEmbedSchema = schemas['prototype']
```

These let older widget files keep explicit imports while the real source of truth lives in [`widgetConfig.js`](./widgetConfig.js.md).

## Dependencies

- [`widgetConfig.js`](./widgetConfig.js.md) for generated schemas.
- Canvas widgets such as [`StickyNote.jsx`](./StickyNote.jsx.md), [`MarkdownBlock.jsx`](./MarkdownBlock.jsx.md), [`PrototypeEmbed.jsx`](./PrototypeEmbed.jsx.md), [`TerminalWidget.jsx`](./TerminalWidget.jsx.md), and [`PromptWidget.jsx`](./PromptWidget.jsx.md).

## Dependents

- `CanvasPage.jsx` and `CanvasToolbar.jsx` use it when creating/editing widget props.
- Nearly every widget in [`index.js`](./index.js.md) imports `readProp()` or named schemas.
- Tests around canvas widget behavior depend on its defaulting semantics.

## Notes

- `getDefaults()` is the creation-time counterpart to `readProp()`: one seeds new widgets, the other interprets persisted widget props.
- The file exists mainly to stabilize the runtime API while schema authorship moved into JSON config.
