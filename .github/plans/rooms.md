# Rooms — Multiplayer Sessions for Storyboard

Live collaborative sessions on top of the existing `room-mates` + Y.js layer.
Hosts open a room; participants automatically join, see each other's cursors,
can be led through the prototype by the host ("follow me"), and — when the host
enables it — can co-edit canvas widgets with CRDT-backed conflict resolution.

> **Depends on:** `room-mates` 0.1.x (already in the monorepo),
> `realtime-and-hash-history.md` foundations (Y.js transport, awareness shape).
> Canvas CRDT section of this plan subsumes Phase 3 of that plan.

---

## Table of Contents

1. [Mental model & roles](#1-mental-model--roles)
2. [Room types — open vs. closed](#2-room-types--open-vs-closed)
3. [Pretty-name endpoint](#3-pretty-name-endpoint)
4. [Room lifecycle](#4-room-lifecycle)
5. [Awareness — cursors & presence](#5-awareness--cursors--presence)
6. [Follow-me mode](#6-follow-me-mode)
7. [Canvas editing in rooms](#7-canvas-editing-in-rooms)
8. [CRDT design for canvas widgets](#8-crdt-design-for-canvas-widgets)
9. [Widget write-guard rules](#9-widget-write-guard-rules)
10. [Persistence — host-side and participant-side](#10-persistence--host-side-and-participant-side)
11. [Room UI surface](#11-room-ui-surface)
12. [Configuration](#12-configuration)
13. [New files & touch points](#13-new-files--touch-points)
14. [Phased rollout](#14-phased-rollout)
15. [Open questions](#15-open-questions)

---

## 1. Mental model & roles

| Role | How acquired | Capabilities |
|---|---|---|
| **Host** | Opens a room via the workshop/toolbar | Full canvas edit, follow-me broadcast, can close the room |
| **Participant** | Joins via URL (open room) or `?room=<name>` (closed room) | Cursor visible, can follow host, canvas edit gated on host permission |
| **Viewer** | Future / read-only variant | Cursor + presence only, no canvas edit |

A room is scoped to a **single Storyboard instance** (the running dev server or
branch deploy). Rooms do not persist across server restarts.

---

## 2. Room types — open vs. closed

### Open room

- Host opens a room; **all visitors to the same instance URL are auto-joined**.
- Room membership is detected by the presence of a `?openRoom=<roomId>` search
  param that the host's instance appends to the canonical URL.  
  When a visitor loads any prototype URL that carries `?openRoom=<roomId>` (e.g.,
  via a share link or because the host's URL is the team bookmark), they join
  automatically.
- An open room is also announced over a `BroadcastChannel('sb-rooms')` so other
  tabs on the same origin join without needing the `?openRoom` param.

### Closed room

- Host picks (or is assigned) a **pretty name** from the 100-name JSON list (see
  §3).
- Participants join only if their URL contains `?room=<pretty-name>`.
- The host's share link looks like:
  `https://instance.example.com/storyboard/MyPrototype?room=purple-iguana-42`
- Pretty names are stable per session: the host can share the link ahead of time.

### Room ID vs. pretty name

```
roomId    = UUID v4 (used as y-webrtc room name, never shown in UI except in debug)
prettyName = e.g. "purple-iguana-42" (shown in UI, used in ?room= param)
```

The mapping `prettyName → roomId` is held only by the host in their
`localStorage` under `sb-room-session` and broadcast to joiners via the initial
awareness ping (so joiners get the real roomId without it being guessable from
the URL).

> **Security note:** closed rooms are not cryptographically access-controlled —
> they rely on the obscurity of the pretty name + room ID. For production use the
> `y-webrtc` `password` option (see §12) adds AES-GCM encryption on top.

---

## 3. Pretty-name endpoint

A static JSON file published at a well-known path serves a pre-defined pool of
100 room names. Clients pick from this list at random when opening a closed room.

**File location:** `public/storyboard/room-names.json`

**Format:**
```json
{
  "version": 1,
  "names": [
    "amber-falcon-17",
    "blue-otter-42",
    "crimson-lynx-08",
    ...
  ]
}
```

Names follow the pattern `<adjective>-<animal>-<2-digit-number>`. The full list
of 100 names is generated once and committed; it never changes at runtime.

**Fetch path (branch-deploy aware):**
```js
const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
fetch(`${base}/storyboard/room-names.json`)
```

The host's browser fetches the list on room creation, picks a random unused name
(filtered against `localStorage`'s recent-rooms list), and persists the chosen
name for the session.

---

## 4. Room lifecycle

```
Host                                  Participant
 │                                        │
 │  openRoom({ type, canvasEdit })        │
 │──────────────────────────────────┐     │
 │  • generateRoomId()              │     │
 │  • pick prettyName (closed)      │     │
 │  • persist to localStorage       │     │
 │  • createSession(room=roomId)     │     │
 │  • set awareness.role = 'host'   │     │
 │  • append ?openRoom= or copy     │     │
 │    share link                    │     │
 │◄─────────────────────────────────┘     │
 │                                        │
 │                     load URL with ?room= or ?openRoom=
 │                      ◄──────────────────────────────│
 │                                        │
 │                         resolveRoomId(prettyName) ──► host awareness
 │                                        │
 │                         createSession(room=roomId)
 │                         set awareness.role = 'participant'
 │◄────────────────── awareness sync ────►│
 │                                        │
 │ closeRoom()                            │
 │  • awareness.setLocalState(null)       │
 │  • session.destroy()                   │
 │  • remove ?openRoom= from URL          │
 │                              ◄── disconnected ──────│
```

### `resolveRoomId(prettyName)` race

When a participant loads and sees `?room=purple-iguana-42` they do not yet know
the roomId. Resolution:

1. The participant joins a **well-known bootstrap room** named
   `sb-bootstrap-{prototypeSlug}` and publishes:
   `{ type: 'resolve-room', prettyName }`.
2. The host (who is already in the bootstrap room) replies with
   `{ type: 'room-resolved', prettyName, roomId }`.
3. Participant destroys the bootstrap session and creates the real one.
4. Bootstrap rooms have a 30-second TTL on the host side; if no resolution in
   10 s the participant shows an error ("Room not found — check your link").

For **open rooms** the roomId is embedded directly in `?openRoom=<roomId>` so
no resolution step is needed.

---

## 5. Awareness — cursors & presence

Builds directly on `room-mates` `cursorsPlugin` and `y-protocols/awareness`.

### Awareness state shape (full)

```js
{
  user:    { id, name, color },          // stable identity from localUser.js
  role:    'host' | 'participant',
  cursor:  { x, y, a } | null,          // page-space coords, opacity
  sparkle: { x, y, t } | null,
  route:   '/MyPrototype/Settings',      // current pathname + hash
  viewport: {                            // scroll + zoom, ALL page types
    scrollX:   number,                   // window.scrollX  (prototype pages)
    scrollY:   number,                   // window.scrollY  (prototype pages)
    scrollLeft: number,                  // canvas container scroll (canvas pages)
    scrollTop:  number,                  // canvas container scroll (canvas pages)
    zoom:       number,                  // canvas zoom % (canvas pages only; 100 otherwise)
    pageType:   'prototype' | 'canvas',  // so receivers know which fields to use
  } | null,
  hash:     string | null,               // current URL hash (session overrides) for all pages
  following: string | null,              // clientId being followed, or null
}
```

The `cursorsPlugin` already handles cursor rendering. Route, viewport, and hash
fields are added by the new `roomPlugin` (see §13).

### Presence bar

A compact horizontal strip at the top of every page (outside the prototype
iframe) shows avatar dots for each participant. Clicking a dot opens a small
popover with name, current route, and a "Follow" button.

---

## 6. Follow-me mode

### Host side

The host's `viewport`, `route`, and `hash` are published to awareness on every:
- `hashchange` / React Router navigation → updates `route` and `hash`
- `scroll` on `window` (prototype pages) → updates `viewport.scrollX/Y`
- canvas container scroll (canvas pages) → updates `viewport.scrollLeft/Top`
- canvas zoom change → updates `viewport.zoom`

All viewport events are throttled to ~30 Hz before writing to awareness.

### Participant side

A participant enters follow-me by clicking "Follow [Host Name]" in the presence
bar or from the participant's own toolbar button.

While following:
1. **Route sync** — when the host's `awareness.route` changes, the participant's
   React Router navigates to that route (`router.navigate(route)`).
2. **Hash/override sync** — when the host's `awareness.hash` changes, the
   participant's URL hash is updated to match, broadcasting the same session
   overrides (theme, active tab, etc.) to every follower. The write is made
   via `setParam` with a `{ remote: true }` flag so it does not re-broadcast
   and is tagged as `source: 'remote'` in session history.
3. **Viewport sync — prototype pages** — when `pageType === 'prototype'`, the
   participant's `window.scrollTo(scrollX, scrollY)` is called.
   - A `scroll` event fired by this imperative call is suppressed (flag guard)
     so it does not re-broadcast and does not auto-eject.
4. **Viewport sync — canvas pages** — when `pageType === 'canvas'`, the
   participant's canvas `scrollLeft`, `scrollTop`, and `zoom` are updated.
   - Scroll is applied via `canvasRef.current.scrollTo(...)` inside `CanvasPage`.
   - Zoom is updated via the existing `setZoom` callback.
5. **Updates are throttled** to the awareness update rate (~30 Hz); the UI
   applies them with a short CSS transition (100 ms) so the experience isn't
   jarring.
6. **Eject** — the participant can stop following at any time by:
   - Clicking "Stop following" in the toolbar
   - Scrolling manually (a native `wheel` or touch event on any page, or a
     `pointerdown` on the canvas surface, detects manual intent and auto-ejects)
   - Pressing `Escape`
   Once ejected, `following` is set to `null` in awareness; the host's UI
   shows the participant has ejected (avatar dot goes grey).

---

## 7. Canvas editing in rooms

Canvas editing in a room is an **opt-in** host capability: the host chooses
when opening or from the room settings panel whether participants can edit the
canvas. Default: **off**.

When `canvasEdit: false`:
- Participants see remote cursors on the canvas.
- Participants cannot drag, resize, or interact with widgets.
- The canvas toolbar is hidden for participants.

When `canvasEdit: true`:
- Each participant gets a full canvas toolbar (with restricted actions — see §9).
- Edits are broadcast via CRDT (see §8) and rendered live for all participants.
- The host's canvas is the "source of truth" for persistence.

---

## 8. CRDT design for canvas widgets

Reference: [Figma's CRDT approach](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/)

### Document structure

One Y.Doc per room, shared across all participants (already the room-mates
model). A new sub-map within the doc:

```
Y.Doc
 └── canvas:{canvasName}  (Y.Map)
      └── widgets         (Y.Map<widgetId, Y.Map<propKey, value>>)
           ├── "widget-abc"  (Y.Map)
           │    ├── x: 100
           │    ├── y: 200
           │    ├── width: 400
           │    ├── height: 300
           │    └── props.label: "Hello"
           └── "widget-xyz"  (Y.Map)
                └── ...
```

**Widget presence/absence:** tracked in a separate `Y.Array` named
`canvas:{canvasName}/order` — an ordered list of widget IDs. Adding a widget
appends to this array; removing deletes both the array entry and the Y.Map.

### Conflict resolution strategy

| Operation | Resolution |
|---|---|
| Concurrent position moves | Last-writer-wins (Y.Map LWW per key) — matches Figma's approach; the most recently moved widget "wins". |
| Concurrent resize | Same LWW — the last resize wins. |
| Concurrent prop edit | LWW per prop key — fine-grained; editing `.label` and `.color` at the same time on two clients both land. |
| Concurrent add | Both widgets land — order determined by `Y.Array` insertion order (CRDT-stable). |
| Concurrent delete | The delete wins over concurrent edits (standard CRDT tombstone). |
| Widget type change | Not allowed — enforced by write guard (§9). |

### Integration with `CanvasPage`

New hook: `useCanvasRoom(canvasName, roomSession)`

```js
const { applyRemoteOp, broadcastOp } = useCanvasRoom(canvasName, session)
```

- **Local edits → CRDT:** Every canvas mutation (drag, resize, prop change) that
  goes through `updateCanvas` / `addWidget` / `removeWidget` is *also* applied
  to the Y.Map. The existing debounced `updateCanvas` call (to the file server)
  is preserved; it fires after remote ops settle.
- **Remote CRDT → canvas state:** Y.Map `observe` events apply the delta to the
  local React canvas state via the existing `useCanvas` reducer (same code path
  as a local edit, tagged with `{ remote: true }` to skip re-broadcasting).
- **Cold start:** On join, the room session syncs the Y.Doc state from the host
  via y-webrtc. If the participant joins before any CRDT state exists (first
  opener), the canvas state is bootstrapped from the server-fetched `.canvas.json`.
- **Host flush:** The host (and only the host) flushes CRDT state back to disk
  via `updateCanvas` after a debounce of ~2 s of idle CRDT activity. Other
  participants do not call the write API.

### CRDT-to-localStorage mirror (participant persistence)

Participants cannot write to the host's file system. Their in-session changes
are persisted locally so a page reload doesn't wipe their view:

- Key: `sb-room-canvas:{roomId}:{canvasName}`
- Value: Y.Doc binary snapshot (`Y.encodeStateAsUpdate(doc)`)
- Written: every ~5 s of activity (debounced)
- Read: on re-join if the roomId matches the one in `?room=` / `?openRoom=`
- Evicted: when the room closes or after 24 h

---

## 9. Widget write-guard rules

All participants' canvas edits pass through a client-side `roomWriteGuard`
before being applied to the CRDT. Blocked operations silently no-op (no error,
no toast — the widget just doesn't move / change).

### Blocked operations

| Guard | Reason |
|---|---|
| `widget.type === 'terminal'` — any edit | Terminal sessions are server processes; remote widget interaction would send keystrokes to the host's terminal. |
| `widget.type === 'prompt'` — any edit | Same as terminal — prompt agents execute server-side. |
| `addWidget(...)` | Adding widgets requires source-code generation (the scaffold tool writes JSX to disk). Remote clients cannot trigger that. |
| `removeWidget(id)` where `widget.type === 'terminal' \|\| 'prompt'` | Same as above — server-side resource. |
| `settings_updated` | Canvas-level settings (name, background, grid) are host-only. |
| `source_updated` | Source imports require disk writes. |

### Allowed operations (participants)

- Move any non-terminal / non-prompt widget (`widget_moved`)
- Resize any non-terminal / non-prompt widget
- Edit any prop on non-terminal / non-prompt widgets (`widget_updated`)

The write guard is enforced **both client-side** (before broadcasting) and
**host-side** (before applying remote ops to the server flush). A participant
who modifies the CRDT through dev tools will have those ops silently dropped
when the host processes them.

---

## 10. Persistence — host-side and participant-side

### Host

- The existing `updateCanvas` → `/_storyboard/canvas/update` API persists to
  disk. No change needed.
- The room CRDT is the *live* state; the host flushes it to disk via the normal
  debounced path. Reload on the host = cold-start from disk as usual.

### Participant — localStorage snapshot

Described in §8. Key design points:
- Snapshot is applied *after* the cold-start server JSON, layered as a diff.
- If the CRDT session is live, the snapshot is redundant (WebRTC state sync
  delivers fresh data); it is only used if the participant reconnects before the
  host has flushed.
- The snapshot uses `Y.encodeStateAsUpdate` / `Y.applyUpdate` — standard Y.js
  primitives, no custom serialization.

---

## 11. Room UI surface

### Opening a room (host)

A new "Open Room" button in the storyboard toolbar (CoreUIBar). Clicking opens
a small popover:

```
┌─ Open a Room ────────────────────────────────────┐
│                                                  │
│  Room type    ● Open (all visitors)              │
│               ○ Closed  [ purple-iguana-42 ▾ ]  │
│                                                  │
│  Canvas edit  [ ] Allow participants to edit     │
│                                                  │
│  [ Open Room ]                     [ Cancel ]    │
└──────────────────────────────────────────────────┘
```

After opening:
- A compact room indicator replaces the button: `🟢 Room open · 3 participants`
- Clicking it opens a manage panel (participant list, close room, toggle
  canvas edit, copy share link).

### Joining (participant)

On auto-join (open room or `?room=` param):
- A brief toast: `"You joined Alice's room"` (3 s, dismissible)
- The presence bar appears at the top of the viewport

### Follow-me toolbar

When a participant is following the host:
```
┌──────────────────────────────────────────────────────┐
│  👁 Following Alice   [ Stop following ]             │
└──────────────────────────────────────────────────────┘
```
This strip appears below the storyboard toolbar, above the prototype/canvas.

### Participant canvas toolbar

When canvas editing is enabled, participants see a restricted toolbar:
- Move, resize, prop-edit tools: enabled
- "Add widget" button: hidden
- Terminal / prompt widget toolbar items: hidden

---

## 12. Configuration

```jsonc
// storyboard.config.json
{
  "rooms": {
    "enabled": true,               // false = feature entirely disabled
    "signaling": [                 // y-webrtc signaling servers
      "wss://signaling.yjs.dev"
    ],
    "password": "",                // AES-GCM shared secret for y-webrtc; leave
                                   // empty to disable (shows a console warning
                                   // when a room is opened without a password)
    "canvasEdit": {
      "allowByDefault": false      // host can override per-room; this is the
                                   // default when opening the popover
    }
  }
}
```

**Feature flag gate:** if `rooms.enabled` is `false` (or the key is absent), no
room-mates session is ever started, no UI surfaces are rendered, and no Y.js
code is executed. This keeps the bundle clean for instances that don't need
multiplayer.

---

## 13. New files & touch points

### New files

| Path | Purpose |
|---|---|
| `packages/core/src/rooms/roomNames.js` | Fetch + random-pick from `room-names.json`; filter recently-used names |
| `packages/core/src/rooms/roomSession.js` | Room state machine: open, join, close, resolve prettyName→roomId via bootstrap channel |
| `packages/core/src/rooms/roomWriteGuard.js` | Client-side CRDT write-guard (§9) |
| `packages/react/src/rooms/useRoom.js` | React hook wrapping `roomSession.js`; exposes room state + actions to UI |
| `packages/react/src/rooms/useCanvasRoom.js` | Hook bridging Y.Doc canvas map ↔ local canvas state (§8) |
| `packages/react/src/rooms/RoomProvider.jsx` | Context provider; wraps the app root alongside `StoryboardProvider` |
| `packages/react/src/rooms/RoomToolbar.jsx` | Host toolbar button + popover (Open Room / manage) |
| `packages/react/src/rooms/PresenceBar.jsx` | Horizontal avatar strip with follow / eject controls |
| `packages/react/src/rooms/FollowBanner.jsx` | "Following Alice · Stop following" strip (participant) |
| `public/storyboard/room-names.json` | Static list of 100 pretty names |

### Modified files

| File | Change |
|---|---|
| `packages/core/src/mountStoryboardCore.js` | Initialise `RoomProvider` after feature-flag check |
| `packages/react/src/canvas/CanvasPage.jsx` | Integrate `useCanvasRoom`; pass `roomWriteGuard` to mutation handlers; apply remote canvas viewport from host awareness |
| `packages/react/src/canvas/CanvasToolbar.jsx` | Hide restricted actions for non-host participants |
| `packages/core/src/CoreUIBar.svelte` | Add "Open Room" button (host-only when rooms enabled) |
| `packages/core/src/session.js` | Hook `setParam`/`removeParam` to publish `hash` field to awareness when in a room |
| `storyboard.config.json` | Add `rooms` config block |

---

## 14. Phased rollout

All phases behind `rooms.enabled: true`.

### Phase A — Room infrastructure + presence (no canvas edit)

- `room-names.json` static file
- `roomSession.js` state machine (open/join/close, bootstrap resolution)
- `RoomProvider` + `useRoom`
- Presence bar with avatar dots + route indicators
- "Open Room" toolbar button + popover (no canvas edit option yet)
- Auto-join for open rooms via `?openRoom=` and `BroadcastChannel`
- Closed room join via `?room=<prettyName>`
- Toast on join

### Phase B — Cursors & follow-me

- Publish `route` + `hash` + `viewport` to awareness for all page types:
  - Prototype pages: `window.scrollX/Y` on throttled `scroll` listener
  - Canvas pages: container `scrollLeft/Top` + `zoom` on existing events
  - All pages: `hash` updated on every `setParam` / `hashchange`
- New `roomPlugin` alongside `cursorsPlugin` owns route/hash/viewport publication
- `FollowBanner` strip
- Participant router follows host route
- Participant `window.scrollTo` follows host `viewport.scrollX/Y` (prototype pages)
- Participant canvas scroll/zoom follows host `viewport.scrollLeft/Top/zoom` (canvas pages)
- Participant hash follows host hash (all pages, tagged `remote` to avoid re-broadcast)
- Eject on manual scroll (`wheel` / touch) on any page type, or `pointerdown` on canvas surface
- Host shows "N following" indicator

### Phase C — Canvas editing (CRDT)

- `useCanvasRoom` hook
- Y.Doc `canvas:{name}` structure
- `roomWriteGuard` client + host-side
- CRDT → canvas state integration in `CanvasPage`
- localStorage snapshot for participants
- Host-side flush to disk
- Participant restricted toolbar
- Canvas edit toggle in room manage panel

---

## 15. Open questions

1. **Bootstrap room security:** The bootstrap channel (`sb-bootstrap-{slug}`) is
   public and unencrypted. An eavesdropper on the signaling server could reply to
   a `resolve-room` request with a fake roomId. Is this threat model acceptable,
   or should the prettyName→roomId mapping be signed?

2. **Open room and branch deploys:** With branch-prefixed base paths, the
   `?openRoom=` param travels with the URL. Does this work correctly across
   cross-origin redirects (e.g., Caddy rewriting `/branch--name/storyboard/`)?
   Needs a test case.

3. **Multiple hosts:** The current model allows only one host per room (whoever
   opened it). Should two people be allowed to co-host (both can broadcast
   follow-me)? Complexity is high; recommend deferring.

4. **Participant canvas edit + undo:** When a participant edits a widget, does
   `Ctrl+Z` undo only their change, or the last change from any participant?
   Recommend: local undo stack per client; remote ops are not undoable from
   another client's undo stack. Needs a clear UX affordance.

5. **Awareness encryption:** `y-protocols/awareness` updates are sent over the
   same signaling + WebRTC channel as CRDT ops. With `password` set, they are
   AES-GCM encrypted. Without it, cursor positions and routes are visible to the
   signaling server. Document this clearly in the UI ("⚠ Room not encrypted").

6. **`room-names.json` refresh:** 100 names is a small pool for large teams.
   Should names be recycled after a session ends? Add a `usedNames` set in
   `localStorage` with a 24 h TTL to avoid immediate repeats.

7. **Participant count limit:** `y-webrtc` mesh degrades past ~6–8 peers. For
   larger rooms, a relay server (y-websocket) would be needed. Out of scope for
   this plan — add a warning in the room popover if participant count exceeds 6.
