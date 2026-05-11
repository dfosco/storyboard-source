# `packages/storyboard/src/internals/canvas/widgets/CodePenEmbed.jsx`

<!--
source: packages/storyboard/src/internals/canvas/widgets/CodePenEmbed.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

`CodePenEmbed.jsx` renders CodePen pens on canvas with the same interaction gate pattern used by other iframe widgets, plus a lightweight modal expansion path built with `createPortal()`. It is the paste-driven code playground widget registered in [`index.js`](./index.js.md).

Compared with [`WidgetChrome.jsx`](./WidgetChrome.jsx.md), this file owns the embedded document lifecycle itself: metadata fetch, delayed iframe teardown, Escape-to-close behavior, and DOM reparenting into the expanded modal.

## Composition

```jsx
export default forwardRef(function CodePenEmbed({ props, onUpdate, resizable }, ref) {
  const url = readProp(props, 'url', codepenEmbedSchema)
  const width = readProp(props, 'width', codepenEmbedSchema)
  const height = readProp(props, 'height', codepenEmbedSchema)
})
```

Schema-backed props:

- `url` (`url`, default `""`)
- `width` (`number`, default `800`)
- `height` (`number`, default `450`)

Key state/effects:

- `interactive` enables pointer interaction after the overlay is dismissed.
- `showIframe` keeps the iframe warm for two minutes after exit.
- `expanded` toggles the body-level portal modal.
- `penMeta` is fetched once through `fetchCodePenMeta(url)` to improve the header label.
- A document `keydown` listener closes the expanded view on Escape.

Imperative actions handled from [`WidgetChrome.jsx`](./WidgetChrome.jsx.md): `open-external` and `expand`.

## Dependencies

- [`widgetProps.js`](./widgetProps.js.md) and [`widgetConfig.js`](./widgetConfig.js.md).
- `codepenUrl.js` for URL validation, embed conversion, title fallback, and oEmbed metadata.
- `useIframeDevLogs()` for iframe diagnostics.
- `createPortal()` from `react-dom` for the expanded modal.

## Dependents

- Registered in [`index.js`](./index.js.md) as `codepen-embed`.
- Routed from paste handling through [`pasteRules.js`](./pasteRules.js.md).

## Notes

- This widget predates the shared [`ExpandedPane.jsx`](./ExpandedPane.jsx.md) pattern and still uses its own portal-based expanded shell.
- `onUpdate` is only used for resize persistence; the rest of the behavior is local runtime state.
