# `packages/storyboard/src/internals/canvas/widgets/LinkPreview.jsx`

<!--
source: packages/storyboard/src/internals/canvas/widgets/LinkPreview.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

`LinkPreview.jsx` renders pasted link metadata as a card, with a special GitHub rendering path for issues, PRs, discussions, and comments. It upgrades GitHub markdown into richer canvas HTML, supports expand/split-screen, and still behaves like a simple metadata card for non-GitHub URLs.

Within the widget set in [`index.js`](./index.js.md), this file is the "smart preview" implementation; [`WidgetChrome.jsx`](./WidgetChrome.jsx.md) provides the toolbar shell, while this component handles URL-specific rendering and expansion.

## Composition

```jsx
export default forwardRef(function LinkPreview({ id, props, onUpdate, resizable }, ref) {
  const url = readProp(props, 'url', linkPreviewSchema)
  const title = readProp(props, 'title', linkPreviewSchema)
  const github = props?.github && typeof props.github === 'object' ? props.github : null
})
```

Schema-backed props:

- `url` (`url`, default `""`)
- `title` (`text`, default `""`)
- `description` (`text`, default `""`)
- `ogImage` (`url`, default `""`)
- `width` (`number`, default `320`)
- `height` (`number`)

Two render modes:

- `GitHubIssueCard()` handles GitHub entities, converts markdown with remark, rewrites media/checklists/mentions, and sets body HTML imperatively to avoid React destroying live video elements.
- The default card shows `ogImage`, editable title, description, and hostname link.

State/effects:

- `editing` toggles title editing.
- `expandMode` drives modal vs split fullscreen.
- GitHub body content uses `useMemo()` plus a ref-based `innerHTML` sync effect.

Imperative actions for [`WidgetChrome.jsx`](./WidgetChrome.jsx.md): `expand`, `split-screen`, and `open-external`.

## Dependencies

- remark + GFM + HTML for markdown transformation.
- [`widgetProps.js`](./widgetProps.js.md) for the link preview schema.
- [`ExpandedPane.jsx`](./ExpandedPane.jsx.md) and `expandUtils.js` for fullscreen layouts.
- Primer Octicons for GitHub-specific chrome.

## Dependents

- Registered by [`index.js`](./index.js.md) as `link-preview`.
- Tested by `LinkPreview.test.jsx`.

## Notes

- `postProcessHtml()` forces links to new tabs, opens `<details>`, converts video URLs/images into `<video>`, and annotates `@mention` links for CSS pills.
- GitHub preview refresh is triggered externally by toolbar actions declared in [`widgetConfig.js`](./widgetConfig.js.md), not by polling inside this component.
