# `packages/storyboard/src/core/cli/artifact.js`

<!--
source: packages/storyboard/src/core/cli/artifact.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Implements `storyboard artifact` — a CRUD interface for all storyboard artifact types (prototype, canvas, component, flow, object, record, page). Subcommands map 1:1 to REST endpoints on the dev server, following the CLI↔server convention.

## Composition

| Subcommand | Endpoint | Method |
|---|---|---|
| `create <type>` | `/_storyboard/artifact/` | POST |
| `edit <type> <name>` | `/_storyboard/artifact/` | PATCH |
| `delete <type> <name>` | `/_storyboard/artifact/` | DELETE |
| `list [type]` | `/_storyboard/artifact/list` | GET |
| `schema <type>` | `/_storyboard/artifact/schema?type=…` | GET |

All flags map 1:1 to schema fields (`--name`, `--title`, `--folder`, `--description`, `--author`, `--prototype`, `--url`). `buildValues()` handles short-flag aliasing. When `--type` is omitted for `create`, an interactive `@clack/prompts` selector is shown.

```js
storyboard artifact create prototype --name my-app --title "My App"
storyboard artifact list component --folder my-folder --json
storyboard artifact schema prototype  // prints JSON Schema
```

## Dependencies

- [`cliHelpers.js`](./cliHelpers.js.md) — `post`, `get`, `patch`, `del`, `parseSimpleArgs`, `jsonOut`, `die`
- `@clack/prompts` — interactive type picker when `--type` is absent

## Dependents

Invoked by [`index.js`](./index.js.md) (`case 'artifact'`).
