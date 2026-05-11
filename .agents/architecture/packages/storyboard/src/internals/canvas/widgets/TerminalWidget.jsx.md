# `packages/storyboard/src/internals/canvas/widgets/TerminalWidget.jsx`

<!--
source: packages/storyboard/src/internals/canvas/widgets/TerminalWidget.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

`TerminalWidget.jsx` is the live canvas terminal/agent implementation. It mounts a Ghostty WebGL terminal, connects it to the runtime websocket session endpoint, coordinates with the WebGL slot pool, and can expand into single or split-screen panes.

This is one of the most stateful widgets in [`index.js`](./index.js.md). [`WidgetChrome.jsx`](./WidgetChrome.jsx.md) provides the toolbar shell, but this file owns the actual session lifecycle, frozen/live switching, HMR agent-status updates, alias editing, and split-screen terminal registry.

## Composition

```jsx
export default forwardRef(function TerminalWidget({ id, props, onUpdate, multiSelected }, ref) {
  const agentId = props?.agentId || null
  const dims = getTerminalDimensions(agentId, { width, height })
  const [expandedOverride, setExpandedOverride] = useOverride(`_terminal_expanded_${id}`)
}
```

Schema-backed props used here:

- `private` (`boolean`, default `false`)
- `width` (`number`, default `800`)
- `height` (`number`, default `450`)
- plus runtime props such as `alias`, `prettyName`, `startupCommand`, `role`, and `status`

Key state/effects:

- WebGL pool state comes from `useWebGLSlot()`; frozen terminals render [`FrozenTerminalOverlay.jsx`](./FrozenTerminalOverlay.jsx.md) until activated.
- Websocket + Ghostty setup happens only while the widget has a live slot.
- `expandedOverride` persists `single`/`split` expansion in the URL hash.
- `storyboard:agent-status` HMR events update persisted widget status for agent terminals.
- Interactive mode exits on outside click or multiselect.
- Resize effects recompute rows/cols and notify the websocket.

Important runtime helpers:

```jsx
const terminalRegistry = new Map()
import.meta.hot.on('storyboard:agent-status', handler)
ws.send(JSON.stringify({ type: 'resize', cols, rows }))
```

## Dependencies

- [`widgetProps.js`](./widgetProps.js.md) for schema reads.
- `core/index.js` for terminal config + authoritative dimensions.
- `ghostty-web` via dynamic import, with graceful fallback if unavailable.
- `useOverride()`, [`ExpandedPane.jsx`](./ExpandedPane.jsx.md), `expandUtils.js`, and `WebGLContextPool.jsx`.
- [`WidgetChrome.jsx`](./WidgetChrome.jsx.md) for actions like expand, privacy, and hub-role selection.

## Dependents

- Registered in [`index.js`](./index.js.md) as both `terminal` and `agent`.
- Used by `expandUtils.js` when building split panes.
- Canvas terminal orchestration in [`CanvasPage.jsx`](../CanvasPage.jsx.md) depends on its status props and widget ref actions.

## Notes

- The file intentionally exposes `window.__storyboardTerminalRegistry` so split-screen panes can resize or locate live terminals by widget id.
- Agent status HMR is a documented contract here; this is one of the widgets the user explicitly asked to call out.
