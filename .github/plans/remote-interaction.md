# Remote Interaction — Participant Write-Back & `remoteInteraction` Config

Extends the [Rooms plan](./rooms.md) Phase C (Canvas editing) to allow
participants to perform **any operation the host can do** — including writing to
the filesystem, adding/removing widgets, sending keystrokes to host terminals,
and submitting prompt widgets — gated by a new `remoteInteraction` flag in
`widgets.config.json` (default: `false`).

> **Depends on:** Rooms plan Phases A–C implemented.

---

## Table of Contents

1. [Problem statement](#1-problem-statement)
2. [`remoteInteraction` config prop](#2-remoteinteraction-config-prop)
3. [Remote action relay architecture](#3-remote-action-relay-architecture)
4. [Focus-free execution requirement](#4-focus-free-execution-requirement)
5. [Host-side action handlers](#5-host-side-action-handlers)
6. [Revised `roomWriteGuard`](#6-revised-roomwriteguard)
7. [Security model](#7-security-model)
8. [New files & touch points](#8-new-files--touch-points)
9. [Widget config changes](#9-widget-config-changes)
10. [Phased rollout](#10-phased-rollout)

---

## 1. Problem statement

The original Rooms plan hard-codes a blocklist in `roomWriteGuard` (§9 of
`rooms.md`) that prevents participants from:
- Sending keystrokes to terminal widgets
- Submitting prompt widgets
- Adding or removing any widget

These were blocked because they require server-side execution (PTY processes,
filesystem writes) that the participant's browser cannot access directly.

**This plan removes those blanket blocks** and replaces them with a
configuration-driven opt-in system (`remoteInteraction`) while preserving the
host's ability to selectively deny any action. All remote actions are relayed
through the host's Node.js process and executed **without stealing focus** from
the host's browser.

---

## 2. `remoteInteraction` config prop

### Placement — analogous to `prod`

`remoteInteraction` is added at the **same level as `prod`** on each feature
entry in `widgets.config.json`:

```jsonc
// packages/core/widgets.config.json
{
  "widgets": {
    "terminal": {
      "features": [
        {
          "id": "send-keys",
          "type": "action",
          "action": "send-keys",
          "label": "Send keystrokes",
          "icon": "terminal",
          "remoteInteraction": false   // ← default: blocked for remote participants
        },
        {
          "id": "delete",
          "type": "action",
          "action": "delete",
          "label": "Delete",
          "icon": "trash",
          "menu": true,
          "remoteInteraction": false
        }
      ]
    }
  }
}
```

**Default:** when `remoteInteraction` is omitted, it is treated as `false`
(blocked). A host who wants participants to be able to send keystrokes to a
terminal explicitly sets `remoteInteraction: true` for that feature.

Additionally, the `resize` and top-level canvas actions (`addWidget`,
`removeWidget`, `settings_updated`) each get a `remoteInteraction` field at
the appropriate level (see §9).

### `getFeatures` guard

`widgetConfig.js`'s `getFeatures(type)` gains a new mode:

```js
export function getFeatures(type, { remote = false } = {}) {
  const features = widgetTypes[type]?.features ?? []
  if (import.meta.env?.PROD) {
    return features.filter(f => f.prod)
  }
  if (remote) {
    return features.filter(f => f.remoteInteraction)
  }
  return features
}
```

Similarly, `isResizable(type, { remote })` returns `false` when
`resize.remoteInteraction` is falsy and `remote` is `true`.

### Canvas-level remote gates

Top-level canvas operations (add widget, remove widget, settings update) are
gated by a new `remoteInteraction` block in `storyboard.config.json`'s rooms
section (see §6):

```jsonc
// storyboard.config.json
{
  "rooms": {
    "canvasEdit": {
      "allowByDefault": false,
      "remoteInteraction": {
        "addWidget":         false,  // default: blocked
        "removeWidget":      false,  // default: blocked
        "settingsUpdate":    false   // default: blocked
      }
    }
  }
}
```

---

## 3. Remote action relay architecture

Participants cannot call the host's Vite dev server APIs directly (different
browser contexts / potentially different origins). All participant-initiated
actions that require server-side execution are **relayed through the Y.Doc**
and **executed by the host's Node.js process**.

### New Y.Doc structure — `remote-actions` channel

```
Y.Doc
 └── canvas:{canvasName}      (existing)
 └── remote-actions           (Y.Array — append-only log)
      └── { id, type, payload, participantId, ts }
```

`remote-actions` is a `Y.Array`. Participants append ops; the host observes the
array and executes each new entry exactly once (tracked by `id`).

### Message types

| `type` | `payload` | Requires `remoteInteraction` |
|---|---|---|
| `terminal-send-keys` | `{ widgetId, data: string }` | feature `send-keys` on `terminal` widget |
| `prompt-submit` | `{ widgetId, prompt: string }` | feature `submit` on `prompt` widget |
| `canvas-add-widget` | `{ widgetType, x, y, props }` | `rooms.canvasEdit.remoteInteraction.addWidget` |
| `canvas-remove-widget` | `{ widgetId }` | `rooms.canvasEdit.remoteInteraction.removeWidget` |
| `canvas-settings-update` | `{ settings }` | `rooms.canvasEdit.remoteInteraction.settingsUpdate` |
| `widget-action` | `{ widgetId, action, args }` | feature `remoteInteraction` on that feature |

Position/resize/prop edits continue to go through the existing CRDT Y.Map path
(already implemented in Phase C). Only **imperative actions** that require
server-side side-effects go through `remote-actions`.

### Host-side relay handler

```js
// packages/core/src/rooms/remoteActionRelay.js
//
// Called from useCanvasRoom on the host's client.
// Observes the Y.Array and dispatches to server-side handlers.

export function createRemoteActionRelay({ ydoc, roomSession, config, canvasName }) {
  const executed = new Set()   // idempotency guard (survives same Y.Doc session)
  const actions = ydoc.getArray('remote-actions')

  actions.observe(() => {
    for (const op of actions.toArray()) {
      if (executed.has(op.id)) continue
      executed.add(op.id)
      executeRemoteOp(op, config, canvasName)
    }
  })
}
```

`executeRemoteOp` calls the appropriate server API route — it does NOT interact
with the DOM at all (see §4 and §5).

### Participant-side dispatch

Participants use `dispatchRemoteAction(ydoc, op)` to append to `remote-actions`:

```js
export function dispatchRemoteAction(ydoc, op) {
  const actions = ydoc.getArray('remote-actions')
  ydoc.transact(() => {
    actions.push([{ ...op, id: crypto.randomUUID(), ts: Date.now() }])
  })
}
```

The UI for each action (e.g., a terminal keystroke input field, the add-widget
menu) calls `dispatchRemoteAction` instead of the local API when `isParticipant`
is true.

---

## 4. Focus-free execution requirement

**Remote interaction sent to the host's canvas and widgets MUST NOT produce or
change focus on the host's browser.** The host must remain able to work normally
while participants interact with their canvas.

### Rules for host-side action execution

1. **No `.focus()` calls** — none of the server-side handlers call any DOM focus
   method. Actions go directly to Node.js APIs.

2. **Terminal keystrokes → PTY only** — `terminal-send-keys` is implemented as
   a new server route `POST /_storyboard/terminal/send-keys` that calls
   `tmux send-keys -t <sessionId> <data>` directly via the Node.js child_process
   API. It never interacts with the browser terminal widget's `<xterm>` DOM
   element.

3. **Widget add/remove → canvas server only** — `canvas-add-widget` calls
   `POST /_storyboard/canvas/widget` (existing route). The host's CanvasPage
   receives the state change via HMR / Y.Doc sync, not via a DOM dispatch. The
   `storyboard:canvas:add-widget` CustomEvent (used by the toolbar) is
   explicitly **not** fired for remote adds.

4. **Prompt submit → agent runner only** — `prompt-submit` calls the existing
   prompt execution API, bypassing any focus on the prompt widget's `<textarea>`.

5. **No active selection changes** — the host's `document.activeElement` is
   never modified as a side-effect of any remote action.

---

## 5. Host-side action handlers

### New server route: `POST /_storyboard/terminal/send-keys`

```
Request body:
  { sessionId: string, data: string }

Behaviour:
  1. Validate sessionId exists in the terminal server's session registry.
  2. Call: tmux send-keys -t <sessionId> <data> (direct PTY inject, no focus)
  3. Return 204 on success, 404 if session not found, 403 if caller is not host.
```

The terminal server (`terminal-server.js`) gains a `sendKeysToSession(sessionId, data)`
export that the route handler calls. This is the same mechanism agents already
use internally.

### Canvas add/remove routes (existing, now callable by relay)

`POST /_storyboard/canvas/widget` and `DELETE /_storyboard/canvas/widget` already
exist. The relay handler calls these directly via `fetch` within the host's
Node.js process (loopback).

### Prompt submit route (existing, now callable by relay)

The existing prompt submission mechanism receives the `widgetId` and `prompt`
and executes the agent. No new route needed — the relay calls the existing
internal agent runner.

---

## 6. Revised `roomWriteGuard`

The original guard in `roomWriteGuard.js` (rooms.md §9) is replaced with a
config-driven approach:

```js
// packages/core/src/rooms/roomWriteGuard.js

/**
 * Returns true if a given operation is allowed for a remote participant.
 *
 * @param {object} op           - The operation to check
 * @param {string} op.type      - Op type: 'widget-action', 'canvas-add-widget', etc.
 * @param {string} op.widgetType - Widget type (for widget-level ops)
 * @param {string} op.featureId  - Feature id (for widget-action ops)
 * @param {object} config        - Resolved rooms config
 * @param {object} widgetTypes   - Resolved widgetTypes from widgetConfig.js
 */
export function isRemoteOpAllowed(op, config, widgetTypes) {
  switch (op.type) {
    case 'widget-action': {
      const feature = widgetTypes[op.widgetType]?.features
        ?.find(f => f.id === op.featureId)
      return feature?.remoteInteraction === true
    }
    case 'canvas-add-widget':
      return config?.rooms?.canvasEdit?.remoteInteraction?.addWidget === true
    case 'canvas-remove-widget':
      return config?.rooms?.canvasEdit?.remoteInteraction?.removeWidget === true
    case 'canvas-settings-update':
      return config?.rooms?.canvasEdit?.remoteInteraction?.settingsUpdate === true
    // Position/resize/prop edits are governed by the existing CRDT write guard.
    default:
      return false
  }
}
```

This guard is applied **twice**:
- **Participant-side** — before dispatching to `remote-actions` (fast-fail, no
  network round-trip for blocked ops).
- **Host-side** — before executing each op from the `remote-actions` array
  (defence-in-depth; a participant who bypasses the client guard has ops silently
  dropped by the host).

---

## 7. Security model

| Threat | Mitigation |
|---|---|
| Participant appends unauthorized `remote-actions` entries | Host guard (`isRemoteOpAllowed`) drops ops where `remoteInteraction` is falsy. |
| Participant fabricates a `terminal-send-keys` for a terminal they shouldn't access | The terminal server validates `sessionId` exists and belongs to the current canvas. |
| Participant sends malicious keystrokes to a terminal when `remoteInteraction` is true | This is an **explicit host opt-in**. The host is responsible; the UI makes the risk visible ("Remote keystrokes enabled"). |
| `remote-actions` replay on reconnect | `executed` Set on host relay is per-session. On reconnect, the Y.Doc state is re-synced; the relay skips already-executed IDs (stored in `sessionStorage` on host). |
| Prompt widget submits dangerous commands | Same risk model as terminal. Explicit opt-in, host is responsible. |

---

## 8. New files & touch points

### New files

| Path | Purpose |
|---|---|
| `packages/core/src/rooms/remoteActionRelay.js` | Host-side relay: observes `remote-actions` Y.Array, applies guard, dispatches to server APIs |
| `packages/core/src/rooms/dispatchRemoteAction.js` | Participant-side: append op to `remote-actions` Y.Array with idempotency ID |
| `packages/core/src/rooms/remoteInteractionGuard.js` | `isRemoteOpAllowed()` — pure, used client-side and host-side |

### Modified files

| File | Change |
|---|---|
| `packages/core/widgets.config.json` | Add `remoteInteraction` field to each feature entry (default `false`); add `remoteInteraction` to each `resize` block (default `false`) |
| `packages/react/src/canvas/widgets/widgetConfig.js` | `getFeatures(type, { remote })` and `isResizable(type, { remote })` — add `remote` mode |
| `packages/core/src/rooms/roomWriteGuard.js` | Replace hard-coded blocklist with `isRemoteOpAllowed()` calls |
| `packages/react/src/rooms/useCanvasRoom.js` | Initialise `remoteActionRelay` when `isHost`; call `dispatchRemoteAction` when `isParticipant` and action requires server execution |
| `packages/react/src/canvas/CanvasPage.jsx` | Pass `remote` flag to `getFeatures`/`isResizable` when rendering participant toolbar; wire terminal/prompt widget toolbars to `dispatchRemoteAction` when `isParticipant` |
| `packages/core/src/canvas/server.js` | Add `POST /_storyboard/terminal/send-keys` route; add `allowRemote` validation layer |
| `packages/core/src/canvas/terminal-server.js` | Export `sendKeysToSession(sessionId, data)` (focus-free PTY inject via `tmux send-keys`) |
| `storyboard.config.json` | Add `rooms.canvasEdit.remoteInteraction` block with defaults |

---

## 9. Widget config changes

### `widgets.config.json` — default `remoteInteraction` values

All existing widgets keep `remoteInteraction: false` on all features by default.
The host opts-in feature-by-feature.

The following additions are made to the config for completeness (new widgets
only listed here; all existing widgets get `remoteInteraction: false` throughout):

```jsonc
// New widget types needed for terminal + prompt to appear in config:
"terminal": {
  "label": "Terminal",
  "icon": "🖥",
  "resize": { "enabled": true, "prod": false, "remoteInteraction": false },
  "features": [
    { "id": "send-keys", "type": "action", "action": "send-keys",
      "label": "Send keystrokes", "icon": "terminal",
      "remoteInteraction": false },   // opt-in: host sets to true
    { "id": "delete",    "type": "action", "action": "delete",
      "label": "Delete", "icon": "trash", "menu": true,
      "remoteInteraction": false }
  ]
},
"prompt": {
  "label": "Prompt",
  "icon": "💬",
  "resize": { "enabled": false, "prod": false, "remoteInteraction": false },
  "features": [
    { "id": "submit", "type": "action", "action": "submit",
      "label": "Submit prompt", "icon": "play",
      "remoteInteraction": false },   // opt-in
    { "id": "delete", "type": "action", "action": "delete",
      "label": "Delete", "icon": "trash", "menu": true,
      "remoteInteraction": false }
  ]
}
```

Existing widgets (sticky-note, markdown, prototype, etc.) get
`"remoteInteraction": false` added to each feature. No semantic change from the
current blocked-by-default behaviour — the diff is purely additive.

---

## 10. Phased rollout

### Phase RI-1 — Config infrastructure

- Add `remoteInteraction` to all feature entries in `widgets.config.json`
  (all `false`).
- Update `getFeatures` and `isResizable` in `widgetConfig.js` to accept
  `{ remote }` option.
- Add `isRemoteOpAllowed()` pure function.
- Replace the hard-coded `roomWriteGuard.js` blocklist with `isRemoteOpAllowed`.
- Update `storyboard.config.json` rooms block with `remoteInteraction` defaults.

No behaviour change from user perspective — everything is still blocked by
default.

### Phase RI-2 — Remote action relay (CRDT channel)

- Add `remote-actions` Y.Array to the Y.Doc structure.
- Implement `dispatchRemoteAction.js` (participant side).
- Implement `remoteActionRelay.js` (host side): observe array, apply guard, call server APIs.
- Wire into `useCanvasRoom`.
- Participant UI dispatches via relay for: add-widget, remove-widget,
  settings-update.

### Phase RI-3 — Terminal & prompt remote interaction

- Add `POST /_storyboard/terminal/send-keys` route (focus-free PTY inject).
- Export `sendKeysToSession` from `terminal-server.js`.
- Wire terminal widget toolbar: participant uses `dispatchRemoteAction({ type: 'terminal-send-keys', ... })`.
- Wire prompt widget toolbar: participant uses `dispatchRemoteAction({ type: 'prompt-submit', ... })`.
- Update participant canvas toolbar to show terminal/prompt actions when
  `remoteInteraction: true` in config.

### Phase RI-4 — Host opt-in UX

- Room manage panel: "Remote interaction" section shows a list of widget types
  with their `remoteInteraction` settings. Host can toggle per-feature at
  runtime (written to `storyboard.config.json` via a new Vite route).
- Warning indicator when any `remoteInteraction` feature is enabled: tooltip
  explains the risk.
