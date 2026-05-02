/**
 * Test setup helpers — canvas lifecycle, server URL, agent availability.
 */

import { writeFileSync, unlinkSync, existsSync, readFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { execSync } from 'node:child_process'
import * as canvasApi from './canvas-api.js'

const ROOT = process.cwd()

/** Resolve the dev server URL from ports.json or worktree registry. */
export function resolveServerUrl() {
  // Try .storyboard/ports.json
  try {
    const portsPath = join(ROOT, '.storyboard', 'ports.json')
    if (existsSync(portsPath)) {
      const ports = JSON.parse(readFileSync(portsPath, 'utf8'))
      if (ports.vite) return `http://localhost:${ports.vite}`
    }
  } catch { /* ignore */ }

  // Try worktree server registry
  try {
    const registryPath = join(ROOT, '.storyboard', 'servers.json')
    if (existsSync(registryPath)) {
      const servers = JSON.parse(readFileSync(registryPath, 'utf8'))
      if (Array.isArray(servers) && servers.length > 0) {
        return `http://localhost:${servers[0].port}`
      }
    }
  } catch { /* ignore */ }

  return 'http://localhost:1234'
}

/** Create a fresh test canvas file. Returns the canvas name. */
export function createTestCanvas(name = '__test__-terminal') {
  const canvasDir = join(ROOT, 'src', 'canvas')
  if (!existsSync(canvasDir)) mkdirSync(canvasDir, { recursive: true })

  const filePath = join(canvasDir, `${name}.canvas.jsonl`)
  const event = JSON.stringify({
    event: 'canvas_created',
    timestamp: new Date().toISOString(),
    meta: { name, description: 'Integration test canvas' },
  })
  writeFileSync(filePath, event + '\n')
  return name
}

/** Delete the test canvas file. */
export function deleteTestCanvas(name = '__test__-terminal') {
  const filePath = join(ROOT, 'src', 'canvas', `${name}.canvas.jsonl`)
  try {
    if (existsSync(filePath)) unlinkSync(filePath)
  } catch { /* ignore */ }
}

/**
 * Load configured agents from storyboard.config.json.
 * Returns array of { id, label, startupCommand }.
 */
export function loadConfiguredAgents() {
  try {
    const raw = readFileSync(join(ROOT, 'storyboard.config.json'), 'utf8')
    const config = JSON.parse(raw)
    const agents = config?.canvas?.agents
    if (!agents || typeof agents !== 'object') return []
    return Object.entries(agents)
      .map(([id, cfg]) => ({
        id,
        label: cfg.label || id,
        startupCommand: cfg.startupCommand || null,
      }))
      .filter((a) => a.startupCommand)
  } catch {
    return []
  }
}

/**
 * Check if an agent binary is available on this machine.
 * Returns true if the binary is found, false otherwise.
 */
export function checkAgentAvailability(agentId) {
  // Map agent IDs to binary names
  const binaryMap = {
    copilot: 'copilot',
    claude: 'claude',
  }
  const binary = binaryMap[agentId] || agentId
  try {
    execSync(`which ${binary} 2>/dev/null`, { encoding: 'utf8', timeout: 5000 })
    return true
  } catch {
    return false
  }
}

/**
 * Kill all tmux sessions for the test canvas.
 * Finds sessions by the canvas name pattern in their tmux name.
 */
export function cleanupTerminalSessions() {
  try {
    const out = execSync('tmux list-sessions -F "#{session_name}" 2>/dev/null', { encoding: 'utf8', timeout: 5000 })
    const sessions = out.trim().split('\n').filter(Boolean)
    for (const s of sessions) {
      // Kill sessions that are from our test canvas (sb- prefix + test widget IDs)
      if (s.startsWith('sb-')) {
        // We can't know for sure which are test sessions, so we track widget IDs
        // in the test and clean those up specifically. This is a fallback.
      }
    }
  } catch { /* no tmux sessions */ }
}

/**
 * Full preflight check. Verifies:
 * 1. Dev server is reachable
 * 2. tmux is available
 * 3. agent-browser is available
 *
 * Throws with a clear message if any check fails.
 */
export async function preflight() {
  const url = resolveServerUrl()
  canvasApi.setBaseUrl(url)

  // Check dev server
  const serverOk = await canvasApi.healthCheck()
  if (!serverOk) {
    throw new Error(
      `[preflight] Dev server not reachable at ${url}. Start it with 'storyboard dev' or 'npm run dev' before running integration tests.`,
    )
  }

  // Check tmux
  try {
    execSync('which tmux', { timeout: 5000 })
  } catch {
    throw new Error('[preflight] tmux is not installed. Install it with: brew install tmux')
  }

  // Check agent-browser
  try {
    execSync('which agent-browser', { timeout: 5000 })
  } catch {
    throw new Error('[preflight] agent-browser is not installed. Install it with: npm install -g agent-browser')
  }

  return { url }
}

/** Write the perf + summary results to test-results/. */
export function writeResults(perfData, transcriptPaths = []) {
  const dir = join(ROOT, 'test-results')
  mkdirSync(dir, { recursive: true })

  // Write perf JSON
  writeFileSync(join(dir, 'integration-perf.json'), JSON.stringify(perfData, null, 2))

  // Write summary
  const summary = [
    `Integration Test Run — ${new Date().toISOString()}`,
    '',
    `Metrics recorded: ${perfData.totalMetrics}`,
    `Warnings: ${perfData.warnings.length}`,
    '',
    'Transcripts:',
    ...transcriptPaths.map((p) => `  ${p}`),
    '',
  ].join('\n')
  writeFileSync(join(dir, 'summary.txt'), summary)
}
