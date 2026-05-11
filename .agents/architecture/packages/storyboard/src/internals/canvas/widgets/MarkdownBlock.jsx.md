# `packages/storyboard/src/internals/canvas/widgets/MarkdownBlock.jsx`

<!--
source: packages/storyboard/src/internals/canvas/widgets/MarkdownBlock.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

`MarkdownBlock.jsx` renders rich text content on canvas using remark + GitHub Flavored Markdown, then upgrades fenced code blocks with the shared inspector highlighter. It is the main text-heavy widget in [`index.js`](./index.js.md) and relies on [`WidgetChrome.jsx`](./WidgetChrome.jsx.md) for toolbar actions such as edit, collapse, copy, and expand.

The file also owns expanded-view behavior by building pane layouts and delegating fullscreen/split rendering to [`ExpandedPane.jsx`](./ExpandedPane.jsx.md).

## Composition

```jsx
export default forwardRef(function MarkdownBlock({ id, props, onUpdate, resizable }, ref) {
  const content = readProp(props, 'content', markdownSchema)
  const width = readProp(props, 'width', markdownSchema)
  const height = props?.height
  const collapsed = !!props?.collapsed
})
```

Schema-backed props:

- `content` (`text`, default `""`)
- `width` (`number`, default `530`)
- `height` (`number`)

Key state/effects:

- `editing` swaps preview HTML for a textarea.
- `expandMode` tracks `single` vs `split` expanded layouts.
- `editHeight` preserves the preview height while React swaps DOM nodes.
- `themeKey` listens for `storyboard:theme:changed` and re-runs syntax highlighting.
- `renderedHtml` starts from `renderMarkdown(content)` and is asynchronously upgraded by `highlightCodeBlocks()`.

Imperative actions exposed to [`WidgetChrome.jsx`](./WidgetChrome.jsx.md):

```jsx
handleAction(actionId) {
  if (actionId === 'expand' || actionId === 'expand-single') setExpandMode('single')
  if (actionId === 'split-screen') setExpandMode('split')
}
```

Expanded mode is implemented by `MarkdownExpandPane()`, which uses `findAllConnectedSplitTargets()` and `buildSplitLayout()` from `expandUtils.js` before passing the result to [`ExpandedPane.jsx`](./ExpandedPane.jsx.md).

## Dependencies

- remark, `remark-gfm`, and `remark-html` for markdown → HTML conversion.
- [`widgetProps.js`](./widgetProps.js.md) and [`widgetConfig.js`](./widgetConfig.js.md) for schema + surface feature metadata.
- [`ExpandedPane.jsx`](./ExpandedPane.jsx.md) and `expandUtils.js` for fullscreen/split layouts.
- Shared syntax highlighting through `core/inspector/highlighter.js`.

## Dependents

- Registered in [`index.js`](./index.js.md) as `markdown`.
- Referenced by `expandUtils.js` for split-screen pane construction.
- Tested by `MarkdownBlock.test.jsx`.

## Notes

- Rendered HTML is intentionally unsanitized because markdown is an authoring feature inside the repo, not untrusted public input.
- Read-only copy handling writes plain text to the clipboard while still allowing text selection.
