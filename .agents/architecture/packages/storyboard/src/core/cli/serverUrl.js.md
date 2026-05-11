# `packages/storyboard/src/core/cli/serverUrl.js`

<!--
source: packages/storyboard/src/core/cli/serverUrl.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Resolves the dev server base URL for the current worktree. Used by [`terminal-messaging.js`](./terminal-messaging.js.md) and other CLI tools that need to make HTTP calls to the running dev server without knowing which port it is on.

## Composition

### `getServerUrl()` — priority chain

1. `$STORYBOARD_SERVER_URL` env var (set by terminal agent sessions) — returned immediately, trailing slash stripped
2. **Caddy admin API** (`localhost:2019/config/…`) — queries the actual route table; finds the upstream `dial` for the current worktree (branch route or main fallback); 2-second timeout
3. **`resolveRunningPort`** from `../worktree/port.js` — falls back to `ports.json`

For branch worktrees, looks for a subroute matching `/branch--<name>/*`; for main, finds the fallback subroute (no `match`).

## Dependencies

- `../worktree/port.js` — `detectWorktreeName`, `resolveRunningPort`
- [`proxy.js`](./proxy.js.md) — `readDevDomain`
- Node.js `child_process` (`execSync` for Caddy API curl)

## Dependents

- [`terminal-messaging.js`](./terminal-messaging.js.md) — `handleSend`, `handleOutput`, `handleRead`, `handleKill`

## Notes

The Caddy query uses `curl` via `execSync` with a 2-second timeout and swallows errors — a Caddy outage simply falls through to the `ports.json` fallback.
