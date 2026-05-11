# `packages/storyboard/src/internals/canvas/widgets/MarkdownBlock.test.jsx`

<!--
source: packages/storyboard/src/internals/canvas/widgets/MarkdownBlock.test.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

Vitest test file covering [`MarkdownBlock.jsx`](./MarkdownBlock.jsx.md).

- Asserts read-only mode blocks editing, preserves text selection, and stops click bubbling.
- Asserts editable mode opens the textarea when `onUpdate` is available.
- Asserts empty read-only content shows the non-editable empty state.
- Asserts copy events write the raw markdown source to the clipboard.
- Asserts GitHub Flavored Markdown support for tables, task lists, strikethrough, and autolinks.

## Composition

Test cases:

- does not enter edit mode when `onUpdate` is unavailable
- enters edit mode when `onUpdate` is available
- shows a non-editable empty-state message in read-only mode
- stops click propagation in read-only mode
- copies markdown source in read-only mode
- renders tables
- renders task lists
- renders strikethrough
- renders autolinks

## Dependencies

- `@testing-library/react` for DOM rendering and copy/double-click simulation.
- `vitest` for assertions and mock callbacks.
- [`MarkdownBlock.jsx`](./MarkdownBlock.jsx.md) as the unit under test.

## Notes

- The clipboard test locks in a subtle design choice: read-only preview copies markdown source, not rendered HTML.
