# `packages/storyboard/src/internals/canvas/widgets/PrototypeEmbed.test.jsx`

<!--
source: packages/storyboard/src/internals/canvas/widgets/PrototypeEmbed.test.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

Vitest test file covering `getEmbedChromeVars()` from [`embedTheme.js`](./embedTheme.js.md).

- Asserts the light theme returns the default white background token.
- Asserts the dark theme returns the dark canvas chrome background token.
- Asserts the `dark_dimmed` theme returns the dimmed toolbar background token.

## Composition

Test cases:

- follows toolbar theme variants for embed edit chrome

## Dependencies

- `vitest` for expectations.
- [`embedTheme.js`](./embedTheme.js.md) for the theme-token helper under test.

## Notes

- Despite the filename, this test currently covers embed theme token mapping rather than [`PrototypeEmbed.jsx`](./PrototypeEmbed.jsx.md) rendering.
