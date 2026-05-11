# `packages/storyboard/src/internals/canvas/widgets/ExpandedPane.jsx`

<!--
source: packages/storyboard/src/internals/canvas/widgets/ExpandedPane.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

`ExpandedPane.jsx` is the shared fullscreen/split-screen shell for canvas widgets. Prototype embeds, markdown, links, images, stories, terminals, and Figma all delegate their expanded layouts here instead of each building a separate portal manager.

Architecturally it sits one level below the widgets in [`index.js`](./index.js.md) and one level above [`ExpandedPaneTopBar.jsx`](./ExpandedPaneTopBar.jsx.md): widgets construct pane configs, then this file renders the portal, pane grid, resize dividers, and themed top bars.

## Composition

```jsx
export default function ExpandedPane({ initialPanes, initialLayout, variant = 'modal', closing: closingProp = false, onClose })
```

Core abstractions:

- `PaneConfig` can be `kind: 'react'` with a `render()` callback.
- Or `kind: 'external'` with `attach(container)` for imperative DOM like iframes or terminals.
- `layout` is a `PaneConfig[][]`: columns outside, rows inside, up to 2×2 panes.

Key state/effects:

- `closingInternal` supports immersive fade-out.
- `layout`, `columnSizes`, and `rowRatios` drive split layout and divider resizing.
- `containerRefs`, `detachRefs`, and `observerRefs` manage external-pane lifecycle plus `ResizeObserver` callbacks.
- `storyboard:expanded-pane:refresh` forces toolbar refresh when pane actions change.
- `storyboard:theme:changed` re-reads canvas theme attributes/CSS vars so the portal matches canvas color mode.

Render variants:

- `modal` for centered single-pane dialogs
- `immersive` for top-barless fullscreen playback
- `full` for terminals and split-screen layouts

## Dependencies

- `createPortal()` for body-level rendering.
- [`ExpandedPaneTopBar.jsx`](./ExpandedPaneTopBar.jsx.md) for pane bars and actions.
- Styles plus theme attributes pulled from the canvas scroll container.

## Dependents

- Used directly by [`MarkdownBlock.jsx`](./MarkdownBlock.jsx.md), [`PrototypeEmbed.jsx`](./PrototypeEmbed.jsx.md), [`LinkPreview.jsx`](./LinkPreview.jsx.md), [`ImageWidget.jsx`](./ImageWidget.jsx.md), [`FigmaEmbed.jsx`](./FigmaEmbed.jsx.md), [`StoryWidget.jsx`](./StoryWidget.jsx.md), and [`TerminalWidget.jsx`](./TerminalWidget.jsx.md).
- Tested in `ExpandedPane.test.jsx`.

## Notes

- External panes are attached in `useLayoutEffect()` so iframes/terminals are mounted before paint.
- Theme forwarding is crucial because the portal lives on `document.body`, outside the themed canvas subtree.
