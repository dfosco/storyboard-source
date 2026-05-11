# `packages/storyboard/src/internals/canvas/widgets/TerminalReadWidget.jsx`

<!--
source: packages/storyboard/src/internals/canvas/widgets/TerminalReadWidget.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

`TerminalReadWidget.jsx` is the lightweight read-only terminal snapshot viewer. Instead of mounting a live websocket-backed Ghostty session like [`TerminalWidget.jsx`](./TerminalWidget.jsx.md), it fetches saved snapshot JSON and renders either ANSI-colored HTML or stripped plain text.

It appears in the registry in [`index.js`](./index.js.md) as `terminal-read`, and still benefits from surrounding selection chrome from [`WidgetChrome.jsx`](./WidgetChrome.jsx.md) when used on canvas.

## Composition

```jsx
export default function TerminalReadWidget({ id, props }) {
  const width = readProp(props, 'width', terminalSchema)
  const height = readProp(props, 'height', terminalSchema)
  const prettyName = props?.prettyName || '...'
}
```

Schema-backed props reused from the terminal schema:

- `private` (`boolean`, default `false`)
- `width` (`number`, default `800`)
- `height` (`number`, default `450`)

Key state/effects:

- `content`, `html`, and `failed` track fetch results.
- An effect probes multiple snapshot URLs, covering both dev and production paths plus legacy nested locations.
- A second effect autoscrolls the `<pre>` container to the bottom once content arrives.
- ANSI conversion is lazy-loaded through `import(/* @vite-ignore */ 'ansi-to-html')` and cached globally.

## Dependencies

- [`widgetProps.js`](./widgetProps.js.md) for terminal sizing defaults.
- Optional `ansi-to-html` conversion for colored output.
- Canvas bridge state for the current `canvasId`.

## Dependents

- Registered in [`index.js`](./index.js.md) as `terminal-read`.
- Usually created indirectly by canvas or runtime flows that need archived terminal output.

## Notes

- Snapshot loading is best-effort: if ANSI conversion fails, it falls back to stripped plain text instead of erroring.
- The widget does not subscribe to HMR agent-status events; it is a passive viewer, unlike [`TerminalWidget.jsx`](./TerminalWidget.jsx.md) and [`PromptWidget.jsx`](./PromptWidget.jsx.md).
