# `packages/storyboard/src/internals/canvas/widgets/index.js`

<!--
source: packages/storyboard/src/internals/canvas/widgets/index.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/internals/canvas/widgets/index.js`](./index.js.md) is the widget registry for the canvas runtime. It defines the authoritative mapping from persisted widget `type` strings to concrete React components, which lets [`packages/storyboard/src/internals/canvas/CanvasPage.jsx`](../CanvasPage.jsx.md) render heterogeneous canvas content without hard-coding imports or switch statements in the page itself.

Because the registry is centralized, it is also the seam where new widget types become part of the canvas platform. A widget is not fully “real” to the runtime until it is imported here and added to `widgetRegistry`, so this file effectively describes the supported widget surface for notes, markdown, embeds, images, stories, terminals, prompt agents, tiles, and terminal-read fallbacks.

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

```js
export function getWidgetComponent(type) {
  return widgetRegistry[type] ?? null
}
```

Notable mappings:

- `agent` intentionally reuses `TerminalWidget`, meaning agent widgets inherit the same rendering shell as terminals.
- `terminal-read` points at a dedicated read-only fallback for production or degraded states.
- `component-set` and `story` separate storybook-like compositions from generic JSX-backed component widgets managed elsewhere.

## Dependencies

- Individual widget implementations in the sibling `widgets/` directory, including `StickyNote.jsx`, `MarkdownBlock.jsx`, `PrototypeEmbed.jsx`, `ImageWidget.jsx`, `TerminalWidget.jsx`, `PromptWidget.jsx`, and related embeds.

## Dependents

- [`packages/storyboard/src/internals/canvas/CanvasPage.jsx`](../CanvasPage.jsx.md) calls `getWidgetComponent()` in `WidgetRenderer`.
- Widget config/props modules in the same directory are designed to stay aligned with this registry even though they are not direct import dependents.

## Notes

- Returning `null` for unknown widget types gives the page a safe failure mode: it can warn and skip unknown persisted content instead of crashing the entire canvas.
