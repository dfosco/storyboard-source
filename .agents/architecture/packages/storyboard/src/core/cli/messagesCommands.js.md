# `packages/storyboard/src/core/cli/messagesCommands.js`

<!--
source: packages/storyboard/src/core/cli/messagesCommands.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`storyboard messages <subcommand>` — low-level messaging bus CLI. Implements the 1:1 CLI↔server convention for the `/_storyboard/messages/*` publish/read endpoints. Used by agents to post and poll events on named channels.

## Composition

### Subcommands → endpoints

| Subcommand | Method | Endpoint |
|---|---|---|
| `publish` | POST | `/_storyboard/messages/publish` |
| `send` | POST | `/_storyboard/messages/send` (publish + wait for correlated response) |
| `read` | GET | `/_storyboard/messages/read?channel=…` |
| `batch` | POST | `/_storyboard/messages/batch` |

`batch` accepts `--ops '<json>'` or `--ops-file <path>` to avoid shell escaping for complex payloads.

## Dependencies

- [`cliHelpers.js`](./cliHelpers.js.md) — `parseSimpleArgs`, `jsonOut`, `die`, `post`, `get`

## Dependents

- [`index.js`](./index.js.md) — dispatches `messages` command here

## Notes

`--sender` falls back to `$STORYBOARD_WIDGET_ID`. All output is JSON via `jsonOut` so callers can pipe to `jq`. The `send` subcommand blocks until a correlated response is received (server-side timeout defaults to 30s).
