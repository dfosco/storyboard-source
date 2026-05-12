#!/usr/bin/env node
/**
 * storyboard CLI — unified dev tooling for Storyboard projects.
 *
 * Commands:
 *   storyboard dev              Start Vite dev server + update proxy
 *   storyboard setup            Install deps, Caddy, start proxy
 *   storyboard proxy start      Start or reload Caddy proxy
 *   storyboard proxy close      Stop Caddy proxy
 *   storyboard update:version   Update @dfosco/storyboard-* packages to latest
 *   storyboard update:beta      Update to latest beta
 *   storyboard update:alpha     Update to latest alpha
 *
 * Aliases: `sb` is equivalent to `storyboard`.
 */

import * as p from '@clack/prompts'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { gettingStartedLines, dim, magenta, cyan, green, bold, yellow } from './intro.js'

function getVersion() {
  try {
    const pkg = JSON.parse(readFileSync(resolve(import.meta.dirname, '..', '..', 'package.json'), 'utf8'))
    return pkg.version || '0.0.0'
  } catch {
    return '0.0.0'
  }
}

function helpScreen(version) {
  const d = dim('·')
  const b = dim
  const f = magenta

  const mascot = [
    `  ${b('╭─────────────────╮')}`,
    `  ${b('│')}  ${d}  ${f('◠')}  ${f('◡')}  ${f('◠')}  ${d}  ${b('│')}  ${bold('storyboard')} ${dim(`v${version}`)}`,
    `  ${b('│')}  ${d}  ${d}  ${d}  ${d}  ${d}  ${b('│')}  ${dim('A design tool for prototyping')}`,
    `  ${b('╰─────────────────╯')}`,
  ].join('\n')

  const cmd = (name, desc) => `    ${green(name.padEnd(22))}${desc}`

  const gettingStarted = [
    '',
    ...gettingStartedLines(),
  ].join('\n')

  const commands = [
    '',
    `  ${bold('All commands:')}`,
    '',
    `  ${bold(cyan('Development'))}`,
    cmd('run', 'Start proxy + dev server in one command'),
    cmd('run [branch]', 'Start proxy + dev for a specific branch'),
    cmd('dev', 'Alias for `run`'),
    cmd('server list', 'List running dev servers'),
    cmd('server start [wt]', 'Start dev server for a worktree'),
    cmd('server stop <wt|ID>', 'Stop a dev server'),
    cmd('code [branch]', 'Open a worktree in VS Code'),
    cmd('exit', 'Stop all dev servers and proxy'),
    '',
    `  ${bold(cyan('Create'))}`,
    cmd('create', 'Interactive creation picker'),
    cmd('create prototype', 'Create a prototype'),
    cmd('create canvas', 'Create a canvas'),
    cmd('create flow', 'Create a flow for a prototype'),
    cmd('create page', 'Create a page in a prototype'),
    '',
    `  ${bold(cyan('Artifact'))}`,
    cmd('artifact create <type>', 'Create a new artifact'),
    `                              ${dim('types: prototype, canvas, component, flow, object, record, page')}`,
    cmd('artifact edit <type> <name>', 'Edit an existing artifact'),
    cmd('artifact delete <type> <name>', 'Delete an artifact'),
    cmd('artifact list [type]', 'List artifacts'),
    cmd('artifact schema <type>', 'Show JSON Schema for a type'),
    '',
    `  ${bold(cyan('Canvas'))}`,
    cmd('canvas add <type>', 'Add widget to a canvas'),
    `                              ${dim('types: sticky-note, markdown, prototype, agent')}`,
    cmd('canvas update <id>', 'Update a widget\'s props or position'),
    cmd('canvas delete <id>', 'Delete a widget from a canvas'),
    cmd('canvas read [name]', 'Read canvas state and list widgets'),
    cmd('canvas connector <op>', 'Create, update, or delete connectors'),
    cmd('canvas broadcast', 'Toggle broadcast messaging for a widget'),
    cmd('canvas alias <op>', 'Get, set, or clear alias for a widget'),
    cmd('canvas duplicate', 'Duplicate a canvas'),
    cmd('canvas delete-canvas', 'Delete a canvas and its directory'),
    cmd('canvas roles', 'List available hub roles'),
    cmd('canvas batch', 'Execute multiple canvas operations in one call'),
    cmd('compact [name]', 'Compact canvas JSONL files (removes bloat)'),
    cmd('compact --all', 'Force compact all canvases'),
    '',
    `  ${bold(cyan('Terminal'))}`,
    cmd('terminal', 'Browse and manage terminal sessions'),
    cmd('terminal start', 'Launch the terminal welcome prompt'),
    cmd('terminal close --id <name>', 'Archive a session ' + dim('(alias: archive)')),
    cmd('terminal open --id <name>', 'Attach to a session'),
    cmd('terminal remove --id <name>', 'Permanently destroy a session'),
    cmd('terminal read <id>', 'Read terminal buffer ' + dim('(+ --length N)')),
    cmd('terminal kill <id>', 'Kill a terminal/agent tmux session'),
    cmd('terminal --all', 'Show sessions across all branches'),
    cmd('terminal reset', 'Kill tmux server, clear registry & snapshots'),
    '',
    `  ${bold(cyan('Agent'))}`,
    cmd('agent signal --status <s>', 'Signal agent status (done, error, running)'),
    cmd('agent spawn --prompt "..."', 'Spawn a headless agent session'),
    cmd('agent status --widget <id>', 'Check agent status'),
    cmd('agent peek --widget <id>', 'Peek at a headless agent session'),
    '',
    `  ${bold(cyan('Hub & Messaging'))}`,
    cmd('hub state --canvas <id>', 'Get hub state for a canvas'),
    cmd('hub send --hub <id> ...', 'Send a message to hub peers'),
    cmd('hub goal --hub <id> ...', 'Set hub goal'),
    cmd('hub conversation start', 'Start a hub conversation'),
    cmd('hub dissolve --canvas <id>', 'Dissolve all hubs for a canvas'),
    cmd('hub presence', 'List present agents'),
    cmd('messages publish ...', 'Publish to a channel'),
    cmd('messages read --channel <ch>', 'Read events from a channel'),
    cmd('prompt spawn --prompt "..."', 'Spawn a prompt agent session'),
    '',
    `  ${dim('Inside a storyboard terminal, shortcuts are available:')}`,
    cmd('start', 'Open the welcome screen'),
    cmd('start <agent>', 'Launch an agent ' + dim('(copilot, claude, codex)')),
    cmd('<agent>', 'Shorthand for start <agent> ' + dim('(accepts extra flags)')),
    '',
    `  ${bold(cyan('Setup'))}`,
    cmd('setup', 'Install deps, Caddy proxy, start proxy'),
    cmd('setup --skip-branch', 'Non-interactive setup (skip branch prompt)'),
    cmd('setup --branch=<name>', 'Setup + switch to a branch'),
    cmd('branch', 'Switch to a branch (interactive worktree guide)'),
    cmd('branch <name>', 'Switch to a specific branch directly'),
    cmd('branch --worktree=<name>', 'Non-interactive branch switch'),
    cmd('pull', 'Pull latest changes from remote (untracked-safe)'),
    cmd('publish', 'Push local commits to remote (pulls first)'),
    cmd('proxy start', 'Start or reload Caddy proxy'),
    cmd('proxy close', 'Stop Caddy proxy'),
    cmd('proxy restart', 'Restart the runtime daemon (use after upgrading)'),
    '',
    `  ${bold(cyan('Updates'))}`,
    cmd('update', 'Update storyboard packages to latest'),
    cmd('update:<tag>', 'Update to a specific tag ' + dim('(beta, alpha, ...)')),
    '',
    `  ${dim('All create commands accept --flags for non-interactive use.')}`,
    `  ${dim('Run')} ${yellow('npx storyboard create <type> --help')} ${dim('for flag details.')}`,
    '',
    `  ${dim('Usage:')} ${yellow('npx storyboard')} ${dim('<command>')}`,
    `  ${dim('Alias:')} ${yellow('npx sb')} ${dim('<command>')}`,
  ].join('\n')

  return `\n${mascot}\n${gettingStarted}\n${commands}\n`
}

