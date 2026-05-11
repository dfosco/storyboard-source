# `packages/storyboard/src/core/autosync/server.js`
<!--
source: packages/storyboard/src/core/autosync/server.js
category: storyboard
importance: medium
-->
> [← Architecture Index](../../../../../../../architecture.index.md)

## Goal

Dev-server middleware that provides automatic git commit + push functionality scoped to specific content types (`canvas`, `prototype`). It runs a 30-second watcher that commits and pushes changed files in its enabled scopes, surviving server restarts via `.storyboard/autosync.json` state persistence. Pauses automatically when the user switches away from the target branch and resumes when they return.

Routes mounted at `/_storyboard/autosync/`:
- `GET /branches` — list local branches (excluding main/master)
- `GET /status` — current state (branch, enabled scopes, last sync times, errors)  
- `POST /enable` — enable autosync for a scope on a branch
- `POST /disable` — disable autosync for a scope (or all scopes)
- `POST /sync` — trigger a single sync cycle manually

## Composition

```js
// Module-level watcher state (singleton, survives page reloads)
let schedulerInterval = null
let targetBranch = null
let enabledScopes = { canvas: false, prototype: false }
const SYNC_INTERVAL_MS = 30_000

export function loadPersistedState(root) { /* read .storyboard/autosync.json */ }
export function saveState(root) { /* write .storyboard/autosync.json atomically */ }
export function createAutosyncHandler({ root, sendJson }) {
  // Returns an Express-style middleware
  return async (req, res, next) => {
    // Route: GET /branches, GET /status, POST /enable, POST /disable, POST /sync
  }
}

// Scheduler: runs every 30s, executes enabled scopes in order ['canvas', 'prototype']
function startScheduler(root) {
  schedulerInterval = setInterval(() => runEnabledScopes(root), SYNC_INTERVAL_MS)
}

// Sync a scope: git add scoped files → git commit → git push (retry up to 3x)
async function syncScope(scope, root) { ... }
```

State is validated on load — protected branches (main/master) and invalid branch names are rejected to prevent accidental commits to the wrong branch.

## Dependencies

- `node:child_process` — `execFileSync` (git operations)
- `node:fs` — state persistence
- `node:path`

## Dependents

- [`packages/storyboard/src/core/vite/server-plugin.js`](../vite/server-plugin.js.md) — imports `createAutosyncHandler` and mounts it at `/_storyboard/autosync/`
- `packages/storyboard/src/core/autosync/server.test.js` — unit tests

## Notes

- The module-level state means the watcher persists across Vite HMR reloads of the server plugin — a deliberate design choice to avoid stopping/restarting the timer on every config change.
- Scopes commit only files matching their patterns: `canvas` commits `*.canvas.jsonl`, `prototype` commits flow/object/record JSON files.
- Branch names are validated against a regex (`/^[\w][\w.\-/]*$/`) and a protected-branch list before any git operations.
