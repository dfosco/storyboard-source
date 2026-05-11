# `packages/storyboard/src/core/cli/terminal-messaging.js`

<!--
source: packages/storyboard/src/core/cli/terminal-messaging.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Terminal messaging handlers for sending messages between terminals, saving output, checking status, reading buffers, and killing terminal sessions. Each handler is a named export called by [`index.js`](./index.js.md) when `storyboard terminal <subcommand>` is invoked.

## Composition

### Exported handlers → server endpoints

| Handler | Subcommand | Endpoint |
|---|---|---|
| `handleSend()` | `terminal send` | `POST /_storyboard/canvas/terminal/send` |
| `handleOutput()` | `terminal output` | `POST /_storyboard/canvas/terminal/output` |
| `handleStatus()` | `terminal status` | (reads local config file directly) |
| `handleRead()` | `terminal read` | `GET /_storyboard/canvas/terminal-buffer/<id>` → fallback: read `.storyboard/terminal-buffers/<id>.buffer.json` |
| `handleKill()` | `terminal kill` | `POST /_storyboard/canvas/terminal/kill` |

`handleSend` supports `--connected` to auto-resolve the single connected peer from the sender's terminal config.

## Dependencies

- [`serverUrl.js`](./serverUrl.js.md) — `getServerUrl`
- `../canvas/terminal-config.js` — `readTerminalConfigById`, `initTerminalConfig` (lazy import)
- Node.js `fs` (lazy import for fallback read)

## Dependents

- [`index.js`](./index.js.md) — imports and calls each handler

## Notes

`handleRead` tries the HTTP API first; if the dev server is unreachable it reads the buffer JSON file directly — useful for offline post-mortem debugging.
