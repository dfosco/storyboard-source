/**
 * storyboard dev [branch] — Start Vite with correct base path.
 *
 * If a storyboard server is already running (from another `sb dev`),
 * operates in "client mode": asks the existing server to spawn Vite
 * for this branch, prints the URL, and exits. This allows multiple
 * branches to run simultaneously through the same server + Caddy proxy.
 *
 * Otherwise, starts the server in the foreground as the "owner".
 * Ctrl+C kills Vite, releases the port, and exits cleanly.
 *
 * Usage:
 *   storyboard dev                 # detect worktree from cwd
 *   storyboard dev main            # start dev for repo root
 *   storyboard dev <worktree>      # start dev for existing worktree
 *   storyboard dev <branch>        # auto-create worktree + start dev
 *
 * Main:   http://<devDomain>.localhost/
 * Branch: http://<devDomain>.localhost/branch--<name>/
 */

import * as p from '@clack/prompts'
import http from 'node:http'
import { execFileSync } from 'child_process'
import { existsSync } from 'fs'
import { resolve } from 'path'
import { detectWorktreeName, getPort, releasePort, repoRoot, worktreeDir } from '../worktree/port.js'
import { generateCaddyfile, generateRouteConfig, upsertCaddyRoute, isCaddyRunning, readDevDomain } from './proxy.js'
import { startRenameWatcher } from '../rename-watcher/watcher.js'
import { parseFlags } from './flags.js'
import { hasUncommittedChanges, localBranchExists, resolveDefaultBranch } from './dev-helpers.js'
import { compactAll } from '../canvas/compact.js'

const flagSchema = {
  port: { type: 'number', description: 'Override dev server port' },
  create: { type: 'boolean', default: true, description: 'Allow creating worktrees/branches (disable with --no-create)' },
}

/**
 * Check if a remote branch exists on origin.
 * @param {string} name
 * @param {string} cwd
 * @returns {boolean}
 */
function remoteBranchExists(name, cwd) {
  try {
    const result = execFileSync('git', ['ls-remote', '--exit-code', '--heads', 'origin', name], { cwd, encoding: 'utf8' })
    return result.trim().length > 0
  } catch {
    return false
  }
}

/**
 * Create a git worktree and install dependencies.
 * @param {string} name — worktree/branch name
 * @param {string} root — repo root path
 * @param {object} opts
 * @param {boolean} opts.newBranch — create a new branch from HEAD
 * @returns {string} path to the new worktree directory
 */
function createWorktree(name, root, { newBranch = false } = {}) {
  const targetDir = resolve(root, 'worktrees', name)

  const gitArgs = newBranch
    ? ['worktree', 'add', targetDir, '-b', name]
    : ['worktree', 'add', targetDir, name]

  p.log.step(`Creating worktree: worktrees/${name}`)
  execFileSync('git', gitArgs, { cwd: root, stdio: 'inherit' })

  p.log.step('Installing dependencies…')
  const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  execFileSync(npmBin, ['install'], { cwd: targetDir, stdio: 'inherit' })

  getPort(name)
  return targetDir
}

/**
 * Resolve the target worktree for `storyboard dev [branch]`.
 *
 * When no argument is given and the repo root is on a non-main branch,
 * prompts the user to convert it to a proper worktree.
 *
 * @param {string|undefined} branchArg — positional branch argument
 * @param {object} opts
 * @param {boolean} opts.allowCreate — whether creation is allowed
 * @returns {Promise<{ worktreeName: string, targetCwd: string, created: boolean }>}
 */
