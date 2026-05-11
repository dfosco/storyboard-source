# `packages/storyboard/src/internals/canvas/widgets/index.js`

<!--
source: packages/storyboard/src/internals/canvas/widgets/index.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

`index.js` is the registry entry point for canvas widgets. [`CanvasPage.jsx`](../CanvasPage.jsx.md) imports `getWidgetComponent(type)` from here to translate persisted widget type strings into concrete React components.

This file is the top of the widget component layer: [`widgetConfig.js`](./widgetConfig.js.md) decides what metadata and features exist, [`widgetProps.js`](./widgetProps.js.md) interprets widget props, and [`WidgetChrome.jsx`](./WidgetChrome.jsx.md) wraps whatever component this registry returns.

## Composition

```js
export const widgetRegistry = {
  'sticky-note': StickyNote,
  'markdown': MarkdownBlock,
  'prototype': PrototypeEmbed,
  'link-preview': LinkPreview,
  'image': ImageWidget,
  'figma-embed': FigmaEmbed,
  'codepen-embed': CodePenEmbed,
  'story': StoryWidget,
  'component-set': StorySetWidget,
  'terminal': TerminalWidget,
  'terminal-read': TerminalReadWidget,
  'agent': TerminalWidget,
  'prompt': PromptWidget,
  'tiles': TilesWidget,
}
```

Two public exports:

- `widgetRegistry` for callers that need the whole map
- `getWidgetComponent(type)` as the common lookup helper

Notable mappings:

- `agent` reuses [`TerminalWidget.jsx`](./TerminalWidget.jsx.md)
- `component-set` maps to [`StorySetWidget.jsx`](./StorySetWidget.jsx.md)
- paste-only widgets like images and embeds still live here once created

## Dependencies

- Every primary widget component in this directory.
- [`CanvasPage.jsx`](../CanvasPage.jsx.md) is the main consumer.
- [`WidgetChrome.jsx`](./WidgetChrome.jsx.md), [`widgetConfig.js`](./widgetConfig.js.md), and [`widgetProps.js`](./widgetProps.js.md) form the rest of the widget runtime around it.

## Dependents

- `CanvasPage.jsx` uses it to render canvas widgets.
- Storyboard internals, runtime code, devtools, tests, and CLI/runtime surfaces import it as a broader package entrypoint.
- Several widget helpers also reference this module in docs as the canonical registry cross-link.

## Notes

- Unknown widget types resolve to `null`, letting callers fail gracefully.
- The registry is intentionally explicit rather than auto-discovered so bundle shape and import boundaries stay predictable.
