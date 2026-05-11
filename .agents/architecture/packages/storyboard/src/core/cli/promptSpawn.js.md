# `packages/storyboard/src/core/cli/promptSpawn.js`

<!--
source: packages/storyboard/src/core/cli/promptSpawn.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`storyboard prompt spawn` — acquires a pre-warmed agent session from the hot pool and assigns it to a canvas widget. Corresponds 1:1 to `POST /_storyboard/canvas/prompt/spawn`.

## Composition

Single `spawn` subcommand:

```
storyboard prompt spawn --canvas <id> --widget <id> --prompt "task"
```

Flags: `--canvas` / `-c`, `--widget` / `-w`, `--prompt` / `-p`. Canvas and widget IDs fall back to `$STORYBOARD_CANVAS_ID` / `$STORYBOARD_WIDGET_ID`. With `--json` flag, prints the full server response; otherwise prints a human-readable status line.

## Dependencies

- [`cliHelpers.js`](./cliHelpers.js.md) — `post`, `parseSimpleArgs`, `jsonOut`, `die`

## Dependents

- [`index.js`](./index.js.md) — dispatches `prompt` command here

## Notes

The hot pool is maintained by the server-side prompt infrastructure. `promptSpawn.js` is purely a thin HTTP wrapper — no local state.
