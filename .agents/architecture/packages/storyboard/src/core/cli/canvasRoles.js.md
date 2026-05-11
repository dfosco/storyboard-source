# `packages/storyboard/src/core/cli/canvasRoles.js`

<!--
source: packages/storyboard/src/core/cli/canvasRoles.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Implements `storyboard canvas roles` — lists the available hub roles from the server. Used when setting up multi-agent hubs to discover valid role names and types.

## Composition

GETs `/_storyboard/canvas/roles`. Output lists each role's name, type, and whether it is the default. Optional `--json` flag outputs raw JSON.

```bash
storyboard canvas roles
storyboard canvas roles --json
```

## Dependencies

- [`cliHelpers.js`](./cliHelpers.js.md) — `get`, `parseSimpleArgs`, `jsonOut`, `die`

## Dependents

Invoked by [`index.js`](./index.js.md) (`canvas roles`).
