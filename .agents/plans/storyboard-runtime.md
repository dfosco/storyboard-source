# Storyboard Runtime — implementation plan

Worktree: `0.5.0--runtime` (created from `0.5.0`).

## Problem

The bug `http://storyboard.localhost/branch--0.5.0/branch--dfosco` is a *symptom* of an architecture where:

- Every repo runs its own per-devDomain server (`packages/storyboard/src/core/server/index.js`) that races to PATCH/POST routes into the **shared** Caddy admin (`localhost:2019`) by `@id = devDomain`.
- Branch identity is a string; `(devDomain, worktree) → port` is convention, not contract. `serverRegistry` and `ports.json` can drift, and `cleanupDuplicateRoutes` is best-effort.
- CLI commands (`sb dev`, `sb proxy`) themselves spawn Vite/Caddy as side effects — there is no single owner of host space, ports, or process lifecycle.
- Browser shares `storyboard.localhost` origin across repos → SW/state bleed.

We will not patch this bug here (other session is doing that). **This plan makes the bad state structurally impossible.**

## Approach

Introduce a single-machine **Storyboard Runtime** daemon owning proxy + devserver lifecycle, fronted by a typed schema. CLI commands become thin clients that *request* resources; they never spawn processes themselves.

```
┌─────────────────────────────────────────────────────────┐
│  Storyboard Runtime (one per machine, port 4321)        │
│  ├── ProxyController     (sole writer to Caddy admin)   │
│  ├── DevServerOrchestrator (spawn/acquire/release Vite) │
│  ├── HotPool              (pre-warmed devservers)       │
│  ├── Registry             (typed, append-only state)    │
│  └── HTTP API (zod-validated, OpenAPI schema)           │
└─────────────────────────────────────────────────────────┘
        ▲                              ▲
        │ acquire/release              │ register/upsert
   sb dev / sb run                CaddyController
```

### Invariants enforced by schema, not convention

1. A **DevServer** is identified by `(devDomain, worktree)` — both required, both validated. The runtime refuses to allocate two with the same key.
2. A **port** is owned by exactly one DevServer at a time; ports are leased from a fixed pool, returned on release/exit.
3. The **proxy host space** is partitioned: each devDomain owns one Caddy route by `@id`. Only the runtime writes to `localhost:2019`. Cross-repo writes are impossible because no other process holds the lock file.
4. **Browser URLs** are constructed by the runtime and returned to the CLI. Clients never concatenate `BASE_URL + '/branch--' + name`.
5. State transitions are an explicit FSM: `idle → spawning → ready → draining → stopped`. Illegal transitions throw.

### Hot pool

