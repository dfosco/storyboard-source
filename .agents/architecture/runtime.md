# Storyboard Runtime architecture

> **Audience:** contributors who need to reason about where the proxy,
> Vite child processes, ports, and routes are owned in the codebase.
>
> **Why it exists:** the previous "every repo runs its own dev server"
> model produced [the `/branch--A/branch--B/` doubled-URL bug](../plans/server-state-branch-mixing.md)
> through a chain of cross-repo races. The runtime makes that bug class
> structurally impossible by funneling proxy + dev-server ownership
> through one process per machine.

## One sentence

The Storyboard Runtime is a per-machine daemon (`packages/runtime/`) that
**exclusively** owns the Caddy admin API, every Vite child process, and
all TCP-port leases. CLI commands and IDE integrations are thin clients;
they never spawn processes themselves.

## Process layout

```
┌─────────────────────────────────────────────────────────┐
│  Storyboard Runtime  (one per machine, 127.0.0.1:4321)  │
│  ├── ProxyController       (sole writer to Caddy admin) │
│  ├── DevServerOrchestrator (Vite spawn + FSM + leases)  │
│  ├── HotPool               (pre-allocated ports)        │
│  └── HTTP API              (zod-validated endpoints)    │
└─────────────────────────────────────────────────────────┘
        ▲                              ▲
        │ acquire / release            │ register / upsert
   sb dev / sb run               ProxyController
```

## Modules

| Module | Path | Responsibility |
|---|---|---|
| **Schema** | `src/schema/{identity,devserver,api}.ts` | Branded types (`DevDomain`, `WorktreeName`, `Port`, `DevServerSlot`), FSM definition, runtime API request/response shapes. |
| **Proxy** | `src/proxy/{caddy,controller}.ts` | `CaddyAdminClient` is the only place that issues PATCH/POST/DELETE against `localhost:2019`. `ProxyController` serializes writes via a promise-chain lock and sweeps stale non-`@id` routes. |
| **Devserver** | `src/devserver/{port-pool,orchestrator}.ts` | `PortPool` leases TCP ports (1240–1399). `DevServerOrchestrator` owns Vite child lifecycles, enforces slot uniqueness `(devDomain, worktree)`, refuses default `devDomain="storyboard"`, refuses slot rebind to a different `targetCwd`. |
| **Pool** | `src/pool/hot-pool.ts` | Pre-allocates ports in the background so `acquire` is O(1) on the hot path. |
| **Vite plugin** | `src/vite-plugin/{plugin,wrapper}.ts` | Auto-injected via `vite --config <wrapper>` from the orchestrator. Hardens base-redirect (refuses cross-branch concat, returns 421), checks Host header (refuses foreign devDomain), namespaces `server.hmr.path` to `/branch--<branch>/__vite_hmr`. |
| **Server / daemon** | `src/server/{constants,lock,http,main}.ts` | HTTP server on `127.0.0.1:4321`. Singleton lockfile at `~/.storyboard/runtime.lock`. SIGTERM drains in flight. |
| **Client** | `src/client/index.ts` | Typed `RuntimeClient` for CLI/JS callers. Auto-spawns the daemon on first call when not running. |

## Invariants

These are enforced in code (zod parsing or explicit guards) — violations are runtime errors, not silent corruption.

1. **Slot uniqueness.** At most one DevServer per `(devDomain, worktree)`. Per-slot mutex prevents double-spawn.
2. **Slot/CWD coupling.** Once bound, a slot belongs to exactly one filesystem path. Re-acquire from a different `targetCwd` returns `409 CONFLICT`.
3. **No default devDomain.** `devDomain="storyboard"` is rejected with `403 FORBIDDEN_DEFAULT_DOMAIN` unless the caller explicitly passes `allowDefaultDomain: true`.
4. **Sole proxy writer.** Only `ProxyController` writes to Caddy admin. Every other historical write path is gone.
5. **Serialized proxy writes.** `ProxyController.withLock()` chains every mutation; concurrent acquires across devDomains can no longer race.
6. **FSM.** `DevServerStatus` transitions go through `assertTransition()`. Illegal transitions throw `IllegalTransitionError`.
7. **Port lease ownership.** `PortPool`/`HotPool` are the sole authority for port allocation. Ports return on devserver exit.
8. **Singleton daemon.** `runtime.lock` (`O_EXCL`) prevents two daemons. Stale locks (dead PID) are reclaimed.
9. **Per-devDomain origin.** Each devDomain gets its own `${devDomain}.localhost` host. The Vite plugin enforces Host-header match and refuses foreign hosts with `421 Misdirected Request`.

## Bug class closures

| Hypothesis | Module | Mechanism |
|---|---|---|
| **H1** base-redirect concatenation | `vite-plugin/plugin.ts` | `decideRedirect()` refuses to prepend over an existing `/branch--<other>/`. Returns 421 with HTML page pointing at the correct URL. |
| **H2** destructive `caddy reload` | `proxy/controller.ts` + `caddy.ts` | All Caddy writes go through `CaddyAdminClient.patchById/appendRoute/deleteRouteAt`. No reload-from-disk path remains. |
| **H3** shared `devDomain` | `devserver/orchestrator.ts` | `ForbiddenDefaultDomainError` thrown when `devDomain === "storyboard"`. |
| **H4** independent port registries | `devserver/port-pool.ts` + `pool/hot-pool.ts` | Single `PortPool` instance owns the 1240–1399 range. No on-disk shared state needed. |
| **H5** `hashPreserver` cross-branch | `packages/storyboard/src/internals/hashPreserver.js` | Click handler bypasses interception when target `/branch--<other>/` differs from current base. |
| **H6** HMR no branch prefix | `vite-plugin/plugin.ts` | `config()` hook sets `server.hmr.path = /branch--<branch>/__vite_hmr`. |
| **H7** shared `localStorage` | `packages/storyboard/src/core/session/localStorage.js` | Prefix computed at module load: `storyboard:${devDomain}:${branch}:`. One-shot migration drops legacy keys. |

## End-to-end smoke recipe

```bash
cd packages/runtime && node bin/runtime.js &

curl -s http://127.0.0.1:4321/health
curl -s http://127.0.0.1:4321/pool/status   # → {"warm":1,"bound":0,"capacity":4}

curl -s -X POST http://127.0.0.1:4321/devserver/acquire \
  -H 'content-type: application/json' \
  -d "{\"slot\":{\"devDomain\":\"my-app\",\"worktree\":\"main\"},\"targetCwd\":\"$PWD\"}" | jq
```

Visit the returned `lease.url`. Then try `http://my-app.localhost/branch--something-else/` — you should see the 421 page, *not* a doubled-prefix URL.

## CLI integration roadmap

The runtime is shipped; the existing `storyboard dev` CLI still uses the
legacy per-repo server module (`packages/storyboard/src/core/server/`).
Migration plan:

1. Update `dev.js` to call `RuntimeClient.acquire(...)` instead of
   `startServer()` + `spawnViteForBranch()`.
2. Update `proxy.js` to call `RuntimeClient.proxyUpsert(...)` instead of
   the local Caddy admin code.
3. Delete `packages/storyboard/src/core/server/` and the duplicate Caddy
   admin helpers in `proxy.js`.

These steps are intentionally separate from M1–M6 so the runtime can be
released and adopted incrementally.