async function resolveDevTarget(branchArg, { allowCreate = true } = {}) {
  // No argument — detect from cwd
  if (!branchArg) {
    const detectedName = detectWorktreeName()

    // Already in a worktree or on main — use cwd as-is
    const root = repoRoot()
    const realCwd = resolve(process.cwd())
    const isAtRoot = realCwd === resolve(root)
    if (detectedName === 'main' || !isAtRoot) {
      return { worktreeName: detectedName, targetCwd: process.cwd(), created: false }
    }

    // Root is on a non-main branch — check for existing worktree first
    const branch = detectedName
    const existingDir = worktreeDir(branch)
    if (existsSync(resolve(existingDir, '.git'))) {
      p.log.info(`Root is on branch "${branch}" — using existing worktree`)
      return { worktreeName: branch, targetCwd: existingDir, created: false }
    }

    // No worktree exists — prompt the user to convert
    p.log.warning(`Root is on branch "${branch}" instead of main.`)
    const shouldConvert = await p.confirm({
      message: `Convert "${branch}" to a worktree? (moves branch to worktrees/${branch}/)`,
      initialValue: true,
    })

    if (p.isCancel(shouldConvert) || !shouldConvert) {
      // User declined — proceed with root as-is (legacy behavior)
      return { worktreeName: detectedName, targetCwd: process.cwd(), created: false }
    }

    // User accepted — validate and convert
    if (!allowCreate) {
      p.log.error('Cannot convert — --no-create flag is set.')
      process.exit(1)
    }

    if (hasUncommittedChanges(root)) {
      p.log.error('Cannot convert — uncommitted changes in working tree.')
      p.log.info('Commit or stash your changes first, then run `sb dev` again.')
      process.exit(1)
    }

    const defaultBranch = resolveDefaultBranch(root)
    if (!defaultBranch) {
      p.log.error('Cannot determine default branch (main/master). Switch root manually.')
      process.exit(1)
    }

    p.log.step(`Switching root to "${defaultBranch}"`)
    execFileSync('git', ['checkout', defaultBranch], { cwd: root, stdio: 'inherit' })

    const targetDir = createWorktree(branch, root, { newBranch: false })

    // Offer to open the new worktree in VS Code
    const shouldOpen = await p.confirm({
      message: 'Open this worktree in VS Code?',
      initialValue: true,
    })
    if (shouldOpen && !p.isCancel(shouldOpen)) {
      try {
        execFileSync('code', [targetDir], { stdio: 'inherit' })
      } catch {
        p.log.warning(`Could not open VS Code. Run: code ${targetDir}`)
      }
    }

    return { worktreeName: branch, targetCwd: targetDir, created: true }
  }

  const root = repoRoot()

  // "main" → repo root
  if (branchArg === 'main') {
    return { worktreeName: 'main', targetCwd: root, created: false }
  }

  // Existing worktree directory
  const existingDir = worktreeDir(branchArg)
  if (existsSync(resolve(existingDir, '.git'))) {
    return { worktreeName: branchArg, targetCwd: existingDir, created: false }
  }

  // From here on we need to create — check if allowed
  if (!allowCreate) {
    p.log.error(`Worktree "${branchArg}" does not exist. Use without --no-create to auto-create.`)
    process.exit(1)
  }

  // Branch exists (local or remote) — create worktree from it
  const hasLocal = localBranchExists(branchArg, root)
  const hasRemote = !hasLocal && remoteBranchExists(branchArg, root)

  if (hasLocal || hasRemote) {
    const targetDir = createWorktree(branchArg, root, { newBranch: false })
    return { worktreeName: branchArg, targetCwd: targetDir, created: true }
  }

  // Branch doesn't exist — interactive TTY gets a prompt, non-interactive auto-creates
  const isTTY = process.stdin.isTTY

  if (isTTY) {
    const confirmed = await p.confirm({
      message: `Branch "${branchArg}" doesn't exist. Create it from HEAD?`,
    })
    if (p.isCancel(confirmed) || !confirmed) {
      p.cancel('Cancelled.')
      process.exit(0)
    }
  } else {
    p.log.step(`Branch "${branchArg}" not found — creating from HEAD`)
  }

  const targetDir = createWorktree(branchArg, root, { newBranch: true })
  return { worktreeName: branchArg, targetCwd: targetDir, created: true }
}

// ─── Server Detection ───

/**
 * Check if a storyboard server is already running on the expected port.
 * Returns the server's health response if running, or null.
 */
function checkExistingServer(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/health`, (res) => {
      let data = ''
      res.on('data', (c) => (data += c))
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch { resolve(null) }
      })
    })
    req.on('error', () => resolve(null))
    req.setTimeout(2000, () => { req.destroy(); resolve(null) })
  })
}

/**
 * Ask an existing server to spawn Vite for a branch via the switch-branch API.
 * Returns the parsed JSON response.
 */
function requestSwitchBranch(port, branch) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ branch })
    const req = http.request(
      { hostname: 'localhost', port, path: '/_storyboard/switch-branch', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
      (res) => {
        let data = ''
        res.on('data', (c) => (data += c))
        res.on('end', () => {
          try {
            const json = JSON.parse(data)
            if (res.statusCode >= 400) reject(new Error(json.error || `HTTP ${res.statusCode}`))
            else resolve(json)
          } catch { reject(new Error(`Bad response: ${data}`)) }
        })
      }
    )
    req.on('error', reject)
    req.setTimeout(90_000, () => { req.destroy(); reject(new Error('Timeout waiting for Vite to start')) })
    req.end(body)
  })
}

// ─── Client Mode ───

/**
 * Run in client mode: an existing server handles Vite lifecycle.
 * We just ask it to start the branch, print URLs, and exit.
 */
async function runClientMode(serverPort, worktreeName, domain) {
  const isMain = worktreeName === 'main'
  const basePath = isMain ? '/' : `/branch--${worktreeName}/`
  const proxyUrl = `http://${domain}${basePath}`

  p.log.info(`Server already running on :${serverPort} — requesting dev session for "${worktreeName}"...`)

  try {
    const result = await requestSwitchBranch(serverPort, worktreeName)

    if (result.status === 'already_running') {
      p.log.success(`Already running: ${proxyUrl}`)
    } else {
      p.log.success(`Started: ${proxyUrl}`)
    }

    p.log.info(`Stop with: npx storyboard server stop ${worktreeName}`)
    p.outro('Ready')
  } catch (err) {
    p.log.error(`Failed to start dev for "${worktreeName}": ${err.message}`)
    process.exit(1)
  }
}

