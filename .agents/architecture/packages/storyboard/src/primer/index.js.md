# `packages/storyboard/src/primer/index.js`

<!--
source: packages/storyboard/src/primer/index.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`index.js` is the public entry point for the package's Primer-specific helpers. It currently exists to provide a stable `@dfosco/storyboard/primer` export surface while keeping the implementation small and swappable.

By funnelling Primer integration through this file, consumers depend on one package subpath instead of reaching into individual modules. That leaves room for the Primer layer to grow without changing external imports.

## Composition

The file is intentionally tiny:

```js
export { default as ThemeSync } from './ThemeSync.jsx'
```

Today it re-exports only [`ThemeSync.jsx`](./ThemeSync.jsx.md), which bridges Storyboard theme state into Primer's theme system.

## Dependencies

- [`ThemeSync.jsx`](./ThemeSync.jsx.md) — exported as the public Primer bridge

## Dependents

- `@dfosco/storyboard/primer` consumers via the package export declared in `packages/storyboard/package.json`
- Any app code that wants a stable Primer-only import surface instead of importing [`ThemeSync.jsx`](./ThemeSync.jsx.md) directly

## Notes

- The file carries architectural weight mainly because `packages/storyboard/package.json` exposes `./primer` as a public subpath export.
