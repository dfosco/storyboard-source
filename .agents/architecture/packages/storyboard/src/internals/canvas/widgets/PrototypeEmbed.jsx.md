# `packages/storyboard/src/internals/canvas/widgets/PrototypeEmbed.jsx`

<!--
source: packages/storyboard/src/internals/canvas/widgets/PrototypeEmbed.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

`PrototypeEmbed.jsx` embeds another Storyboard route inside the canvas. It normalizes branch-prefixed URLs, injects canvas theme query params, and lets a widget switch between inline, modal, split-screen, and immersive fullscreen without reloading the iframe when possible.

This widget is one of the most integrated canvas components: it talks to the prototype index, URL override state, iframe postMessage navigation, dev-log instrumentation, and [`ExpandedPane.jsx`](./ExpandedPane.jsx.md), while still being wrapped by [`WidgetChrome.jsx`](./WidgetChrome.jsx.md) for edit/zoom/expand controls.

## Composition

```jsx
export default forwardRef(function PrototypeEmbed({ id: widgetId, props, onUpdate, resizable }, ref) {
  const src = readProp(props, 'src', prototypeEmbedSchema)
  const zoom = readProp(props, 'zoom', prototypeEmbedSchema) || 100
  const width = readProp(props, 'width', prototypeEmbedSchema) || 800
  const height = readProp(props, 'height', prototypeEmbedSchema) || 600
})
```

Schema-backed props:

- `src` (`url`, default `""`)
- `originalSrc` (`url`, default `""`)
- `label` (`text`, default `""`)
- `zoom` (`number`, default `100`)
- `width` (`number`, default `800`)
- `height` (`number`, default `600`)

Important state/effects:

- `editing`, `interactive`, `filter`, `canvasTheme`, and `immersiveClosing` drive the picker, interact gate, filtering, themed iframe URL, and animated immersive exit.
- `useOverride('_prototype_expanded_${widgetId}')` persists expand state in the URL hash.
- `storyboard:theme:changed` refreshes `canvasTheme`.
- `storyboard:canvas:widget-fullscreen` / `-exit` enter and exit immersive mode.
- `window.message` listens for `storyboard:embed:navigate` and persists the new route.
- DOM reparenting moves the same iframe between inline and expanded containers to preserve session state.

Imperative actions handled for [`WidgetChrome.jsx`](./WidgetChrome.jsx.md): edit, expand, split-screen, open-external, zoom-in, and zoom-out.

## Dependencies

- [`widgetProps.js`](./widgetProps.js.md) for schema reads.
- `buildPrototypeIndex()` from `core/index.js` for the route picker.
- [`ExpandedPane.jsx`](./ExpandedPane.jsx.md), `expandUtils.js`, and `embedTheme.js` for expansion and theming.
- `useIframeDevLogs()` for iframe lifecycle diagnostics.
- `useOverride()` for URL-hash persistence.

## Dependents

- Registered by [`index.js`](./index.js.md) as `prototype`.
- Split-screen helpers in `expandUtils.js` construct related panes around it.

## Notes

- Branch URL support is built in: it strips `/branch--...` prefixes before matching routes, then re-applies the current base path for the live iframe.
- On immersive close it dispatches `storyboard:canvas:immersive-closed` so [`CanvasPage.jsx`](../CanvasPage.jsx.md) can clear fullscreen state.
