# `packages/storyboard/src/core/cli/cliHelpers.js`

<!--
source: packages/storyboard/src/core/cli/cliHelpers.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Shared fetch helpers and argument parser for non-interactive CLI commands. Provides typed HTTP methods (`get`, `post`, `put`, `patch`, `del`) that resolve the server URL via [`serverUrl.js`](./serverUrl.js.md) and handle error extraction. Also exports `parseSimpleArgs`, `jsonOut`, and `die` — the lightweight primitives used by all canvas and artifact commands.

## Composition

```js
// HTTP helpers — all throw on non-ok responses
export async function post(path, body)   // POST JSON → parsed response
export async function get(path)          // GET → parsed response
export async function put(path, body)    // PUT JSON → parsed response
export async function patch(path, body)  // PATCH JSON → parsed response
export async function del(path, body)    // DELETE JSON → parsed response

// Arg parsing — no schema, no validation
export function parseSimpleArgs(args)    // → { positional: string[], flags: object }

// Output helpers
export function jsonOut(data)            // console.log(JSON.stringify(data, null, 2))
export function die(msg, code = 1)       // console.error + process.exit
```

All requests use a 15-second `AbortSignal.timeout`. Error messages are extracted from `data.error` before falling back to HTTP status text.

`parseSimpleArgs` is intentionally simpler than [`parseFlags`](./flags.js.md) — no schema, no type coercion, no aliases. It handles `--key value`, `--key=value`, and `-k value` syntax.

## Dependencies

- [`serverUrl.js`](./serverUrl.js.md) — `getServerUrl` (base URL for all requests)

## Dependents

Used by nearly all canvas and artifact CLI commands: [`artifact.js`](./artifact.js.md), [`canvasAlias.js`](./canvasAlias.js.md), [`canvasBatch.js`](./canvasBatch.js.md), [`canvasBounds.js`](./canvasBounds.js.md), [`canvasConnector.js`](./canvasConnector.js.md), [`canvasDelete.js`](./canvasDelete.js.md), [`canvasDeleteCanvas.js`](./canvasDeleteCanvas.js.md), [`canvasDuplicate.js`](./canvasDuplicate.js.md), [`canvasRoles.js`](./canvasRoles.js.md), [`hubCommands.js`](./hubCommands.js.md), [`messagesCommands.js`](./messagesCommands.js.md), [`promptSpawn.js`](./promptSpawn.js.md).
