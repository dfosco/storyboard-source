#!/usr/bin/env node
/**
 * storyboard terminal-welcome — interactive welcome prompt for new terminal sessions.
 *
 * Runs inside tmux, presents a Clack select prompt, loops back after
 * the chosen program exits.
 *
 * When called with --startup <cmd>, auto-launches that command on the first
 * iteration, then falls back to the interactive menu on subsequent iterations
 * (i.e. when the command exits). This makes the welcome screen the universal
 * supervisor for all terminal widget sessions.
 *
 * Usage (called automatically by terminal-server for new sessions):
 *   storyboard terminal-welcome [--branch <name>] [--canvas <name>]
 *   storyboard terminal-welcome --startup "copilot --agent terminal-agent" [--branch <name>] [--canvas <name>]
 */

import * as p from '@clack/prompts'
import { execSync, spawn } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { parseFlags } from './flags.js'
import { dim, bold } from './intro.js'
import { takePendingMessages } from '../canvas/terminal-config.js'

const blue = (s) => `\x1b[34m${s}\x1b[0m`
const yellow = (s) => `\x1b[33m${s}\x1b[0m`

/**
 * Drain any pending bytes from stdin to prevent stale mouse escape sequences
 * (or other buffered input) from being consumed by Clack prompts.
 * This is critical after tmux mouse mode was on — mouse events from the
 * browser widget are sent as escape sequences to stdin.
 */
function drainStdin() {
  if (!process.stdin.readable) return
  const wasPaused = process.stdin.isPaused?.()
  try {
    process.stdin.setRawMode?.(true)
    process.stdin.resume()
    // Read and discard all buffered data
    while (process.stdin.read() !== null) { /* discard */ }
  } catch { /* best effort */ }
  if (wasPaused) {
    try { process.stdin.pause() } catch { /* empty */ }
  }
}

// Prepend .storyboard/terminals/bin/ to PATH so `start`, `copilot`, etc.
// are available in child shells. Done once at startup; child shells inherit it.
const binDir = join(process.cwd(), '.storyboard', 'terminals', 'bin')
if (existsSync(binDir) && !process.env.PATH?.includes(binDir)) {
  process.env.PATH = `${binDir}:${process.env.PATH || ''}`
}

/**
 * Return a copy of process.env with the .storyboard/terminals/bin/ dir
 * stripped from PATH. Used when spawning agent commands so the real binary
 * is found instead of the wrapper scripts that route back through
 * terminal-welcome (which would cause infinite recursion).
 */
function agentEnv() {
  const cleanPath = (process.env.PATH || '').split(':')
    .filter(p => !p.endsWith('.storyboard/terminals/bin'))
    .join(':')
  return { ...process.env, PATH: cleanPath }
}

/**
 * Read agents config from storyboard.config.json.
 * Returns an array of { id, label, startupCommand, resumeCommand } entries.
 */
function loadAgents() {
  try {
    const raw = readFileSync(resolve(process.cwd(), 'storyboard.config.json'), 'utf8')
    const config = JSON.parse(raw)
    const agents = config?.canvas?.agents
    if (!agents || typeof agents !== 'object') return []
    return Object.entries(agents).map(([id, cfg]) => ({
      id,
      label: cfg.label || id,
      startupCommand: cfg.startupCommand || null,
      resumeCommand: cfg.resumeCommand || null,
      readinessSignal: cfg.readinessSignal || null,
      postStartup: cfg.postStartup || null,
    })).filter(a => a.startupCommand)
  } catch { return [] }
}

const agents = loadAgents()

// Enable/disable tmux mouse — must be off during Clack prompts (mouse
// events crash Clack), on during shell/copilot sessions (for scrolling).
function setMouse(on) {
  try { execSync(`tmux set-option mouse ${on ? 'on' : 'off'} 2>/dev/null`, { stdio: 'ignore' }) } catch { /* empty */ }
}

const flagSchema = {
  branch: { type: 'string', description: 'Current branch name' },
  canvas: { type: 'string', description: 'Current canvas name' },
  name: { type: 'string', description: 'Terminal pretty name' },
  startup: { type: 'string', description: 'Auto-launch this command on first iteration' },
}

const { flags } = parseFlags(process.argv.slice(3), flagSchema)
const branch = flags.branch || 'unknown'
const canvas = flags.canvas || 'unknown'
const prettyName = flags.name || null
const canvasShort = canvas === 'unknown' ? canvas : canvas.split('/').pop()
const startupCmd = flags.startup || null

/**
 * Reset terminal state after a child process exits.
 * Children (especially TUI apps) may leave the terminal in raw mode,
 * alternate screen, or with the cursor hidden.
 */
function resetTerminal() {
  // Leave alternate screen, show cursor, reset attributes
  process.stdout.write('\x1b[?1049l\x1b[?25h\x1b[0m')
  try { execSync('stty sane 2>/dev/null', { stdio: 'ignore' }) } catch { /* empty */ }
}

