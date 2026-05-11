# `packages/storyboard/src/internals/canvas/widgets/ComponentSetWidget.jsx`

<!--
source: packages/storyboard/src/internals/canvas/widgets/ComponentSetWidget.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

`ComponentSetWidget.jsx` is a backward-compatibility alias kept for older code that still imports the old component-set file name. The real implementation lives in [`StorySetWidget.jsx`](./StorySetWidget.jsx.md), which remains the active widget registered by [`index.js`](./index.js.md).

The wrapper has no runtime behavior of its own and never participates directly in [`WidgetChrome.jsx`](./WidgetChrome.jsx.md) logic; it exists only to keep import paths stable.

## Composition

```jsx
// Deprecated — renamed to StorySetWidget.
export { default } from './StorySetWidget.jsx'
```

There are no local props, effects, or state variables. All schema-backed props and behavior are inherited from [`StorySetWidget.jsx`](./StorySetWidget.jsx.md):

- `storyId`
- `layout`
- `selected`
- `width`
- `height`

## Dependencies

- [`StorySetWidget.jsx`](./StorySetWidget.jsx.md) for the actual implementation.
- The surrounding widget system documented by [`index.js`](./index.js.md) and [`WidgetChrome.jsx`](./WidgetChrome.jsx.md).

## Dependents

- Legacy imports that still reference `ComponentSetWidget.jsx`.
- The ripgrep search in this repo primarily finds the alias relationship itself.

## Notes

- This file is intentionally tiny; if behavior changes are needed, they belong in [`StorySetWidget.jsx`](./StorySetWidget.jsx.md), not here.
- Keeping a dedicated architecture doc is still useful because stale imports are common during framework migrations.
