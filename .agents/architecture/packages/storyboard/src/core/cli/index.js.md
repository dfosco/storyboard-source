# `packages/storyboard/src/core/cli/index.js`

<!--
source: packages/storyboard/src/core/cli/index.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`index.js` is the main entry point for the `storyboard` (and `sb`) CLI binary. It is the first file Node.js executes when a user runs `npx storyboard <command>`. Its sole responsibility is to parse `process.argv[2]` (the top-level command) and dynamically import the appropriate submodule — keeping the entry point itself extremely thin and startup time fast via lazy loading.

The file also owns the full-screen help text rendered when `storyboard` is run with no arguments or an unknown command. This help screen groups all commands by category (Development, Create, Artifact, Canvas, Terminal, Agent, Hub & Messaging, Setup, Updates) and uses ANSI color helpers from [`intro.js`](./intro.js.md). A `getVersion()` helper reads `package.json` at runtime so the displayed version is always accurate. Every subcommand routes to its own dedicated module file, making it trivial to add new commands without touching any existing handler logic.

## Composition

### Subcommand dispatch

The switch statement at the bottom of the file maps `process.argv[2]` to dynamic imports. Nested subcommands (like `canvas add`) are handled by an additional `if/else` chain inside the `canvas` case:

```js
const command = process.argv[2]

switch (command) {
  case 'dev':    import('./dev.js'); break
  case 'run':    import('./run.js'); break
  case 'setup':  import('./setup.js'); break
  case 'proxy':  import('./proxy.js'); break
  case 'canvas':
    if (process.argv[3] === 'add')          import('./canvasAdd.js')
    else if (process.argv[3] === 'update')  import('./canvasUpdate.js')
    else if (process.argv[3] === 'read' || !process.argv[3]) import('./canvasRead.js')
    else if (process.argv[3] === 'bounds')  import('./canvasBounds.js')
    else if (process.argv[3] === 'batch')   import('./canvasBatch.js')
    // ... etc
    break
  case 'agent':    import('./agent.js'); break
  case 'hub':      import('./hubCommands.js'); break
  case 'messages': import('./messagesCommands.js'); break
  case 'terminal':
    if (process.argv[3] === 'start')  import('./terminal-welcome.js')
    else if (process.argv[3] === 'send')  import('./terminal-messaging.js').then(m => m.handleSend())
    // ...
    break
  default:
    if (command?.startsWith('update:')) import('./updateVersion.js')
    else console.log(helpScreen(getVersion()))
}
```

### Full subcommand mapping

| Top-level command | Module |
|---|---|
| `dev` | [`dev.js`](./dev.js.md) |
| `run` | [`run.js`](./run.js.md) |
| `setup` | [`setup.js`](./setup.js.md) |
| `branch` | [`branch.js`](./branch.js.md) |
| `pull` | [`pull.js`](./pull.js.md) |
| `publish` | [`publish.js`](./publish.js.md) |
| `proxy` | [`proxy.js`](./proxy.js.md) |
| `create` | [`create.js`](./create.js.md) |
| `compact` | [`compact.js`](./compact.js.md) |
| `canvas add` | [`canvasAdd.js`](./canvasAdd.js.md) |
| `canvas update` | [`canvasUpdate.js`](./canvasUpdate.js.md) |
| `canvas read` | [`canvasRead.js`](./canvasRead.js.md) |
| `canvas bounds` | [`canvasBounds.js`](./canvasBounds.js.md) |
| `canvas broadcast` | [`canvasBroadcast.js`](./canvasBroadcast.js.md) |
| `canvas alias` | [`canvasAlias.js`](./canvasAlias.js.md) |
| `canvas connector` | [`canvasConnector.js`](./canvasConnector.js.md) |
| `canvas delete` | [`canvasDelete.js`](./canvasDelete.js.md) |
| `canvas duplicate` | [`canvasDuplicate.js`](./canvasDuplicate.js.md) |
| `canvas delete-canvas` | [`canvasDeleteCanvas.js`](./canvasDeleteCanvas.js.md) |
| `canvas roles` | [`canvasRoles.js`](./canvasRoles.js.md) |
| `canvas batch` | [`canvasBatch.js`](./canvasBatch.js.md) |
| `exit` | [`exit.js`](./exit.js.md) |
| `terminal start` | [`terminal-welcome.js`](./terminal-welcome.js.md) |
| `terminal close/open/remove` | [`terminal-commands.js`](./terminal-commands.js.md) |
| `terminal send/output/status/read/kill` | [`terminal-messaging.js`](./terminal-messaging.js.md) |
| `terminal` (browser) | [`sessions.js`](./sessions.js.md) |
| `server` | [`server.js`](./server.js.md) |
| `agent` | [`agent.js`](./agent.js.md) |
| `hub` | [`hubCommands.js`](./hubCommands.js.md) |
| `messages` | [`messagesCommands.js`](./messagesCommands.js.md) |
| `prompt` | [`promptSpawn.js`](./promptSpawn.js.md) |
| `code` | [`code.js`](./code.js.md) |
| `artifact` | [`artifact.js`](./artifact.js.md) |
| `update[:<tag>]` | [`updateVersion.js`](./updateVersion.js.md) |

### Help screen

`helpScreen(version)` renders the full ASCII mascot + getting-started text (from [`intro.js`](./intro.js.md)) + alphabetically grouped command reference. It is displayed on `storyboard` with no args and on unknown commands (exit code 1 for unknown).

## Dependencies

- [`intro.js`](./intro.js.md) — ANSI helpers (`dim`, `magenta`, `cyan`, `green`, `bold`, `yellow`) and `gettingStartedLines()`
- `@clack/prompts` — `p.log.error` for unknown command errors
- `fs` / `path` — for `getVersion()` reading `package.json`
- All subcommand modules listed above (lazy, via dynamic import)

## Dependents

This is the CLI entry point — nothing imports it. It is referenced by the `bin` field in `packages/storyboard/package.json`.

## Notes

- All imports are **dynamic** (`import('./...')` inside case branches), so only the executed submodule loads. This keeps startup under ~10ms for the help screen case.
- Backwards-compat alias: `sessions` → [`sessions.js`](./sessions.js.md); `terminal-welcome` → [`terminal-welcome.js`](./terminal-welcome.js.md) (used internally by terminal-server).
- The `update` command uses a `startsWith('update:')` check in the `default` branch rather than a dedicated `case`, allowing `update:beta`, `update:alpha`, `update:4.0.0-beta.1` etc. to all route to [`updateVersion.js`](./updateVersion.js.md).
