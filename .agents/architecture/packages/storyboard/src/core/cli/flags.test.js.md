# `packages/storyboard/src/core/cli/flags.test.js`

<!--
source: packages/storyboard/src/core/cli/flags.test.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Vitest unit tests for [`flags.js`](./flags.js.md). Pure unit tests with no file system or git access — all inputs are synthetic argv arrays. Covers `parseFlags`, `hasFlags`, and `formatFlagHelp`.

## Composition

Three `describe` suites:

- **`parseFlags`** — 18 cases: basic key/value, `=`-syntax, aliases, boolean variants (`--bool`, `--no-bool`, `=true/false`), double negation, number parsing, arrays, positionals, required validation, unknown flags, defaults, missing-value error.
- **`hasFlags`** — 4 cases: long flags, short flags, no flags, empty array.
- **`formatFlagHelp`** — 3 cases: flag names, aliases, defaults appear in output.

## Dependencies

- `vitest`
- [`flags.js`](./flags.js.md)

## Dependents

None — test file only.
