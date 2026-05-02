# Plan: "Open Terminal" — Convert Prompt Widget to Terminal Widget

## Problem

The "open-terminal" action in PromptWidget dispatches a `storyboard:expand-widget` custom event but nothing handles it. The desired behavior is: **replace the prompt widget with a terminal widget** in-place, keeping the same position, connections, and tmux session. This action is irreversible — undo history is cleared.

## Approach

The conversion keeps the **same widget ID** so the existing tmux session (keyed by widget ID) and canvas connectors (keyed by widget ID) remain valid. We change the widget's `type` from `prompt` → `terminal` and swap its props.

### 1. Materializer: `widget_type_changed` event

**File:** `packages/core/src/canvas/materializer.js`

Add a new event type between `widget_updated` and `widget_moved`:

```js
case 'widget_type_changed': {
  state.widgets = (state.widgets || []).map((w) =>
    w.id === evt.widgetId
      ? { ...w, type: evt.newType, props: evt.props ?? {} }
      : w,
  )
  break
}
```

Update the JSDoc event list at the top of the file.

### 2. Server: `POST /prompt/convert-to-terminal` endpoint

**File:** `packages/core/src/canvas/server.js`

Add a new route near the existing `POST /prompt/spawn` block. It:

1. Accepts `{ canvasId, widgetId }`
2. Finds the canvas file and reads current state
3. Finds the prompt widget by ID, validates it's type `prompt`
4. Reads prompt props to extract `sessionId` (tmux name) and `width`
5. Appends a `widget_type_changed` event:
   ```json
   {
     "event": "widget_type_changed",
     "timestamp": "...",
     "widgetId": "...",
     "newType": "terminal",
     "props": { "width": <from prompt>, "height": 300 }
   }
   ```
6. Pushes canvas update via HMR (`pushCanvasUpdate`)
7. Returns `{ success: true }`

No terminal config changes needed — the prompt spawn already wrote terminal config with this widget ID.

### 3. Client API helper

**File:** `packages/react/src/canvas/canvasApi.js`

Add:
```js
export function convertPromptToTerminal(canvasId, widgetId) {
  return request('/prompt/convert-to-terminal', 'POST', { name: canvasId, widgetId })
}
```

### 4. PromptWidget: wire the action

**File:** `packages/react/src/canvas/widgets/PromptWidget.jsx`

In the `handleAction('open-terminal')` branch:

1. Import `convertPromptToTerminal` from `canvasApi.js`
2. Call `convertPromptToTerminal(canvasId, id)` — this triggers an HMR push
3. The HMR update replaces the widget in `localWidgets`, which remounts it as a `TerminalWidget` (via the widget registry in `widgets/index.js`)
4. Remove the `storyboard:expand-widget` dispatch

### 5. Undo behavior

No changes to `useUndoRedo.js` needed. The conversion flows through the server → HMR path (not the optimistic local edit path), so `undoRedo.snapshot()` is never called. When the HMR update arrives, `CanvasPage` calls `undoRedo.reset()` (line 814), clearing all history. This means:

- The conversion itself is not in the undo stack
- Any prior undo history is also cleared (as the user requested: "if users want to undo actions before it, it's just skipped")

### 6. Materializer tests

**File:** `packages/core/src/canvas/materializer.test.js`

Add a test for `widget_type_changed`:
- Widget starts as `prompt` with prompt props
- After event, widget has type `terminal` with terminal props
- Position and ID are preserved
- Connectors referencing the widget are preserved

## Files to change

| File | Change |
|------|--------|
| `packages/core/src/canvas/materializer.js` | Add `widget_type_changed` case |
| `packages/core/src/canvas/materializer.test.js` | Add test for new event |
| `packages/core/src/canvas/server.js` | Add `POST /prompt/convert-to-terminal` |
| `packages/react/src/canvas/canvasApi.js` | Add `convertPromptToTerminal()` |
| `packages/react/src/canvas/widgets/PromptWidget.jsx` | Wire open-terminal to API call |

## Edge cases

- **No active session** — If the prompt is in `idle` state (no tmux session), the terminal widget will just create a new session on connect (standard TerminalWidget behavior). This is fine.
- **Widget not found** — Server returns 404, prompt shows error via existing error UI.
- **Connectors preserved** — Since the widget ID doesn't change, all connectors remain valid. The terminal config already has `connectedWidgets` from the spawn step.
