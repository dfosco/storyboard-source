# `packages/storyboard/src/core/cli/schemas.js`

<!--
source: packages/storyboard/src/core/cli/schemas.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Canonical `FlagSchema` definitions for every `storyboard create` subcommand. Each schema is a plain object compatible with [`flags.js`](./flags.js.md). Also serves as documentation: the schema is the source of truth for what each `create` subcommand accepts.

## Composition

### Exported schemas

| Export | For subcommand | Key flags |
|---|---|---|
| `prototypeSchema` | `create prototype` | `--name` (req), `--title`, `--folder`, `--partial`, `--url` (makes it external) |
| `canvasSchema` | `create canvas` | `--name` (req), `--title`, `--folder`, `--grid`, `--jsx` |
| `flowSchema` | `create flow` | `--name` (req), `--prototype` (req), `--globals`, `--copy-from`, `--starting-page` |
| `pageSchema` | `create page` | `--prototype` (req), `--path` (req), `--folder`, `--template` |
| `widgetSchema` | `canvas add` | `--canvas` (req), `--x/--y`, `--near`, `--direction`, `--gap`, `--resolve`, `--props`, `--props-file`, `--json` |
| `componentSchema` | `create component` | `--name` (req), `--directory` |

## Dependencies

- Types from [`flags.js`](./flags.js.md) (JSDoc import only — no runtime import)

## Dependents

- [`create.js`](./create.js.md) — imports prototype/canvas/flow/page/component schemas
- [`canvasAdd.js`](./canvasAdd.js.md) — imports `widgetSchema`
