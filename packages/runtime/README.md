# @dfosco/storyboard-runtime

Single-machine daemon that owns the Storyboard proxy + devserver lifecycle.

The runtime is the **only** process allowed to:

- Write to the Caddy admin API (`http://localhost:2019`).
- Spawn / kill Vite dev-server processes.
- Allocate ports, leases, and Caddy routes.

CLI commands (`sb dev`, `sb proxy`, …) become thin clients that *request* resources from the runtime; they never spawn processes themselves. This makes a whole class of cross-repo races (e.g. `http://storyboard.localhost/branch--A/branch--B/...`) structurally impossible.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Storyboard Runtime  (one per machine, 127.0.0.1:4321)  │
│  ├── ProxyController       (sole writer to Caddy admin) │
│  ├── DevServerOrchestrator (spawn/acquire/release Vite) │
│  ├── HotPool               (pre-warmed devservers)      │
│  ├── Registry              (typed, append-only state)   │
│  └── HTTP API              (zod-validated endpoints)    │
└─────────────────────────────────────────────────────────┘
        ▲                              ▲
        │ acquire / release            │ register / upsert
   sb dev  /  sb run             ProxyController
```

## Status

**M4 shipped.** Hot pool of pre-allocated ports (default warm: 1, env-tunable). All bug-class fixes (M1–M3, M5b, M5c) plus M4 perf in. M5/M6 pending.

## Daemon

- Listens on `127.0.0.1:4321`.
- Pidfile at `~/.storyboard/runtime.pid`; lockfile prevents double-start.
- Bootstrapped on demand — first CLI call forks `bin/runtime.js` and detaches.
