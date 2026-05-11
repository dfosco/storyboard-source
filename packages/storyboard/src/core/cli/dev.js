/**
 * storyboard dev [branch] — request a dev session from the Storyboard Runtime.
 *
 * Replaces the legacy per-repo server (kept at dev.legacy.js for reference).
 * The runtime daemon (~/.storyboard/runtime.lock) owns Vite child processes,
 * port allocation, and Caddy routes for the entire machine. This command is a
 * thin client that:
 *
 * 1. Resolves the target worktree (using the same logic as legacy).
 * 2. Reads devDomain from storyboard.config.json.
 * 3. POSTs /devserver/acquire to the runtime — auto-spawning the daemon if needed.
 * 4. Prints the canonical proxy URL the runtime returns.
 * 5. Holds the lease until SIGINT, then releases.
 *
 * Usage:
 *   storyboard dev                 # detect worktree from cwd
 *   storyboard dev main            # repo root
 *   storyboard dev <worktree>      # existing or auto-created worktree
 */

import * as p from '@clack/prompts'
import { execFileSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { detectWorktreeName, getPort, releasePort, repoRoot, worktreeDir } from '../worktree/port.js'
import { startRenameWatcher } from '../rename-watcher/watcher.js'
import { parseFlags } from './flags.js'
import { hasUncommittedChanges, localBranchExists, resolveDefaultBranch } from './dev-helpers.js'
import { compactAll } from '../canvas/compact.js'

const flagSchema = {
  port: { type: 'number', description: 'Override dev server port' },
  create: { type: 'boolean', default: true, description: 'Allow creating worktrees/branches (disable with --no-create)' },
  ttl: { type: 'number', default: 3600, description: 'Lease TTL in seconds (default 1h)' },
}

/**
 * Read the devDomain for this checkout from the **repo root**, never from
 * the worktree's own cwd.
 *
 * Why root-only: every worktree is a checkout of the same repo, so its
 * `storyboard.config.json` is just a branch's copy of the root's file.
 * Reading the worktree's copy first would let an experimental branch edit
 * silently pin a different devDomain, defeating the whole "one repo = one
 * devDomain" invariant that closes RCA hypothesis H3.
 */
function readDevDomain(targetCwd) {
  try {
    const root = repoRoot(targetCwd)
    const cfg = JSON.parse(readFileSync(resolve(root, 'storyboard.config.json'), 'utf8'))
    return cfg.devDomain || null
  } catch {
    return null
  }
}

// Returns true when the storyboard.config.json explicitly contains a
// `devDomain` key (even if the value happens to be the literal "storyboard").
// The runtime's FORBIDDEN_DEFAULT_DOMAIN guard exists to catch users who
// forgot to set one — it must not punish projects that legitimately picked
// "storyboard" (e.g. the storyboard repo itself).
function devDomainIsExplicit(targetCwd) {
  try {
    const root = repoRoot(targetCwd)
    const cfg = JSON.parse(readFileSync(resolve(root, 'storyboard.config.json'), 'utf8'))
    return Object.prototype.hasOwnProperty.call(cfg, 'devDomain')
  } catch {
    return false
  }
}

function remoteBranchExists(name, cwd) {
  try {
    const result = execFileSync('git', ['ls-remote', '--exit-code', '--heads', 'origin', name], { cwd, encoding: 'utf8' })
    return result.trim().length > 0
  } catch {
    return false
  }
}

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

async function resolveDevTarget(branchArg, { allowCreate = true } = {}) {
  if (!branchArg) {
    const detectedName = detectWorktreeName()
    const root = repoRoot()
    const realCwd = resolve(process.cwd())
    const isAtRoot = realCwd === resolve(root)
    if (detectedName === 'main' || !isAtRoot) {
      return { worktreeName: detectedName, targetCwd: process.cwd(), created: false }
    }
    const branch = detectedName
    const existingDir = worktreeDir(branch)
    if (existsSync(resolve(existingDir, '.git'))) {
      p.log.info(`Root is on branch "${branch}" — using existing worktree`)
      return { worktreeName: branch, targetCwd: existingDir, created: false }
    }
    if (!process.stdin.isTTY) {
      return { worktreeName: detectedName, targetCwd: process.cwd(), created: false }
    }
    p.log.warning(`Root is on branch "${branch}" instead of main.`)
    const shouldConvert = await p.confirm({
      message: `Convert "${branch}" to a worktree? (moves branch to worktrees/${branch}/)`,
      initialValue: true,
    })
    if (p.isCancel(shouldConvert) || !shouldConvert) {
      return { worktreeName: detectedName, targetCwd: process.cwd(), created: false }
    }
    if (!allowCreate) { p.log.error('Cannot convert — --no-create flag is set.'); process.exit(1) }
    if (hasUncommittedChanges(root)) {
      p.log.error('Cannot convert — uncommitted changes in working tree.')
      p.log.info('Commit or stash your changes first, then run `sb dev` again.')
      process.exit(1)
    }
    const defaultBranch = resolveDefaultBranch(root)
    if (!defaultBranch) { p.log.error('Cannot determine default branch (main/master). Switch root manually.'); process.exit(1) }
    p.log.step(`Switching root to "${defaultBranch}"`)
    execFileSync('git', ['checkout', defaultBranch], { cwd: root, stdio: 'inherit' })
    const targetDir = createWorktree(branch, root, { newBranch: false })
    return { worktreeName: branch, targetCwd: targetDir, created: true }
  }

  const root = repoRoot()
  const detectedName = detectWorktreeName()
  if (detectedName === branchArg) return { worktreeName: branchArg, targetCwd: process.cwd(), created: false }
  if (branchArg === 'main') return { worktreeName: 'main', targetCwd: root, created: false }
  const existingDir = worktreeDir(branchArg)
  if (existsSync(resolve(existingDir, '.git'))) {
    return { worktreeName: branchArg, targetCwd: existingDir, created: false }
  }
  if (!allowCreate) { p.log.error(`Worktree "${branchArg}" does not exist. Use without --no-create to auto-create.`); process.exit(1) }

  const hasLocal = localBranchExists(branchArg, root)
  const hasRemote = !hasLocal && remoteBranchExists(branchArg, root)
  if (hasLocal || hasRemote) {
    return { worktreeName: branchArg, targetCwd: createWorktree(branchArg, root, { newBranch: false }), created: true }
  }
  if (process.stdin.isTTY) {
    const confirmed = await p.confirm({ message: `Branch "${branchArg}" doesn't exist. Create it from HEAD?` })
    if (p.isCancel(confirmed) || !confirmed) { p.cancel('Cancelled.'); process.exit(0) }
  } else {
    p.log.step(`Branch "${branchArg}" not found — creating from HEAD`)
  }
  return { worktreeName: branchArg, targetCwd: createWorktree(branchArg, root, { newBranch: true }), created: true }
}

async function main() {
  const { flags, positional } = parseFlags(process.argv.slice(3), flagSchema)
  const branchArg = positional[0] || undefined
  const allowCreate = flags.create

  p.intro('storyboard dev')

  const { worktreeName, targetCwd, created } = await resolveDevTarget(branchArg, { allowCreate })
  if (created) p.log.success(`Worktree ready: worktrees/${worktreeName}`)
  else if (branchArg) p.log.info(`Using ${worktreeName === 'main' ? 'main repo' : `worktrees/${worktreeName}`}`)

  // M3b enforcement: devDomain MUST be set per-repo. The runtime refuses
  // the legacy default "storyboard" with FORBIDDEN_DEFAULT_DOMAIN, which
  // would surface as a useless error here. Catch it early with a helpful
  // suggestion derived from the repo folder name.
  const devDomain = readDevDomain(targetCwd)
  if (!devDomain) {
    const root = repoRoot(targetCwd)
    const suggested = root.split('/').filter(Boolean).pop()?.toLowerCase().replace(/[^a-z0-9-]/g, '-') || 'my-app'
    p.log.error('storyboard.config.json is missing a `devDomain`.')
    p.log.info(`Add e.g. {"devDomain": "${suggested}"} to ${root}/storyboard.config.json and rerun.`)
    p.log.info('This is required because two repos sharing the default "storyboard" devDomain produce the cross-branch URL bug.')
    p.log.info('Worktrees inherit the root devDomain — you only need to set this once at the repo root.')
    process.exit(1)
  }

  // Compact bloated canvas JSONL files before requesting Vite (preserves legacy behavior).
  const compacted = compactAll(targetCwd)
  for (const r of compacted) {
    p.log.info(`[compact] ${r.name}: ${(r.before / 1024).toFixed(0)}KB → ${(r.after / 1024).toFixed(0)}KB`)
  }

  // Lazy-load the runtime client so this CLI doesn't blow up during scaffold
  // (when dist/runtime/ may not be built yet).
  const { RuntimeClient } = await import('../../../dist/runtime/client/index.js')
  const runtime = new RuntimeClient()

  const s = p.spinner()
  s.start(`Acquiring dev server for ${devDomain}/${worktreeName}`)

  let result
  try {
    result = await runtime.acquire({
      slot: { devDomain, worktree: worktreeName },
      targetCwd: resolve(targetCwd),
      ttlSeconds: flags.ttl ?? 3600,
      // Allow the literal "storyboard" devDomain when the user set it
      // explicitly. The guard only catches the case where it was inherited
      // from the runtime default because the field was missing.
      allowDefaultDomain: devDomainIsExplicit(targetCwd),
    })
    s.stop(`Ready: ${result.lease.url}`)
  } catch (err) {
    s.stop('Failed')
    p.log.error(err.message || String(err))
    if (err.code === 'CONFLICT') p.log.info('Tip: another repo is already bound to this slot. Use a unique devDomain in storyboard.config.json.')
    if (err.code === 'FORBIDDEN_DEFAULT_DOMAIN') p.log.info('Tip: edit storyboard.config.json and replace "storyboard" with a unique devDomain.')
    process.exit(1)
  }

  p.log.info(`devserver port: ${result.devServer.port}`)
  p.log.info(`lease: ${result.lease.id} (renew before ${result.lease.expiresAt})`)
  p.log.info('Stop with Ctrl+C')

  const renameWatcher = startRenameWatcher(targetCwd)
  const compactInterval = setInterval(() => {
    try {
      const r = compactAll(targetCwd)
      for (const x of r) p.log.info(`[compact] ${x.name}: ${(x.before / 1024).toFixed(0)}KB → ${(x.after / 1024).toFixed(0)}KB`)
    } catch { /* non-critical */ }
  }, 15 * 60 * 1000)

  // Periodic lease renewal at half-TTL intervals so long sessions don't drop.
  const renewMs = Math.max(60_000, ((flags.ttl ?? 3600) * 1000) / 2)
  const renewInterval = setInterval(() => {
    runtime.renew({ leaseId: result.lease.id, ttlSeconds: flags.ttl ?? 3600 }).catch(() => undefined)
  }, renewMs)

  function shutdown() {
    clearInterval(compactInterval)
    clearInterval(renewInterval)
    renameWatcher.close()
    runtime.release({ leaseId: result.lease.id }).catch(() => undefined).finally(() => {
      releasePort(worktreeName)
      process.exit(0)
    })
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  p.outro('Server running')
}

main().catch((err) => {
  p.log.error(err.message || String(err))
  process.exit(1)
})