/**
 * Spawn an interactive shell with the storyboard bin dir on PATH.
 * zsh re-initializes PATH from .zshrc/.zprofile, so we inject an
 * `export PATH=...` via tmux send-keys after the shell initializes.
 */
function spawnShell() {
  const shell = process.env.SHELL || '/bin/zsh'
  const child = spawn(shell, [], { stdio: 'inherit' })

  // Inject PATH after shell init so `start`, `copilot`, etc. are available
  if (existsSync(binDir)) {
    setTimeout(() => {
      try {
        execSync(`tmux send-keys -l ${JSON.stringify(`export PATH="${binDir}:$PATH"`)}`, { stdio: 'ignore' })
        execSync(`tmux send-keys Enter`, { stdio: 'ignore' })
        setTimeout(() => {
          try {
            execSync(`tmux send-keys -l "clear"`, { stdio: 'ignore' })
            execSync(`tmux send-keys Enter`, { stdio: 'ignore' })
          } catch { /* empty */ }
        }, 200)
      } catch { /* empty */ }
    }, 500)
  }

  return new Promise((resolve) => {
    child.on('close', resolve)
    child.on('error', resolve)
  })
}

/**
 * Get the current tmux session name (safe — returns null outside tmux).
 */
function getTmuxName() {
  try {
    return execSync('tmux display-message -p "#{session_name}"', { encoding: 'utf8', timeout: 1000 }).trim() || null
  } catch { return null }
}

/**
 * Inject [System] identity message into the running agent via tmux send-keys.
 * Mirrors the identity injection in terminal-server.js so agents launched from
 * the welcome menu receive the same initial context.
 */
function injectIdentityMessage(tmuxName) {
  const widgetId = process.env.STORYBOARD_WIDGET_ID
  if (!tmuxName || !widgetId) return

  const canvasId = process.env.STORYBOARD_CANVAS_ID || canvas
  const serverUrl = process.env.STORYBOARD_SERVER_URL || ''
  const displayName = prettyName || widgetId
  const configFile = `.storyboard/terminals/${widgetId}.json`

  const msg = `[System] Your terminal identity has been set. widgetId=${widgetId} displayName=${displayName} canvasId=${canvasId} configFile=${configFile} serverUrl=${serverUrl} — this is a configuration step, no response needed.`
  try {
    execSync(`tmux send-keys -t "${tmuxName}" -l ${JSON.stringify(msg)}`, { stdio: 'ignore' })
    execSync(`tmux send-keys -t "${tmuxName}" Enter`, { stdio: 'ignore' })
  } catch { /* empty */ }
}

/**
 * Deliver pending messages to the running agent via tmux send-keys.
 * Uses takePendingMessages for atomic read+clear.
 */
function deliverPendingMessages(tmuxName) {
  const widgetId = process.env.STORYBOARD_WIDGET_ID
  if (!tmuxName || !widgetId) return

  const messages = takePendingMessages(widgetId)
  messages.forEach((msg, i) => {
    setTimeout(() => {
      try {
        const excerpt = msg.message.length > 200 ? msg.message.slice(0, 200) + '…' : msg.message
        const formatted = `📩 [${msg.fromName || msg.from || 'unknown'} → you]\n\`\`\`\n${excerpt}\n\`\`\`${msg.from ? `\nFull context: cat .storyboard/terminals/${msg.from}.json | jq '.latestOutput.content'` : ''}`
        execSync(`tmux send-keys -t "${tmuxName}" -l ${JSON.stringify(formatted)}`, { stdio: 'ignore' })
        execSync(`tmux send-keys -t "${tmuxName}" Enter`, { stdio: 'ignore' })
      } catch { /* empty */ }
    }, i * 1500)
  })
}

/**
 * Launch an agent by spawning its startupCommand via the user's shell.
 * After the agent reaches readiness, injects identity context and pending
 * messages — same treatment as the terminal-server cold path.
 *
 * @param {Object} agent - Agent config with label, startupCommand, readinessSignal, postStartup
 * @param {Object} [opts]
 * @param {boolean} [opts.isInitialStartup=false] - Skip context injection on the first
 *   --startup iteration (terminal-server.js handles it independently).
 */