const command = process.argv[2]

switch (command) {
  case 'dev':
  case 'run':
    import('./run.js')
    break
  case 'setup':
    import('./setup.js')
    break
  case 'branch':
    import('./branch.js')
    break
  case 'pull':
    import('./pull.js')
    break
  case 'publish':
    import('./publish.js')
    break
  case 'proxy':
    import('./proxy.js')
    break
  case 'create':
    import('./create.js')
    break
  case 'compact':
    import('./compact.js')
    break
  case 'canvas':
    if (process.argv[3] === 'add') {
      import('./canvasAdd.js')
    } else if (process.argv[3] === 'update') {
      import('./canvasUpdate.js')
    } else if (process.argv[3] === 'read' || !process.argv[3]) {
      import('./canvasRead.js')
    } else if (process.argv[3] === 'bounds') {
      import('./canvasBounds.js')
    } else if (process.argv[3] === 'broadcast') {
      import('./canvasBroadcast.js')
    } else if (process.argv[3] === 'alias') {
      const { handleAlias } = await import('./canvasAlias.js')
      handleAlias(process.argv.slice(4))
    } else if (process.argv[3] === 'connector') {
      import('./canvasConnector.js')
    } else if (process.argv[3] === 'delete') {
      import('./canvasDelete.js')
    } else if (process.argv[3] === 'duplicate') {
      import('./canvasDuplicate.js')
    } else if (process.argv[3] === 'delete-canvas') {
      import('./canvasDeleteCanvas.js')
    } else if (process.argv[3] === 'roles') {
      import('./canvasRoles.js')
    } else if (process.argv[3] === 'batch') {
      import('./canvasBatch.js')
    } else {
      const version = getVersion()
      console.log(helpScreen(version))
      p.log.error(`Unknown canvas subcommand: ${bold(process.argv[3] || '(none)')}`)
      process.exit(1)
    }
    break
  case 'exit':
    import('./exit.js')
    break
  case 'terminal':
    if (process.argv[3] === 'start') {
      import('./terminal-welcome.js')
    } else if (process.argv[3] === '--help' || process.argv[3] === 'help') {
      const cmd = (name, desc) => `    ${green(name.padEnd(36))}${desc}`
      const cmds = [
        `  ${bold(cyan('Terminal commands'))}`,
        cmd('terminal', 'Browse and manage terminal sessions (interactive)'),
        cmd('terminal start', 'Launch the terminal welcome prompt'),
        cmd('terminal close --id <name>', 'Archive a session'),
        cmd('terminal open --id <name>', 'Attach to a session'),
        cmd('terminal remove --id <name>', 'Permanently destroy a session'),
        cmd('terminal reset', 'Kill tmux server, clear registry & snapshots'),
        '',
        `  ${bold(cyan('Messaging'))}`,
        cmd('terminal send <id> "msg"', 'Send a message to a terminal'),
        cmd('terminal send --connected "msg"', 'Send to connected peer'),
        cmd('terminal output --summary "..."', 'Save latest output (+ --content)'),
        cmd('terminal status <widgetId>', 'Check terminal status'),
        cmd('terminal read <widgetId>', 'Read terminal buffer (+ --length N)'),
        cmd('terminal kill <widgetId>', 'Kill a terminal/agent tmux session'),
      ].join('\n')
      console.log(`\n${cmds}\n`)
    } else if (process.argv[3] === 'close' || process.argv[3] === 'archive') {
      import('./terminal-commands.js')
    } else if (process.argv[3] === 'open') {
      import('./terminal-commands.js')
    } else if (process.argv[3] === 'remove') {
      import('./terminal-commands.js')
    } else if (process.argv[3] === 'send') {
      import('./terminal-messaging.js').then(m => m.handleSend())
    } else if (process.argv[3] === 'output') {
      import('./terminal-messaging.js').then(m => m.handleOutput())
    } else if (process.argv[3] === 'status') {
      import('./terminal-messaging.js').then(m => m.handleStatus())
    } else if (process.argv[3] === 'read') {
      import('./terminal-messaging.js').then(m => m.handleRead())
    } else if (process.argv[3] === 'kill') {
      import('./terminal-messaging.js').then(m => m.handleKill())
    } else {
      // Default: session browser (formerly `storyboard sessions`)
      import('./sessions.js')
    }
    break
  case 'sessions':
    // Backwards compat alias
    import('./sessions.js')
    break
  case 'terminal-welcome':
    // Internal alias used by terminal-server
    import('./terminal-welcome.js')
    break
  case 'server':
    import('./server.js')
    break
  case 'agent':
    import('./agent.js')
    break
  case 'hub':
    import('./hubCommands.js')
    break
  case 'messages':
    import('./messagesCommands.js')
    break
  case 'prompt':
    import('./promptSpawn.js')
    break
  case 'code':
    import('./code.js')
    break
  case 'artifact':
    import('./artifact.js')
    break
  default: {
    if (command === 'update' || (command && command.startsWith('update:'))) {
      import('./updateVersion.js')
      break
    }
    const version = getVersion()

    if (command) {
      console.log(helpScreen(version))
      p.log.error(`Unknown command: ${bold(command)}`)
      process.exit(1)
    }

    console.log(helpScreen(version))
  }
}
