# `packages/storyboard/src/core/autosync/server.test.js`
<!--
source: packages/storyboard/src/core/autosync/server.test.js
category: storyboard
importance: medium
-->
> [← Architecture Index](../../../../../../../architecture.index.md)

## Goal

Unit tests for the autosync server module. Covers state persistence (load/save), branch validation, scope enable/disable, sync triggering, and the scheduler lifecycle.

## Composition

Tests use Vitest with `vi.mock()` for `node:child_process` and `node:fs` to avoid real git operations. Key test suites:
- **State persistence** — loading from disk, validation of protected/invalid branches, saving
- **Route handlers** — GET /branches, GET /status, POST /enable, POST /disable, POST /sync
- **Scheduler** — start/stop, interval timing, scope relay sequence

## Dependencies

- `vitest` — test runner
- [`./server.js`](./server.js.md) — module under test

## Dependents

None (test file).

## Notes

- Tests verify that `main` and `master` branch names are rejected by `validatePersistedState`.
- The `SYNC_INTERVAL_MS = 30_000` constant is exercised with fake timers.
