# `packages/storyboard/src/internals/canvas/widgets/InlineStoryRenderer.jsx`

<!--
source: packages/storyboard/src/internals/canvas/widgets/InlineStoryRenderer.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

`InlineStoryRenderer.jsx` renders a Storybook-style export directly inside the canvas React tree instead of using an iframe. It gives story widgets a lighter inline preview path while still isolating render failures with [`StoryErrorBoundary.jsx`](../StoryErrorBoundary.jsx.md) and mirroring the canvas theme through Primer’s `ThemeProvider`.

## Composition

The renderer resolves story metadata from the core story index, imports the module on demand, selects either a named export or the first named function export, and re-imports when HMR announces a story-index change.

```jsx
export default function InlineStoryRenderer({ storyId, exportName }) {
  const [mod, setMod] = useState(null)
  const [error, setError] = useState(null)
  const [storyIndexKey, setStoryIndexKey] = useState(0)
  const [colorMode, setColorMode] = useState(() => resolveColorMode())
}
```

Key behavior:

- `resolveColorMode()` reads `data-color-mode` from `document.documentElement`, then falls back to `matchMedia`.
- `getStoryData(storyId)` supplies the `_storyImport()` function used for lazy loading.
- `storyboard:theme:changed` updates Primer color mode without remounting the widget shell.
- `storyboard:story-index-changed` bumps `storyIndexKey` so HMR can re-look up newly exported stories.
- Error states render inline diagnostic text for missing stories, missing exports, or failed imports.

```jsx
<ThemeProvider colorMode={colorMode}>
  <BaseStyles>
    <StoryErrorBoundary name={exportName || storyId} resetKey={`${storyId}:${exportName}:${storyIndexKey}`}>
      <Component />
    </StoryErrorBoundary>
  </BaseStyles>
</ThemeProvider>
```

## Dependencies

- `@primer/react` `ThemeProvider` and `BaseStyles` for theme-scoped story rendering.
- [`../../../core/index.js`](../../../core/index.js.md) for `getStoryData()` lookups.
- [`../StoryErrorBoundary.jsx`](../StoryErrorBoundary.jsx.md) to contain thrown story render errors.

## Dependents

- [`StoryWidget.jsx`](./StoryWidget.jsx.md) uses the inline path when canvas inline stories are enabled.
- [`InlineStoryRenderer.test.jsx`](./InlineStoryRenderer.test.jsx.md) verifies lookup, import, and HMR behavior.

## Notes

- Inline stories share the canvas URL hash, so hook-based Storyboard state is not isolated the way iframe rendering is.
- The file intentionally returns `null` while imports are pending instead of rendering an intermediate loader.
