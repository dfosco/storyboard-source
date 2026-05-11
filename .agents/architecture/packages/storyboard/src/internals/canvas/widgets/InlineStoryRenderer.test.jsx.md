# `packages/storyboard/src/internals/canvas/widgets/InlineStoryRenderer.test.jsx`

<!--
source: packages/storyboard/src/internals/canvas/widgets/InlineStoryRenderer.test.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

Vitest test file covering [`InlineStoryRenderer.jsx`](./InlineStoryRenderer.jsx.md).

- Asserts named exports render when the story lookup succeeds.
- Asserts missing stories report a lookup error.
- Asserts missing named exports show the inline export error.
- Asserts thrown component renders are contained by the story error boundary.
- Asserts `storyboard:story-index-changed` triggers a re-import.

## Composition

The file mocks `getStoryData()` and drives async import paths with simple good/bad components:

```jsx
vi.mock('../../../core/index.js', () => ({
  getStoryData: vi.fn(),
}))
```

Test cases:

- renders the named export when found
- reports missing story
- reports missing export
- contains thrown render errors via error boundary
- re-imports on `storyboard:story-index-changed`

## Dependencies

- `@testing-library/react` for render, `act()`, and async waiting.
- `vitest` for module mocking, spies, and assertions.
- [`InlineStoryRenderer.jsx`](./InlineStoryRenderer.jsx.md) as the unit under test.

## Notes

- Suppresses `console.error` during tests so intentional error-boundary logging does not pollute output.