// ─── Owner Mode ───

/**
 * Run in owner mode: start the server + Vite in the foreground.
 * This is the original behavior — the process owns the server lifecycle.
 */
async function runOwnerMode(worktreeName, targetCwd, domain, serverPort) {
  getPort(worktreeName) // allocate port for this worktree
  const isMain = worktreeName === 'main'
  const basePath = isMain ? '/' : `/branch--${worktreeName}/`
  const proxyUrl = `http://${domain}${basePath}`

  p.log.info('Starting storyboard server...')

  const { startServer, spawnViteForBranch } = await import('../server/index.js')

  let serverInstance
  try {
    serverInstance = await startServer()
  } catch (err) {
    if (err.code === 'EADDRINUSE') {
      // Race condition: server started between our health check and bind attempt.
      // Fall back to client mode.
      p.log.info('Server started by another process — switching to client mode...')
      await runClientMode(serverPort, worktreeName, domain)
      return
    }
    throw err
  }

  // Compact bloated canvas JSONL files before starting Vite
  const compacted = compactAll(targetCwd)
  if (compacted.length > 0) {
    for (const r of compacted) {
      p.log.info(`[compact] ${r.name}: ${(r.before / 1024).toFixed(0)}KB → ${(r.after / 1024).toFixed(0)}KB`)
    }
  }

  const entry = spawnViteForBranch(worktreeName)
  const renameWatcher = startRenameWatcher(targetCwd)

  const compactInterval = setInterval(() => {
    try {
      const results = compactAll(targetCwd)
      for (const r of results) {
        p.log.info(`[compact] ${r.name}: ${(r.before / 1024).toFixed(0)}KB → ${(r.after / 1024).toFixed(0)}KB`)
      }
    } catch { /* non-critical */ }
  }, 15 * 60 * 1000)

  function cleanup() {
    renameWatcher.close()
    clearInterval(compactInterval)
    try { entry.child.kill('SIGTERM') } catch { /* already dead */ }
    try { serverInstance.close() } catch { /* best effort */ }
    releasePort(worktreeName)
    process.exit(0)
  }
  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)

  const ready = await (async () => {
    const start = Date.now()
    while (Date.now() - start < 60_000) {
      if (entry.status === 'ready') return true
      await new Promise(r => setTimeout(r, 300))
    }
    return false
  })()

  if (ready) {
    const actualDirectUrl = `http://localhost:${entry.port}${basePath}`

    if (isCaddyRunning()) {
      const routeConfig = generateRouteConfig({ [worktreeName]: entry.port })
      if (upsertCaddyRoute(routeConfig)) {
        generateCaddyfile({ [worktreeName]: entry.port })
      }
      p.log.success(`${proxyUrl}`)
      p.log.info(`direct: ${actualDirectUrl}`)
    } else {
      p.log.success(actualDirectUrl)
      p.log.warning('Proxy not running — run `npx storyboard setup` for clean URLs')
    }
    p.outro('Ready')

    entry.child.stdout.pipe(process.stdout)
    entry.child.stderr.pipe(process.stderr)
  } else {
    p.log.warning(`Vite may still be starting — check ${proxyUrl}`)
    p.outro('Server running')
  }

  entry.child.on('exit', (code) => {
    renameWatcher.close()
    clearInterval(compactInterval)
    try { serverInstance.close() } catch { /* best effort */ }
    if (code && code !== 0) {
      p.log.error(`Vite exited with code ${code}`)
    }
    process.exit(code ?? 0)
  })
}

// ─── Main ───

async function main() {
  const { flags, positional } = parseFlags(process.argv.slice(3), flagSchema)

  const branchArg = positional[0] || undefined
  const allowCreate = flags.create

  p.intro('storyboard dev')

  const { worktreeName, targetCwd, created } = await resolveDevTarget(branchArg, { allowCreate })

  if (created) {
    p.log.success(`Worktree ready: worktrees/${worktreeName}`)
  } else if (branchArg) {
    p.log.info(`Using ${worktreeName === 'main' ? 'main repo' : `worktrees/${worktreeName}`}`)
  }

  const domain = readDevDomain(targetCwd)

  // Check if a storyboard server is already running for this repo
  const { SERVER_PORT } = await import('../server/index.js')
  const existingServer = await checkExistingServer(SERVER_PORT)

  if (existingServer?.ok) {
    // Validate the running server belongs to the same repo (devDomain match)
    if (existingServer.devDomain && existingServer.devDomain !== domain) {
      p.log.error(`Port ${SERVER_PORT} is in use by a different project (domain: ${existingServer.devDomain}).`)
      p.log.info('Stop it with `npx storyboard exit`, or use a different devDomain in storyboard.config.json.')
      process.exit(1)
    }
    await runClientMode(SERVER_PORT, worktreeName, domain)
  } else {
    await runOwnerMode(worktreeName, targetCwd, domain, SERVER_PORT)
  }
}

main()
