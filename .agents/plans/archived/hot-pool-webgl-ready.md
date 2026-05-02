# Hot Pool: WebGL Ready Slots & Load Balancer Off

## Problem

New agents acquired from the hot pool show "Click to resume" / "Running in background" (frozen state) because they register with the WebGL ContextPool at OFFSCREEN priority and the soft cap (`DEFAULT_MAX_LIVE=6`) is already saturated by existing visible terminals.

The hot pool is supposed to make agent creation instant, but the agent starts frozen and the user has to click to resume — defeating the purpose.

Additionally, the load balancer is spawning excess tmux sessions, exhausting PTY resources.

## Key Insight: WebGL Soft Cap

`DEFAULT_MAX_LIVE=6` in `WebGLContextPool.jsx` is a **soft cap**, not a browser hard limit:
- **PINNED widgets bypass the soft cap entirely** (selected, expanded, or interactive widgets)
- Modern browsers support **~8-16 WebGL contexts** depending on GPU
- The ContextPool manages which widgets get live priority based on viewport visibility

So the fix is about ensuring hot pool agents start with the **right priority** (PINNED) to get a live WebGL slot immediately, rather than starting OFFSCREEN and competing for the limited soft cap.

## Approach

1. **Add `webgl_ready_slots` per-pool config** — numeric config per pool (future-expandable) that marks how many sessions in the queue should start with guaranteed WebGL
2. **Server marks acquired sessions as `webglReady`** — based on the session's position in queue relative to `webgl_ready_slots`
3. **Browser gives `webglReady` widgets PINNED priority on mount** — bypasses the soft cap → guaranteed live WebGL
4. **Turn off load balancer** — disable auto-scaling to reduce tmux/PTY pressure
5. **Terminal pool to 0** — no pre-warming for plain terminals (technical users can wait)
6. **Agent pools to 2** — keep 2 warm sessions per agent pool

## Architecture

```
Server (hot-pool.js)                          Browser (TerminalWidget.jsx)
┌──────────────────────────┐                 ┌────────────────────────────────┐
│ copilot pool (pool_size=2)│                │                                │
│   webgl_ready_slots: 1   │                │ Widget mounts from hot pool    │
│   queue:                 │  acquire() →   │   webglReady: true             │
│     [sess1 ✦WebGL-ready] │  returns       │   → starts PINNED              │
│     [sess2 (normal)]     │  webglReady    │   → bypasses maxLive cap       │
│                          │                │   → gets live WebGL immediately│
└──────────────────────────┘                └────────────────────────────────┘
```

How `webgl_ready_slots` works with the queue:
- Pool has `pool_size: 2` and `webgl_ready_slots: 1`
- Queue: `[session1 (WebGL-ready), session2 (normal)]`
- `acquire()` → returns session1 with `webglReady: true`
- Backfill spawns session3 at end → queue: `[session2 (now position 0 → WebGL-ready), session3 (normal)]`
- The first N sessions in the queue are always "WebGL-ready" (N = `webgl_ready_slots`)

## Config Changes

### `storyboard.config.json`

```json
"hotPool": {
  "enabled": true,
  "verbose": false,
  "default_pool_size": 1,
  "default_max_pool_size": 3,
  "load_balancer": false,
  "load_balancer_cooldown_mins": 10,
  "pools": {
    "terminal": { "pool_size": 0 },
    "copilot": { "pool_size": 2, "webgl_ready_slots": 1 },
    "claude": { "pool_size": 2 },
    "codex": { "pool_size": 2 },
    "prompt": { "pool_size": 1 }
  }
}
```

## Files to change

| File | Change |
|------|--------|
| `packages/core/src/configSchema.js` | Add `webgl_ready_slots?: number` to per-pool typedef |
| `packages/core/src/canvas/hot-pool.js` | Read `webgl_ready_slots`, return `webglReady` from `acquire()`, include in `status()` |
| `storyboard.config.json` | Load balancer off, pool sizes updated, copilot gets `webgl_ready_slots: 1` |
| `packages/core/src/canvas/server.js` | Pass `webglReady` in POST /widget response when acquired from hot pool |
| `packages/core/src/canvas/terminal-server.js` | Pass `webglReady` through WebSocket connection setup |
| `packages/react/src/canvas/widgets/TerminalWidget.jsx` | Start PINNED when `webglReady: true` → live WebGL immediately |

## Todos

### 1. config-schema — Update HotPoolConfig typedef

Add `webgl_ready_slots?: number` to the per-pool config typedef in `packages/core/src/configSchema.js`.

### 2. hot-pool-server — Add `webglReady` to acquire() response

- `HotPool` constructor reads `webgl_ready_slots` from config (default: 0)
- `acquire()` returns `webglReady: true` when the acquired session's queue position was within `webgl_ready_slots`
  - Since acquire always takes the first ready session from the front, this means: `webglReady = (webgl_ready_slots >= 1)` (the first session is always within the threshold)
  - For future expansion with `webgl_ready_slots > 1`, track position explicitly
- `status()` includes `webgl_ready_slots` in pool status

### 3. storyboard-config — Update storyboard.config.json

- `load_balancer: false`
- `pools.terminal.pool_size: 0`
- `pools.copilot.pool_size: 2, webgl_ready_slots: 1`
- `pools.claude.pool_size: 2`
- `pools.codex.pool_size: 2`

### 4. server-passthrough — Pass `webglReady` through widget creation response

- `canvas/server.js`: when a widget is created from hot pool and the acquired session has `webglReady: true`, include it in the POST /widget response
- `terminal-server.js`: pass `webglReady` through WebSocket connection setup so the browser knows this widget should start live

### 5. browser-pinned — Hot pool widgets start PINNED

- `TerminalWidget.jsx`: when the widget was created from a hot pool session with `webglReady: true`, call `setPriority(Priority.PINNED)` on mount
- This needs the `webglReady` flag to reach the widget — likely via widget props or a data attribute on creation
- PINNED bypasses the ContextPool's maxLive cap → widget gets live WebGL immediately
- After the initial mount, normal priority management takes over (viewport-based visibility from CanvasPage)

## Notes

- `webgl_ready_slots` is a per-pool numeric config for future expansion (e.g., `webgl_ready_slots: 2` would mean the first 2 sessions in queue are WebGL-ready)
- `DEFAULT_MAX_LIVE=6` is unchanged — it's a soft cap that PINNED widgets already bypass
- Load balancer is turned off (not removed) — can be re-enabled by setting `load_balancer: true` when PTY resource issues are resolved
- `pool_size: 0` for terminals means terminal sessions start cold — acceptable for technical users
