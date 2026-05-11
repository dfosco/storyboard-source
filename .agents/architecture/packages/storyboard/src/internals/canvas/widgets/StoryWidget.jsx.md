# `packages/storyboard/src/internals/canvas/widgets/StoryWidget.jsx`

<!--
source: packages/storyboard/src/internals/canvas/widgets/StoryWidget.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

`StoryWidget.jsx` renders a single story export on canvas either inline or inside an isolated iframe, and can flip into a source-code viewer backed by the same syntax highlighter used elsewhere in Storyboard. It is the component-preview half of the story widgets registered in [`index.js`](./index.js.md).

This file is tightly coupled to [`WidgetChrome.jsx`](./WidgetChrome.jsx.md): toolbar actions ask it to expand, toggle code, copy source, or open the underlying story route.

## Composition

```jsx
export default forwardRef(function StoryWidget({ id: widgetId, props, onUpdate, resizable }, ref) {
  const storyId = props?.storyId || ''
  const exportName = props?.exportName || ''
  const showCode = !!props?.showCode
})
```

Schema-backed props:

- `storyId` (`text`, default `""`)
- `exportName` (`text`, default `""`)
- `width` (`number`)
- `height` (`number`)
- `showCode` (`boolean`, default `false`)

Key state/effects:

- `expandMode` drives modal/split expanded panes.
- `interactive` controls the iframe overlay.
- `sourceCode`, `highlightedHtml`, and `sourceLoading` back the code view.
- `storyIndexKey` listens for `storyboard:story-index-changed` so HMR story index patches recompute the isolated URL.
- `codeThemeKey` listens for `storyboard:theme:changed` and re-highlights source.

Imperative API:

```jsx
getState('showCode')
handleAction('show-code' | 'copy-code' | 'expand' | 'split-screen' | 'open-external')
```

## Dependencies

- `getStoryData()` and config access from `core/index.js` / `configStore.js`.
- Shared highlighter from `core/inspector/highlighter.js`.
- [`InlineStoryRenderer.jsx`](./InlineStoryRenderer.jsx.md) for inline story rendering mode.
- [`ExpandedPane.jsx`](./ExpandedPane.jsx.md) and `expandUtils.js` for expanded layouts.
- `useIframeDevLogs()` and embed overlay styling for iframe mode.

## Dependents

- Registered in [`index.js`](./index.js.md) as `story`.
- Used by `expandUtils.js` when story widgets participate in split panes.

## Notes

- Inline-story mode is feature-flagged through URL params or config, so this component supports both iframe and direct-render paths.
- Source fetching is cached per module path to avoid repeated `?raw` fetches while toggling the code viewer.
