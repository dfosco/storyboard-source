# `packages/storyboard/src/core/cli/run.js`

<!--
source: packages/storyboard/src/core/cli/run.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`storyboard run` — convenience command that combines `storyboard proxy start` and `storyboard dev` into a single invocation. Useful for fresh starts when neither proxy nor dev server is running.

## Composition

Sequential flow (module top-level):

1. **Proxy** — if Caddy is installed and not running, calls `startCaddy()` from [`proxy.js`](./proxy.js.md); if not installed, warns and continues.
2. **Dev** — `await import('./dev.js')` to hand off to the active dev command, passing through all positional arguments.

## Dependencies

- [`proxy.js`](./proxy.js.md) — `isCaddyInstalled`, `isCaddyRunning`, `startCaddy`
- [`dev.js`](./dev.js.md) — dynamically imported at runtime
- `@clack/prompts`

## Dependents

- [`index.js`](./index.js.md) — dispatches `run` command here
