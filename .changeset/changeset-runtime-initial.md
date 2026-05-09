---
"@dfosco/storyboard-runtime": minor
---

Initial release of the Storyboard Runtime — a single-machine daemon that
owns the proxy and dev-server lifecycle so cross-repo races (the
`/branch--A/branch--B/...` bug class) become structurally impossible.

The runtime is the **only** process that:

- Writes to the Caddy admin API (`http://localhost:2019`).
- Spawns / kills Vite dev-server processes.
- Allocates ports, leases, and Caddy routes.

CLI commands become thin clients that *acquire* resources from the runtime;
they never spawn processes themselves.

Includes:

- HTTP API on `127.0.0.1:4321` with zod-validated requests/responses
  (`/devserver/{acquire,release,renew,list}`, `/proxy/{state,upsert,remove}`,
  `/pool/status`, `/health`).
- Singleton enforcement via `~/.storyboard/runtime.lock` (O_EXCL +
  stale-PID reclaim).
- `ProxyController` — sole writer to Caddy admin, serialized writes.
- `DevServerOrchestrator` — explicit FSM (idle→spawning→ready→draining→stopped),
  per-slot mutex, slot-CWD conflict refusal, lease enforcement.
- `HotPool` — pre-allocated TCP ports for instant `acquire` (env-tunable
  via `STORYBOARD_RUNTIME_WARM_PORTS` / `STORYBOARD_RUNTIME_POOL_CAP`).
- Auto-injected Vite plugin (`vite-config-wrapper`) that hardens
  `base-redirect` against cross-branch URL concatenation and namespaces
  `server.hmr.path` so HMR rides the branch route instead of the catch-all.
- Refuses the legacy default `devDomain "storyboard"` unless explicitly
  opted in.
