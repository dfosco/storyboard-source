# `packages/storyboard/src/internals/canvas/widgets/ExpandedPane.test.jsx`

<!--
source: packages/storyboard/src/internals/canvas/widgets/ExpandedPane.test.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

Vitest test file covering [`ExpandedPane.jsx`](./ExpandedPane.jsx.md).

- Asserts single-pane modal rendering, title display, close button wiring, and Escape-key dismissal.
- Asserts single-pane `full` rendering with the shared top bar.
- Asserts multi-pane grid rendering, pane labels, and `N-1` divider behavior.
- Asserts external panes call `attach()` on mount and cleanup detach handlers on unmount.
- Asserts empty pane input returns `null`.
- Asserts `initialLayout` supports column/row layouts, split dividers, and single-pane modal fallback.

## Composition

Test helpers build both React-backed panes and imperative external panes:

```jsx
function makeReactPane(id, label = `Pane ${id}`) {
  return {
    id,
    label,
    kind: 'react',
    render: () => <div data-testid={`content-${id}`}>{label} content</div>,
  }
}
```

Test cases:

- renders modal container with title and content
- calls `onClose` when close button is clicked
- calls `onClose` on Escape key
- renders full-screen container with top bar
- renders both panes with grid layout
- renders 3 panes
- renders both pane labels in their respective panes
- renders divider between panes
- renders `N-1` dividers for `N` panes
- calls `attach` with container element on mount
- calls `detach` on unmount
- returns null when no panes provided
- renders 2 columns from `initialLayout`
- renders 3 panes as `1 column + 2-row column`
- renders 4 panes in a 2×2 grid
- renders column divider between columns
- renders row dividers within 2-row columns
- renders single-pane modal from 1-element layout

## Dependencies

- `@testing-library/react` for rendering, DOM queries, and synthetic events.
- `vitest` for assertions, spies, and the `react-dom` portal mock.
- [`ExpandedPane.jsx`](./ExpandedPane.jsx.md) as the unit under test.

## Notes

- Mocks `createPortal()` inline so portal output stays in the test tree.
- Installs a `ResizeObserver` polyfill because the expanded pane layout observes container size in jsdom.
