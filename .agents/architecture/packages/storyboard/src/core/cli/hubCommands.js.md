# `packages/storyboard/src/core/cli/hubCommands.js`

<!--
source: packages/storyboard/src/core/cli/hubCommands.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`storyboard hub <subcommand>` — hub and conversation management CLI. Implements the 1:1 CLI↔server convention for every `/_storyboard/messages/hub/*` and `/_storyboard/messages/conversation/*` endpoint. Agents use these commands instead of raw HTTP.

## Composition

### Subcommands → endpoints

| Subcommand | Method | Endpoint |
|---|---|---|
| `state` | GET | `/_storyboard/messages/hub/<canvasId>` |
| `goal` | POST | `/_storyboard/messages/hub/goal` |
| `send` | POST | `/_storyboard/messages/hub/send` |
| `respond` | POST | `/_storyboard/messages/hub/respond` |
| `token` | POST | `/_storyboard/messages/hub/token` |
| `delegate` | POST | `/_storyboard/messages/hub/delegate` |
| `undelegate` | POST | `/_storyboard/messages/hub/undelegate` |
| `dissolve` | POST | `/_storyboard/messages/hub/dissolve` |
| `conversation start` | POST | `/_storyboard/messages/conversation/start` |
| `conversation finality` | POST | `/_storyboard/messages/conversation/finality` |
| `conversation reopen` | POST | `/_storyboard/messages/conversation/reopen` |
| `presence` | GET | `/_storyboard/messages/presence[/<branch>/<canvas>]` |
| `bindings` | GET | `/_storyboard/messages/bindings` |

Nested `conversation` subcommand uses `process.argv[4]` for the second-level dispatch; all others use `process.argv[3]`. Args are parsed with `parseSimpleArgs` and results printed via `jsonOut`.

## Dependencies

- [`cliHelpers.js`](./cliHelpers.js.md) — `parseSimpleArgs`, `jsonOut`, `die`, `post`, `get`

## Dependents

- [`index.js`](./index.js.md) — dispatches `hub` command here

## Notes

`--sender` and `--canvas` fall back to `$STORYBOARD_WIDGET_ID` and `$STORYBOARD_CANVAS_ID` environment variables, so agents can omit them in scripted contexts.
