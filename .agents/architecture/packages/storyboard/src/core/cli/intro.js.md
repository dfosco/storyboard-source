# `packages/storyboard/src/core/cli/intro.js`

<!--
source: packages/storyboard/src/core/cli/intro.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Single source of truth for ANSI color helpers and getting-started content shared across CLI modules. Consumed by [`index.js`](./index.js.md) (help screen), [`setup.js`](./setup.js.md) (setup completion note), [`publish.js`](./publish.js.md), [`pull.js`](./pull.js.md), [`sessions.js`](./sessions.js.md), and [`terminal-welcome.js`](./terminal-welcome.js.md).

## Composition

### ANSI helpers (named exports)

`dim`, `magenta`, `cyan`, `green`, `bold`, `white`, `yellow` — each wraps a string with the corresponding ANSI escape code and reset.

### `gettingStartedLines(opts?)`

Returns an array of strings for the getting-started prompt note. Accepts `{ indent }` option (default `'  '`). Lines include `npx storyboard dev`, `create prototype`, `create canvas`, `create component`, `canvas add sticky-note`, and a docs link.

## Dependencies

None — pure string utilities, no imports.

## Dependents

- [`index.js`](./index.js.md) — help screen color rendering
- [`setup.js`](./setup.js.md) — getting-started note + mascot art
- [`publish.js`](./publish.js.md), [`pull.js`](./pull.js.md) — `dim`, `green`, `bold`
- [`sessions.js`](./sessions.js.md), [`terminal-commands.js`](./terminal-commands.js.md) — `dim`, `cyan`, `bold`, `yellow`
- [`terminal-welcome.js`](./terminal-welcome.js.md) — `dim`, `bold`
