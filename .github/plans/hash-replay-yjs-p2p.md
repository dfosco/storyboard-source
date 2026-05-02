# Hash Replay & Y.js P2P — Technical Proposal

Three tightly related capabilities that compose into a real-time, time-travelable
collaboration layer for Storyboard:

1. **Hash as event log** — every URL-hash write is recorded and replayable.
2. **Session replay** — walk forwards or backwards through the recorded log.
3. **Y.js P2P sync** — broadcast and merge hash (and canvas) state across peers,
   no server required.

> Related: the broader [realtime-and-hash-history.md](./realtime-and-hash-history.md)
> roadmap covers phasing, transport security, and canvas collab in more depth.
> This document is the focused technical spec for these three primitives.

---

## 1 — Hash as event log

### Problem

`useOverride` writes to `window.location.hash` imperatively. There is no record
of what changed, in what order, or what the previous value was. Undo is impossible
without replaying from scratch.

### Design

Introduce `sessionHistory` — a lightweight ring buffer that wraps every hash write.

```
packages/core/src/sessionHistory.js
```

**Data model**

```js
// One entry per logical change
{
  id:        string,          // UUID
  timestamp: number,          // Date.now()
  hash:      string,          // full encoded hash string at this moment
  source:    'override'       // initiated by useOverride / setParam
           | 'navigation'     // hashchange from browser nav or external set
           | 'remote',        // applied from a Y.js peer
  diff:      Record<string, { prev, next }>  // which keys changed vs. prior entry
}
```

**API**

```js
sessionHistory.record(hash, source)   // called by setParam + hashchange listener
sessionHistory.undo()                 // jump to previous entry, write to location.hash
sessionHistory.redo()                 // jump to next entry
sessionHistory.jumpTo(id)             // non-linear jump (DevTools click)
sessionHistory.entries()              // read-only snapshot list
sessionHistory.subscribe(cb)          // notify listeners (used by useSyncExternalStore)
```

**Coalescing**

Rapid writes (e.g. slider drag) coalesce into one entry using a 300 ms debounce
window. The *last* value in the window is kept; intermediate values are discarded.

**Capacity**

Ring buffer capped at 200 entries. Oldest entries evict first (FIFO).

### Integration points

| Where | What |
|-------|------|
| `session.js → setParam/removeParam` | call `sessionHistory.record(hash, 'override')` after every write |
| `session.js → subscribeToHash` | also record `'navigation'` writes from hashchange events |
| `sharedSession.js` (Phase 3) | remote Y.Map writes recorded with `'remote'` source |

---

## 2 — Session replay

### Problem

Even with a log, replaying it correctly requires knowing:
- What constitutes a "replayable" step (override changes only, not route changes).
- How to handle route boundaries (undo should not cross pages silently).
- How to expose replay to both developers (DevTools) and potentially end-users.

### Design

Replay is a cursor over `sessionHistory.entries()`.

```
packages/react/src/hooks/useSessionHistory.js
```

```js
const { entries, canUndo, canRedo, undo, redo, jumpTo } = useSessionHistory()
```

Backed by `useSyncExternalStore` on `sessionHistory.subscribe`.

#### Undo/redo semantics

- `undo()` moves the cursor back one entry and writes `entry.hash` to
  `window.location.hash` via `setParam`'s underlying setter (suppressing
  a new history push for that write to avoid a feedback loop).
- If the prior entry is on a different pathname, use the router to navigate
  *then* set the hash.
- `remote`-sourced entries are skipped by undo/redo (they represent peer
  changes, not local intent). They appear in the list but are grayed out.

#### DevTools UI

New **History** tab inside `DevTools.jsx`:

```
┌─ History ─────────────────────────────────────────────┐
│ ●  2s ago    theme: dark → light               [jump] │
│ ●  5s ago    activeTab: 0 → 2                  [jump] │
│ ○  8s ago    (remote) theme: system → dark     [jump] │
│ ●  12s ago   theme: light → dark               [jump] │
│   ·····  (185 more)                                   │
└───────────────────────────────────────────────────────┘
  ⌘Z undo    ⌘⇧Z redo
```

Keybindings (`⌘Z` / `⌘⇧Z`) are only active while the DevTools panel is focused
— no global hijack.

#### Time-travel mode (stretch goal)

A scrubber bar (slider) across the full entry list, letting a developer scrub
through recorded states at demo time. This is a DevTools-only feature; no user
facing UI required for v1.

---

## 3 — Y.js P2P sync

### Problem

Sharing state between two browser tabs (or two collaborators) today requires
copy-pasting URLs. We want live sync with no server in the data path.

### Approach

Use `yjs` + `y-webrtc` for a serverless CRDT layer. WebRTC data channels are
DTLS-encrypted by default; optionally add `y-webrtc`'s `password` option for
AES-GCM on top of the signaling payloads.

