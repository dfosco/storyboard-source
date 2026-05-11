# `packages/storyboard/src/internals/canvas/widgets/PromptWidget.jsx`

<!--
source: packages/storyboard/src/internals/canvas/widgets/PromptWidget.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

`PromptWidget.jsx` is the canvas-native "ask Copilot" widget. It captures a prompt, spawns a prompt agent through the canvas HTTP API, tracks execution status, and can optionally reveal a compact read-only terminal stream of the agent output.

Within the registry in [`index.js`](./index.js.md), this is the only widget that combines user-authored text entry with background agent orchestration. [`WidgetChrome.jsx`](./WidgetChrome.jsx.md) supplies copy/delete/expand-output actions while the widget manages execution state and terminal output.

## Composition

```jsx
const PromptWidget = forwardRef(function PromptWidget({ id, props, onUpdate, resizable }, ref) {
  const persistedText = readProp(props, 'text', promptSchema)
  const persistedStatus = readProp(props, 'status', promptSchema)
  const errorMessage = readProp(props, 'errorMessage', promptSchema)
})
```

Schema-backed props:

- `text` (`text`, default `""`)
- `status` (`text`, default `"idle"`)
- `sessionId` (`text`, default `""`)
- `resultWidgetId` (`text`, default `""`)
- `errorMessage` (`text`, default `""`)
- `connections` (`text`, default `""`)
- `width` (`number`, default `320`)
- `height` (`number`, default `180`)

Key state/effects:

- `draftText`, `execStatus`, `execError`, and `showOutput` drive the prompt lifecycle.
- `useWebGLSlot()` only requests a live slot while output is visible and the run is active.
- `import.meta.hot.on('storyboard:agent-status', …)` keeps widget status synchronized with runtime agent events.
- A Ghostty read-only terminal is mounted on demand for output streaming.

Imperative API used by [`WidgetChrome.jsx`](./WidgetChrome.jsx.md):

```jsx
handleAction('expand-output')
getState('showOutput' | 'hasSession')
```

## Dependencies

- [`widgetProps.js`](./widgetProps.js.md) for the prompt schema.
- Canvas HTTP endpoints for prompt spawn and terminal kill.
- `ghostty-web` and `WebGLContextPool.jsx` for the embedded output terminal.
- [`ResizeHandle.jsx`](./ResizeHandle.jsx.md) for widget sizing.

## Dependents

- Registered by [`index.js`](./index.js.md) as `prompt`.
- Canvas agent flows depend on its persisted `status` / `sessionId` fields.

## Notes

- This is the other widget the user explicitly flagged for `storyboard:agent-status` HMR subscriptions.
- Output rendering is intentionally read-only (`pointerEvents: 'none'`) so prompt widgets stay lightweight and don’t turn into full terminals.