- Config: `runtime.hotPool.devservers = { warmCount: 1, maxIdle: 3 }`.
- Pre-spawned Vite processes start with a placeholder cwd (a minimal stub project) and are *re-bound* to a real worktree on acquire. (If re-bind isn't feasible without restart, fall back to spawning fresh per acquire — pool still reserves the port.)
- `runtime devserver acquire --devDomain X --worktree Y` returns either a pooled instance or spawns one; either way the runtime owns the lifecycle.
- Behind config flag `runtime.hotPool.enabled` (default off in M1, on in M3).

### TypeScript

- New package: `packages/runtime/` authored in TS, transpiled at publish (matches existing core/storyboard build flow).
- Public API surfaces (zod schemas + inferred TS types) live in `packages/runtime/src/schema/`.
- Existing JS callers (CLI, server) consume the runtime via a thin JS wrapper (`packages/runtime/dist/client.js`), no migration of the wider codebase.

## Decisions (confirmed)

- Single global daemon (one per machine).
- TS only inside `packages/runtime/`; rest stays JS.
- Hot pool included behind a config flag.
- Loopback HTTP on `127.0.0.1:4321` for IPC.
- **One worktree per milestone**: `0.5.0--runtime`, `0.5.0--runtime--m2`, …
- **No PRs** — work lands on branches; user opens PRs manually when ready.

## Progress

| Milestone | Worktree | Branch | Status |
|---|---|---|---|
| Plan | `worktrees/0.5.0` | `0.5.0` | ✅ committed `45b6e754e` |
| M1 scaffold + daemon | `worktrees/0.5.0--runtime` | `0.5.0--runtime` | ✅ pushed `eb70a24c2` |
| M2 ProxyController | `worktrees/0.5.0--runtime--m2` | `0.5.0--runtime--m2` | ✅ local `beac800f2` |
| **M3 + M3b orchestrator** | `worktrees/0.5.0--runtime--m3` | `0.5.0--runtime--m3` | ✅ local `e553403c5` |
| M5b Vite guards | `worktrees/0.5.0--runtime--m5b` | — | ⏳ |
| M5c Browser guards | `worktrees/0.5.0--runtime--m5c` | — | ⏳ |
| M4 Hot pool | `worktrees/0.5.0--runtime--m4` | — | ⏳ |
| M5 Per-domain origin | `worktrees/0.5.0--runtime--m5` | — | ⏳ |
| M6 Docs + e2e | `worktrees/0.5.0--runtime--m6` | — | ⏳ |

## ▶︎ Stop point — user testing

After M3, the runtime is **end-to-end usable** for the first time. Recommended manual smoke from `worktrees/0.5.0--runtime--m3`:

```bash
cd packages/runtime && node bin/runtime.js &           # start daemon

curl -s http://127.0.0.1:4321/health

# Refused (closes H3)
curl -s -X POST http://127.0.0.1:4321/devserver/acquire \
  -H 'content-type: application/json' \
  -d '{"slot":{"devDomain":"storyboard","worktree":"main"},"targetCwd":"/tmp"}'

# Real acquire — point targetCwd at a worktree of THIS repo with vite installed
curl -s -X POST http://127.0.0.1:4321/devserver/acquire \
  -H 'content-type: application/json' \
  -d "{\"slot\":{\"devDomain\":\"storyboard-core\",\"worktree\":\"main\"},\"targetCwd\":\"$PWD/../../../..\"}" | jq

# Inspect state
curl -s http://127.0.0.1:4321/devserver/list | jq
curl -s http://127.0.0.1:4321/proxy/state | jq

# Release
curl -s -X POST http://127.0.0.1:4321/devserver/release \
  -H 'content-type: application/json' -d '{"leaseId":"<from acquire>"}'

# Stop daemon
kill %1
```

Things to watch for:
- The daemon stays singleton (try a second `node bin/runtime.js`).
- Two distinct `(devDomain, worktree)` slots can run simultaneously without interfering.
- Hitting `acquire` for an already-running slot returns the same devserver with a fresh `lease.id`.
- Caddy must already be running (`brew services start caddy` or `npm run setup`) for the proxy upsert to succeed.

## Open questions (decide during M1)

- **Daemon lifecycle**: launched on demand by first CLI call (forked + `unref`), or via `sb runtime start` only? Recommendation: on-demand fork on first call, with `sb runtime stop` for explicit teardown.
- **Re-bindable Vite**: prototype whether a Vite process can swap project root via HMR/restart-in-place; if not, the pool reserves only the *port*, and acquire respawns.
- **Migration**: do we deprecate the per-repo server in 0.5.0, or run both side by side with a feature flag? Recommendation: side by side in 0.5.x, remove in 0.6.

## Milestones

### M1 — Runtime skeleton (typed, no behaviour change)
- `packages/runtime/` scaffold, TS + zod + tsup build.
- Schemas: `DevDomain`, `Worktree`, `DevServer`, `Lease`, `ProxyRoute`, `RuntimeState`.
- HTTP server on `127.0.0.1:4321` with zod-validated endpoints (no-op handlers returning 501).
- JS client (`@dfosco/storyboard-runtime/client`) with typed wrappers.
- Daemon bootstrap: pidfile at `~/.storyboard/runtime.pid`, lockfile prevents double-start.

### M2 — ProxyController owns Caddy
- Move `generateRouteConfig` / `upsertCaddyRoute` / `cleanupDuplicateRoutes` into runtime.
- Runtime is the **only** writer to `localhost:2019`. Per-repo server's Caddy code becomes a deprecated client call.
- Add a global lockfile around Caddy admin writes.
- `sb proxy` becomes a thin wrapper over `POST /proxy/sync`.

### M3 — DevServerOrchestrator + acquire/release
- Move `spawnVite` / port allocation / `serverRegistry` into runtime.
- `sb dev` becomes: `runtime devserver acquire --devDomain X --worktree Y` → returns `{ url, port, leaseId }`.
- Per-repo server (`packages/storyboard/src/core/server/`) is deleted (or kept as deprecation shim).
- FSM enforced; illegal `(devDomain, worktree)` collisions return `409 CONFLICT`.

### M4 — Hot pool
- `HotPool` module with `warmCount` standby Vite processes.
- `runtime devserver spawn` (internal) creates blank instances; `acquire` rents them.
- Telemetry endpoint `GET /pool/status`.
- Enable in default config.

### M5 — Browser-safety
- Runtime returns canonical URLs; CLI prints them verbatim.
- Add a `runtime.devDomainOrigin` strategy: optionally namespace each devDomain to its own subdomain (e.g. `storyboard-core.localhost`, `storyboard.localhost`) to eliminate cross-repo SW/state bleed at the origin level.

### M6 — Migration + docs
- Update `AGENTS.md`, `.agents/architecture/`, README.
- Changeset, deprecation notes for `packages/storyboard/src/core/server/`.
- E2E test: spin two devDomains × two worktrees, assert no `/branch--A/branch--B` URL is producible from any runtime API.

## Files touched (anticipated)

- `packages/runtime/**` (new)
- `packages/storyboard/src/core/cli/dev.js` — replace inline server start with runtime client call
- `packages/storyboard/src/core/cli/proxy.js` — delegate to runtime
- `packages/storyboard/src/core/server/index.js` — delete in M3
- `packages/storyboard/src/core/worktree/{port,serverRegistry}.js` — move into runtime
- `packages/storyboard/src/core/canvas/hot-pool.js` — keep separate (terminal/agent pool); naming clarified to `AgentHotPool`
- `storyboard.config.json` — add `runtime` section
- `AGENTS.md` — runtime usage section
