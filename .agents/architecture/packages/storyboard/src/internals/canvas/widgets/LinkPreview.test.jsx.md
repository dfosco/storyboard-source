# `packages/storyboard/src/internals/canvas/widgets/LinkPreview.test.jsx`

<!--
source: packages/storyboard/src/internals/canvas/widgets/LinkPreview.test.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

Vitest test file covering [`LinkPreview.jsx`](./LinkPreview.jsx.md).

- Asserts GitHub issue cards render split titles, markdown bodies, and author bylines.
- Asserts non-GitHub links stay on the generic preview layout.
- Asserts OG images, descriptions, and broken-image hiding behavior.
- Asserts inline title editing only activates when `onUpdate` exists.
- Asserts empty titles fall back to the parsed hostname.

## Composition

Test cases:

- renders GitHub issue card with markdown body and author byline
- does not render GitHub layout for non-GitHub links
- renders plain link-preview without github data
- renders OG image when present
- does not render image element when `ogImage` is absent
- hides broken OG image on error
- renders description when present
- enters edit mode on double-click and saves on change
- does not enter edit mode when `onUpdate` is missing
- shows fallback text when title is empty

## Dependencies

- `@testing-library/react` for rendering, text lookup, and `error`/double-click/change events.
- `vitest` for assertions and `onUpdate` spies.
- [`LinkPreview.jsx`](./LinkPreview.jsx.md) as the unit under test.

## Notes

- The GitHub-card test exercises the markdown-to-HTML path indirectly by asserting headings and list items in the rendered body.
