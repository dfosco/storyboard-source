# `packages/storyboard/src/internals/canvas/widgets/ExpandedPaneTopBar.test.jsx`

<!--
source: packages/storyboard/src/internals/canvas/widgets/ExpandedPaneTopBar.test.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

Vitest test file covering [`ExpandedPaneTopBar.jsx`](./ExpandedPaneTopBar.jsx.md).

- Asserts the pane label renders left-aligned text content.
- Asserts the close button is conditional on `showClose`.
- Asserts clicking the close button calls `onClose`.
- Asserts the root bar element carries the dark-bar styling class.

## Composition

Test cases:

- renders pane label left-aligned
- renders close button when `showClose` is true
- does not render close button when `showClose` is false
- calls `onClose` when close button is clicked
- has dark background styling

## Dependencies

- `@testing-library/react` for render helpers and click simulation.
- `vitest` for expectations and spies.
- [`ExpandedPaneTopBar.jsx`](./ExpandedPaneTopBar.jsx.md) as the unit under test.

## Notes

- The styling assertion intentionally checks the generated class name pattern instead of computed colors.
