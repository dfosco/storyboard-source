# `packages/storyboard/src/internals/canvas/widgets/WidgetWrapper.jsx`

<!--
source: packages/storyboard/src/internals/canvas/widgets/WidgetWrapper.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

`WidgetWrapper.jsx` is the minimal structural shell shared by several presentational canvas widgets. It provides a consistent outer `<section>` and inner content container so embeds and card-style widgets inherit the same shadow, border, and padding treatment without duplicating wrapper markup.

## Composition

The file exports a single passthrough component that merges the standard wrapper class with an optional caller-provided class name.

```jsx
export default function WidgetWrapper({ children, className }) {
  return (
    <section className={`${styles.wrapper} ${className || ''}`}>
      <div className={styles.content}>{children}</div>
    </section>
  )
}
```

Behavior:

- Always renders semantic `<section>` markup for the widget frame.
- Nests `children` inside `styles.content`, giving CSS a stable interior target.
- Accepts `className` for widget-specific styling layers on top of the shared chrome.

## Dependencies

- `WidgetWrapper.module.css` for the shared visual treatment.

## Dependents

- [`CodePenEmbed.jsx`](./CodePenEmbed.jsx.md)
- [`ComponentWidget.jsx`](./ComponentWidget.jsx.md)
- [`FigmaEmbed.jsx`](./FigmaEmbed.jsx.md)
- [`ImageWidget.jsx`](./ImageWidget.jsx.md)
- [`LinkPreview.jsx`](./LinkPreview.jsx.md)
- [`MarkdownBlock.jsx`](./MarkdownBlock.jsx.md)
- [`PrototypeEmbed.jsx`](./PrototypeEmbed.jsx.md)
- [`StoryWidget.jsx`](./StoryWidget.jsx.md)
- [`StorySetWidget.jsx`](./StorySetWidget.jsx.md)
- [`TilesWidget.jsx`](./TilesWidget.jsx.md)

## Notes

- The abstraction is intentionally tiny; most widget-specific behavior stays in the caller while this file standardizes only frame markup.
