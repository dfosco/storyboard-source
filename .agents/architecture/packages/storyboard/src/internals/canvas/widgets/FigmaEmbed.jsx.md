# `packages/storyboard/src/internals/canvas/widgets/FigmaEmbed.jsx`

<!--
source: packages/storyboard/src/internals/canvas/widgets/FigmaEmbed.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

`FigmaEmbed.jsx` embeds validated Figma board/design/prototype URLs inside the canvas with a click-to-interact gate, delayed iframe teardown, and split/modal expansion. It gives Figma documents the same ergonomic wrapper as prototype embeds, but keeps URL parsing and title generation Figma-specific.

It is registered by [`index.js`](./index.js.md) as `figma-embed`, while [`WidgetChrome.jsx`](./WidgetChrome.jsx.md) supplies the surrounding toolbar and action dispatch.

## Composition

```jsx
export default forwardRef(function FigmaEmbed({ id: widgetId, props, onUpdate, resizable }, ref) {
  const url = readProp(props, 'url', figmaEmbedSchema)
  const width = readProp(props, 'width', figmaEmbedSchema)
  const height = readProp(props, 'height', figmaEmbedSchema)
})
```

Schema-backed props:

- `url` (`url`, default `""`)
- `width` (`number`, default `800`)
- `height` (`number`, default `450`)

Key state/effects:

- `interactive` gates pointer events.
- `showIframe` keeps the iframe alive after deselection; a timeout tears it down after 5 minutes.
- `expandMode` drives modal vs split expansion.
- Reparenting logic moves the iframe DOM node between inline and expanded containers without losing browsing context.
- `useIframeDevLogs()` records iframe activity for dev debugging.

Imperative actions: `open-external`, `expand`, and `split-screen`.

## Dependencies

- [`widgetProps.js`](./widgetProps.js.md) for schema reads.
- `figmaUrl.js` for validation, embed URL conversion, title extraction, and type labeling.
- [`ExpandedPane.jsx`](./ExpandedPane.jsx.md) and `expandUtils.js` for expanded panes.
- Shared embed overlay styling and iframe dev logging.

## Dependents

- Registered in [`index.js`](./index.js.md) as `figma-embed`.
- Consumed by canvas paste/config routing through [`widgetConfig.js`](./widgetConfig.js.md).

## Notes

- Invalid or missing URLs render an explicit empty state instead of an iframe.
- Unlike `PrototypeEmbed`, this file has no HMR or message-channel subscriptions; interaction state is entirely local.
