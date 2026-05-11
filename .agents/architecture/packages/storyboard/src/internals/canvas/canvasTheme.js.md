# `packages/storyboard/src/internals/canvas/canvasTheme.js`

<!--
source: packages/storyboard/src/internals/canvas/canvasTheme.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/internals/canvas/canvasTheme.js`](./canvasTheme.js.md) translates Storyboard’s canvas theme choice into Primer-compatible data attributes and canvas CSS variables. It is the normalization layer that keeps the canvas background, dots, borders, and foreground colors aligned with Primer themes.

## Composition

```js
export function getCanvasPrimerAttrs(theme) {
  const value = String(theme || 'light')
  if (value.startsWith('dark')) {
    return {
      'data-color-mode': 'dark',
      'data-dark-theme': value,
      'data-light-theme': 'light',
    }
  }
  return {
    'data-color-mode': 'light',
    'data-dark-theme': 'dark',
    'data-light-theme': value.startsWith('light') ? value : 'light',
  }
}
```

```js
const THEME_VARS = {
  light: { '--sb--canvas-bg': '#f6f8fa', … },
  dark: { '--sb--canvas-bg': '#151b23', … },
  dark_dimmed: { '--sb--canvas-bg': '#262c36', … },
}

export function getCanvasThemeVars(theme) {
  const value = String(theme || 'light')
  return THEME_VARS[value] || THEME_VARS.light
}
```

## Dependencies

This file is self-contained; it only depends on static theme tables.

## Dependents

- [`packages/storyboard/src/internals/canvas/CanvasPage.jsx`](./CanvasPage.jsx.md) uses both exports to theme the scroll surface and individual widget wrappers.
- `CanvasPage.bridge.test.jsx` verifies the mapping logic.

## Notes

- The explicit per-theme map avoids deriving colors on the fly, which keeps high-contrast and colorblind variants predictable.