async function launchAgent(agent, { isInitialStartup = false } = {}) {
  // Show metadata after selection
  const meta = [
    prettyName ? `${dim('name:')} ${blue(prettyName)}` : null,
    `${dim('branch:')} ${blue(branch)}`,
    `${dim('canvas:')} ${blue(canvasShort)}`,
  ].filter(Boolean).join('  ')
  p.log.info(meta)
  p.outro(dim(`Starting ${agent.label}...`))
  setMouse(true)

  let exitCode = null
  const startTime = Date.now()

  try {
    const shell = process.env.SHELL || '/bin/zsh'
    const child = spawn(shell, ['-lc', agent.startupCommand], {
      stdio: 'inherit',
      env: agentEnv(),
    })

    // Context injection — inject identity, postStartup, and pending messages
    // after the agent reaches readiness. Skip on initial --startup since
    // terminal-server.js handles that path independently.
    let pollInterval = null
    let readinessTimeout = null
    const tmuxName = !isInitialStartup ? getTmuxName() : null
    const widgetId = process.env.STORYBOARD_WIDGET_ID

    if (tmuxName && widgetId) {
      const readinessSignal = agent.readinessSignal
      const firstWord = agent.startupCommand.trim().split(/\s+/)[0]

      if (readinessSignal) {
        let contextSent = false
        pollInterval = setInterval(() => {
          if (contextSent) { clearInterval(pollInterval); pollInterval = null; return }
          try {
            const paneContent = execSync(
              `tmux capture-pane -t "${tmuxName}" -p`,
              { encoding: 'utf8', timeout: 1000 }
            )
            // Check configured readiness signal + copilot prompt fallback
            const isReady = paneContent.includes(readinessSignal) ||
              (firstWord === 'copilot' && paneContent.match(/^[>❯]\s*$/m))
            if (isReady) {
              contextSent = true
              clearInterval(pollInterval)
              pollInterval = null
              setTimeout(() => {
                if (agent.postStartup) {
                  try {
                    execSync(`tmux send-keys -t "${tmuxName}" -l ${JSON.stringify(agent.postStartup)}`, { stdio: 'ignore' })
                    execSync(`tmux send-keys -t "${tmuxName}" Enter`, { stdio: 'ignore' })
                  } catch { /* empty */ }
                }
                injectIdentityMessage(tmuxName)
                setTimeout(() => deliverPendingMessages(tmuxName), 2000)
              }, 500)
            }
          } catch { /* empty */ }
        }, 2000)
        // Timeout after 30s — don't wait forever
        readinessTimeout = setTimeout(() => {
          if (!contextSent) {
            contextSent = true
            if (pollInterval) { clearInterval(pollInterval); pollInterval = null }
          }
        }, 30000)
      } else {
        // No readiness signal configured — inject after a delay
        const delayTimer = setTimeout(() => {
          injectIdentityMessage(tmuxName)
          setTimeout(() => deliverPendingMessages(tmuxName), 2000)
        }, 5000)
        // Store reference for cleanup
        pollInterval = { clear: () => clearTimeout(delayTimer) }
      }
    }

    exitCode = await new Promise((resolve) => {
      child.on('close', (code) => {
        if (pollInterval) {
          if (typeof pollInterval.clear === 'function') pollInterval.clear()
          else clearInterval(pollInterval)
        }
        if (readinessTimeout) clearTimeout(readinessTimeout)
        resolve(code)
      })
      child.on('error', () => {
        if (pollInterval) {
          if (typeof pollInterval.clear === 'function') pollInterval.clear()
          else clearInterval(pollInterval)
        }
        if (readinessTimeout) clearTimeout(readinessTimeout)
        resolve(1)
      })
    })
  } catch {
    p.log.error(`Failed to start ${agent.label}. Is it installed?`)
    await new Promise(r => setTimeout(r, 2000))
    exitCode = 1
  } finally {
    // Always disable mouse and drain stdin before returning to the welcome
    // loop. Without this, tmux mouse escape sequences from the browser widget
    // accumulate in stdin while the agent runs, and Clack's p.select() reads
    // them as keystrokes — auto-selecting menu options in a tight loop.
    setMouse(false)
    await new Promise(r => setTimeout(r, 50))
    drainStdin()
  }

  const durationMs = Date.now() - startTime
  return { exitCode, durationMs }
}