### Module structure

```
packages/core/src/realtime/
  yDoc.js           ← singleton Y.Doc + awareness per room
  localUser.js      ← stable identity from localStorage
  sharedSession.js  ← Y.Map mirror of the URL hash
  transport.js      ← provider lifecycle (connect / disconnect / destroy)
```

#### `yDoc.js`

```js
getDoc(roomName)        // → Y.Doc (singleton)
getAwareness(roomName)  // → Awareness
getProvider(roomName, opts)  // → y-webrtc WebrtcProvider (lazy start)
destroyRoom(roomName)   // cleanup
```

#### `localUser.js`

Stable-per-browser user identity:

```js
{
  id:    string,   // UUID v4, persisted in localStorage 'sb-user-id'
  name:  string,   // localStorage 'sb-user-name' || 'Anonymous · Teal'
  color: string,   // deterministic from id, Primer-palette colors
}
```

#### `sharedSession.js` — hash ↔ Y.Map bridge

This is the key integration:

```
URL hash  ←──┐ local write ──→ Y.Map ──→ broadcast to peers
             └──────── remote write (via Y.Map observer)
```

```js
// On local setParam write (hook in session.js)
yMap.set(key, value)             // propagates to peers

// On Y.Map observer (remote write from peer)
setParam(key, value, { remote: true })  // suppress re-broadcast
sessionHistory.record(hash, 'remote')   // record but skip in local undo
```

**Conflict resolution:** Y.Map is last-writer-wins per key, which matches user
expectations — the most recent intentional write wins.

#### `transport.js` — provider lifecycle

```js
connect(roomName, opts)    // starts y-webrtc provider, begins signaling
disconnect(roomName)       // graceful peer disconnect
```

Room name format: `sb-{prototypeId}-{randomSuffix}` — never the human-readable
slug. The random suffix is generated once per session and shared via a "Share
session" workshop action (which copies the full room name / session link).

### Feature flag & entry point

```jsonc
// storyboard.config.json
{
  "realtime": {
    "enabled": false,
    "signaling": ["wss://signaling.yjs.dev"],  // public server, required for static/GH Pages deployments
    "password": ""                              // set to enable AES-GCM encryption on signaling payloads
  }
}
```

**Signaling default: `wss://signaling.yjs.dev`**

Because Storyboard is deployed as a static site on GitHub Pages (no backend to
run a custom signaling server), the public `y-webrtc` signaling server is the
only viable default. The `password` field enables `y-webrtc`'s built-in AES-GCM
encryption so that signaling metadata is opaque to the public server — only peers
with the same room name + password can communicate.

Security posture with public signaling + password:
- Room names are high-entropy UUIDs, not guessable slugs
- AES-GCM encryption prevents the signaling server from reading payload content
- WebRTC data channels are DTLS-encrypted at the transport layer
- The signaling server sees only encrypted blobs and connection metadata

The provider is never instantiated when `enabled: false`. When `enabled: true`
and `password` is empty, a console warning is shown recommending a password be
set before sharing the session link.

### Awareness (cursors + presence)

Awareness state per peer (updated live, not CRDT):

```js
{
  user:      { id, name, color },
  cursor:    { x, y },          // canvas-space coordinates
  selection: string[],          // widget IDs
  route:     string,            // current pathname
}
```

Updated on:
- `pointermove` on the canvas surface (throttled 30 Hz)
- Selection changes
- Router navigation

Rendered by `Cursors.jsx` — remote peer cursors lerped to received position at
60 Hz. Peers on a different route are shown in the presence list but not on
canvas.

### Hide mode

`sharedSession.js` must gate on `isHideMode()`:

- If hide mode activates → `transport.disconnect(roomName)` immediately.
- Provider restarts when hide mode is disabled again.
- Hide mode shadow (local-only override) is never broadcast.

---

## Rollout

| Phase | Scope | Flag |
|-------|-------|------|
| 1 | Hash log + replay (sessionHistory + useSessionHistory + DevTools tab) | always-on (low risk) |
| 2 | Y.js P2P hash sync (sharedSession) | `realtime.enabled: true` + signaling configured |
| 3 | Canvas widget CRDT | same flag, after Phase 2 stable |
| 4 | Cursors + presence | same flag, after Phase 3 stable |

---

## Open questions

- **Global ⌘Z:** Should hash undo be available globally, not just in DevTools?
  Risks: hijacking undo in prototype content (iframes, text inputs). Proposal:
  DevTools-only for now; revisit if demand warrants a user-facing undo button.
- **d6 cursor implementation:** Confirm smoothing/throttle defaults against
  `dfosco/d6` before implementing `Cursors.jsx` to avoid divergence.
- **Read-only viewers:** Easy to add via `awareness.role = 'viewer'` — no hash
  writes broadcast from viewer peers. Add if collab dogfooding surfaces the need.
