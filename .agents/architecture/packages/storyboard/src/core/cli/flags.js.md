# `packages/storyboard/src/core/cli/flags.js`

<!--
source: packages/storyboard/src/core/cli/flags.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Schema-validated CLI flag parser for interactive/complex commands. Converts `process.argv` tokens into a typed `flags` object with aliases, defaults, required-field validation, and error collection. Contrast with `parseSimpleArgs` in [`cliHelpers.js`](./cliHelpers.js.md) which has no schema and is used for thin REST wrappers.

## Composition

### Exports

| Export | Purpose |
|---|---|
| `parseFlags(argv, schema)` | Main parser; returns `{ flags, positional, missing, errors }` |
| `hasFlags(argv)` | Returns `true` if any token starts with `-` |
| `formatFlagHelp(schema)` | Renders schema as human-readable help text lines |

### Supported syntax

- `--key value` and `--key=value`
- `-alias value` (single-dash short aliases)
- `--bool` → true, `--no-bool` → false
- `--bool=true|false|1|0`
- Repeated `--key a --key b` → array (type `'array'`)
- Types: `'string'`, `'number'`, `'boolean'`, `'array'`

### FlagDef shape

```js
{ type, required, default, description, aliases: string[] }
```

## Dependencies

None — pure JavaScript, no imports.

## Dependents

- [`dev.js`](./dev.js.md), [`dev.legacy.js`](./dev.legacy.js.md), [`server.js`](./server.js.md)
- [`setup.js`](./setup.js.md), [`create.js`](./create.js.md), [`canvasAdd.js`](./canvasAdd.js.md)
- [`terminal-welcome.js`](./terminal-welcome.js.md), [`sessions.js`](./sessions.js.md)
- [`terminal-commands.js`](./terminal-commands.js.md), [`schemas.js`](./schemas.js.md)
- [`flags.test.js`](./flags.test.js.md)

## Notes

Unknown flags push to `errors` but do not throw. Callers check `missing` and `errors` after parsing and decide whether to exit. See [`schemas.js`](./schemas.js.md) for canonical schema definitions used by `storyboard create`.