async function welcomeLoop() {
  let firstIteration = true
  const MAX_STARTUP_RETRIES = 2

  while (true) {
    // On first iteration with --startup, auto-launch the command
    if (firstIteration && startupCmd) {
      firstIteration = false

      if (startupCmd === 'shell') {
        // Plain shell — spawn interactive shell, return to welcome on exit
        setMouse(true)
        try { await spawnShell() } catch { /* empty */ }
        resetTerminal()
        continue
      }

      // Try to match against a configured agent for label resolution
      const matchedAgent = agents.find(a =>
        startupCmd.startsWith(a.startupCommand?.split(' ')[0])
      )
      const agent = matchedAgent || { label: startupCmd.split(/\s+/)[0], startupCommand: startupCmd }

      let succeeded = false
      for (let attempt = 0; attempt < MAX_STARTUP_RETRIES; attempt++) {
        const result = await launchAgent(agent, { isInitialStartup: true })
        resetTerminal()

        // Normal exit (user quit the agent) — proceed to welcome menu
        if (result.exitCode === 0 || result.exitCode === null) { succeeded = true; break }

        // Non-zero exit — agent crashed or failed to start
        const isLastAttempt = attempt === MAX_STARTUP_RETRIES - 1
        if (isLastAttempt) {
          p.log.warn(yellow(`${agent.label} failed to start (exit code ${result.exitCode}).`))
          p.log.info(dim('Falling back to the welcome menu. You can retry from there.'))
          await new Promise(r => setTimeout(r, 2000))
        } else {
          p.log.warn(yellow(`${agent.label} exited unexpectedly (exit code ${result.exitCode}). Retrying...`))
          await new Promise(r => setTimeout(r, 3000))
        }
      }

      if (succeeded) continue
      // Fall through to the interactive welcome menu
    }
    firstIteration = false

    resetTerminal()
    setMouse(false)
    drainStdin()
    console.clear()
    p.intro(`${bold('storyboard terminal')}`)

    // Build the first option based on number of configured agents
    const agentOption = agents.length > 1
      ? { value: 'agents', label: '✦ Start a new agent session' }
      : { value: 'copilot', label: `✦ Start a new ${agents[0]?.label || 'Copilot'} session` }

    drainStdin()
    const action = await p.select({
      message: 'How would you like to start?',
      options: [
        agentOption,
        { value: 'shell', label: '▸ Start a new terminal session' },
        { value: 'sessions', label: '⊞ Browse existing sessions' },
      ],
    })

    if (p.isCancel(action)) {
      // Don't exit to shell on cancel — loop back to welcome
      continue
    }

    if (action === 'agents') {
      // Multi-agent sub-select
      drainStdin()
      const agentChoice = await p.select({
        message: 'Which agent?',
        options: agents.map(a => ({
          value: a.id,
          label: `✦ Start a new ${a.label} session`,
        })),
      })

      if (p.isCancel(agentChoice)) continue

      const agent = agents.find(a => a.id === agentChoice)
      if (agent) {
        await launchAgent(agent)
      }
      continue
    }

    if (action === 'copilot') {
      // Single agent — launch directly
      const agent = agents[0] || { label: 'Copilot', startupCommand: 'copilot --agent terminal-agent' }
      await launchAgent(agent)
      continue
    }

    // Show metadata for non-agent actions (shell, sessions)
    const meta = [
      prettyName ? `${dim('name:')} ${blue(prettyName)}` : null,
      `${dim('branch:')} ${blue(branch)}`,
      `${dim('canvas:')} ${blue(canvasShort)}`,
    ].filter(Boolean).join('  ')
    p.log.info(meta)

    if (action === 'shell') {
      p.outro(dim('Opening shell... Enter any command below.'))
      setMouse(true)
      // Spawn an interactive shell; when it exits, loop back to welcome
      try { await spawnShell() } catch { /* empty */ }
      continue
    }

    if (action === 'sessions') {
      // Sub-menu: pick which agent's sessions to browse, or terminal sessions
      const resumableAgents = agents.filter(a => a.resumeCommand)

      const sessionOptions = [
        ...resumableAgents.map(a => ({
          value: `agent:${a.id}`,
          label: `✦ ${a.label} sessions`,
        })),
        { value: 'terminal', label: '⊞ Terminal sessions' },
      ]

      drainStdin()
      const sessionChoice = await p.select({
        message: 'Browse sessions',
        options: sessionOptions,
      })

      if (p.isCancel(sessionChoice)) continue

      if (sessionChoice === 'terminal') {
        p.outro(dim('Loading terminal sessions...'))
        try {
          const child = spawn('storyboard', ['terminal'], { stdio: 'inherit' })
          await new Promise((resolve) => {
            child.on('close', resolve)
            child.on('error', resolve)
          })
        } catch {
          p.log.error('Failed to load sessions.')
          await new Promise(r => setTimeout(r, 2000))
        }
        continue
      }

      // Agent resume — spawn the resume command interactively
      if (sessionChoice.startsWith('agent:')) {
        const agentId = sessionChoice.replace('agent:', '')
        const agent = resumableAgents.find(a => a.id === agentId)
        if (agent) {
          p.outro(dim(`Loading ${agent.label} sessions...`))
          setMouse(true)
          try {
            const shell = process.env.SHELL || '/bin/zsh'
            const child = spawn(shell, ['-lc', agent.resumeCommand], {
              stdio: 'inherit',
              env: agentEnv(),
            })
            await new Promise((resolve) => {
              child.on('close', resolve)
              child.on('error', resolve)
            })
          } catch {
            p.log.error(`Failed to load ${agent.label} sessions.`)
            await new Promise(r => setTimeout(r, 2000))
          }
        }
        continue
      }

      continue
    }
  }
}

welcomeLoop().catch(() => {
  // On any error, just let the shell take over
})
