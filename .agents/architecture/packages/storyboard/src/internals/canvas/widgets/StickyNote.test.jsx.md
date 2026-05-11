# `packages/storyboard/src/internals/canvas/widgets/StickyNote.test.jsx`

<!--
source: packages/storyboard/src/internals/canvas/widgets/StickyNote.test.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

Vitest test file covering [`StickyNote.jsx`](./StickyNote.jsx.md).

- Asserts sticky-note schema defaults and persisted width/height reads.
- Asserts default and saved dimensions are applied as inline styles.
- Asserts resize handles are conditional on `resizable`.
- Asserts resize drags emit updated dimensions and enforce minimum bounds.
- Asserts read-only mode blocks editing and uses the non-editable empty state.

## Composition

The file tests both schema helpers from [`widgetProps.js`](./widgetProps.js.md) and rendered widget behavior.

Test cases:

- includes width and height in the size category
- includes default values for width/height from config
- returns default value when width/height are not saved in props
- returns saved width/height when present in props
- applies default dimensions as inline styles when not saved in props
- applies saved dimensions as inline styles
- renders a resize handle when resizable
- does not render a resize handle when not resizable
- calls `onUpdate` with new dimensions on resize drag
- enforces minimum dimensions during resize
- does not enter edit mode without `onUpdate`
- shows non-editable empty-state text in read-only mode

## Dependencies

- `@testing-library/react` for rendering and resize/edit event simulation.
- `vitest` for assertions and spies.
- [`widgetProps.js`](./widgetProps.js.md) and [`StickyNote.jsx`](./StickyNote.jsx.md) as the units under test.

## Notes

- The resize tests patch `offsetWidth` and `offsetHeight` because jsdom does not calculate layout metrics.
