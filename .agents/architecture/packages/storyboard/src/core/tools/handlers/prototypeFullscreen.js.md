# `packages/storyboard/src/core/tools/handlers/prototypeFullscreen.js`

<!--
source: packages/storyboard/src/core/tools/handlers/prototypeFullscreen.js
category: core-tools
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

This handler is a keyboard-oriented bridge between toolbar command plumbing and canvas behavior. It does not render UI; instead it exposes a single `toggle()` action that dispatches `storyboard:canvas:prototype-fullscreen`, which [`packages/storyboard/src/internals/canvas/CanvasPage.jsx`](../../../../../../../../packages/storyboard/src/internals/canvas/CanvasPage.jsx) listens for.

## Composition

```js
export const id = 'prototype-fullscreen'

export async function handler() {
  return {
    toggle() {
      document.dispatchEvent(new CustomEvent('storyboard:canvas:prototype-fullscreen'))
    },
  }
}
```

The exported object is intentionally tiny because fullscreen state management belongs to the canvas page, not the tool module.

## Dependencies

- No imports; it communicates entirely through a document-level custom event.

## Dependents

- [`packages/storyboard/src/internals/canvas/CanvasPage.jsx`](../../../../../../../../packages/storyboard/src/internals/canvas/CanvasPage.jsx) listens for the event this handler dispatches.
- [`packages/storyboard/src/core/ui/CoreUIBar.jsx`](../../../../../../../../packages/storyboard/src/core/ui/CoreUIBar.jsx) also dispatches the same event for keyboard shortcut handling.

## Notes

Handler modules in this folder follow the declarative tools contract from the tools skill: they may export `id`, `component`, `handler`, `setup`, and `guard`, and `CoreUIBar` composes whichever members are present for the configured render type.
