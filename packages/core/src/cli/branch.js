/**
 * storyboard branch — Interactive guide to switch to a branch worktree.
 *
 * Deterministic flow (no AI):
 *   1. Ask which branch to work on
 *   2. Stash uncommitted work (named stash for safety)
 *   3. Create worktree if needed (git worktree add + npm install)
 *   4. Pull --rebase from origin
 *   5. Apply stash into the new worktree
 *   6. Confirm to user
 *
 * Also available as post-setup prompt in setup.js.
 *
 * Usage:
 *   npx storyboard branch
 *   npx storyboard branch <name>   # skip the prompt
 */

import * as p from '@clack/prompts'
import { execFileSync } from 'child_process'
import { existsSync } from 'fs'
import { resolve } from 'path'
import { repoRoot, worktreeDir, listWorktrees, getPort, detectWorktreeName } from '../worktree/port.js'
import { hasUncommittedChanges, localBranchExists } from './dev-helpers.js'
import { dim, green, bold, cyan } from './intro.js'

/** Check if a remote branch exists on origin. */
function remoteBranchExists(name, cwd) {
  try {
    const result = execFileSync('git', ['ls-remote', '--exit-code', '--heads', 'origin', name], { cwd, encoding: 'utf8' })
    return result.trim().length > 0
  } catch {
    return false
  }
}

/** Get the current branch name. */
function currentBranch(cwd) {
  try {
    return execFileSync('git', ['branch', '--show-current'], { cwd, encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
}

/** Validate a branch name for git. */
function isValidBranchName(name) {
  if (!name || name.trim().length === 0) return 'Branch name cannot be empty'
  const n = name.trim()
  if (/\s/.test(n)) return 'Branch name cannot contain spaces'
  if (/\.\./.test(n)) return 'Branch name cannot contain ".."'
  if (/[~^:\\]/.test(n)) return 'Branch name cannot contain ~, ^, :, or \\'
  if (n.startsWith('-')) return 'Branch name cannot start with "-"'
  if (n.endsWith('.lock')) return 'Branch name cannot end with ".lock"'
  return undefined
}

export async function runBranchGuide(branchArg) {
  const root = repoRoot()
  const existing = listWorktrees()
  const fromBranch = currentBranch(root)
  const fromWorktree = detectWorktreeName()

  // 1. Get branch name
  let targetBranch = branchArg?.trim()

  if (!targetBranch) {
    if (existing.length > 0) {
      // Render as columns that fit the terminal width
      const maxLen = Math.max(...existing.map(w => w.length))
      const colWidth = maxLen + 2
      const termWidth = process.stdout.columns || 80
      const cols = Math.max(1, Math.floor(termWidth / colWidth))
      const rows = Math.ceil(existing.length / cols)
      const lines = []
      for (let r = 0; r < rows; r++) {
        const parts = []
        for (let c = 0; c < cols; c++) {
          const idx = c * rows + r
          if (idx < existing.length) {
            parts.push(cyan(existing[idx].padEnd(colWidth)))
          }
        }
        lines.push(`  ${parts.join('')}`)
      }
      p.log.info(`${dim('Existing worktrees:')}\n${lines.join('\n')}`)
    }

    const result = await p.text({
      message: 'Which branch do you want to work on? Select one from above or type a new one',
      placeholder: 'e.g. 4.3.0--my-feature',
      validate: isValidBranchName,
    })

    if (p.isCancel(result)) {
      p.cancel('Cancelled')
      process.exit(0)
    }
    targetBranch = result.trim()
  }

  // 2. Check if worktree already exists
  const wtDir = worktreeDir(targetBranch)
  if (existsSync(resolve(wtDir, '.git'))) {
    p.log.success(`Worktree ${bold(targetBranch)} already exists`)
    p.note(
      [
        `  ${green('cd')} ${dim(`worktrees/${targetBranch}`)}`,
        `  ${green('npx storyboard dev')}  ${dim('to start developing')}`,
      ].join('\n'),
      'Ready to go'
    )
    p.outro('')
    return
  }

  // 3. Stash uncommitted work
  let didStash = false
  const sourceDir = fromWorktree === 'main' ? root : worktreeDir(fromWorktree)

  if (hasUncommittedChanges(sourceDir)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const stashName = `${fromBranch}→${targetBranch}@${timestamp}`

    p.log.step('Stashing uncommitted work…')
    try {
      execFileSync('git', ['stash', 'push', '-m', stashName], { cwd: sourceDir, stdio: 'pipe' })
      didStash = true
      p.log.success(`Work stashed: ${dim(stashName)}`)
    } catch {
      p.log.warning('Could not stash changes — proceeding anyway')
    }
  }

  // 4. Resolve branch and create worktree
  const hasLocal = localBranchExists(targetBranch, root)
  const hasRemote = !hasLocal && remoteBranchExists(targetBranch, root)
  const isNew = !hasLocal && !hasRemote

  if (isNew) {
    p.log.step(`Creating new branch ${bold(targetBranch)} from HEAD`)
  } else if (hasRemote) {
    // Fetch the remote branch so git worktree add can use it
    p.log.step(`Fetching ${bold(targetBranch)} from origin…`)
    try {
      execFileSync('git', ['fetch', 'origin', targetBranch], { cwd: root, stdio: 'pipe' })
      // Create a local tracking branch
      try {
        execFileSync('git', ['branch', targetBranch, `origin/${targetBranch}`], { cwd: root, stdio: 'pipe' })
      } catch { /* may already exist after fetch */ }
    } catch {
      p.log.warning('Could not fetch from origin — using local state')
    }
  } else {
    p.log.step(`Using existing branch ${bold(targetBranch)}`)
  }

  // Create the worktree
  const targetDir = resolve(root, 'worktrees', targetBranch)
  const spin = p.spinner()

  try {
    const gitArgs = isNew
      ? ['worktree', 'add', targetDir, '-b', targetBranch]
      : ['worktree', 'add', targetDir, targetBranch]

    spin.start(`Creating worktree worktrees/${targetBranch}`)
    execFileSync('git', gitArgs, { cwd: root, stdio: 'pipe' })
    spin.stop(`Worktree created: worktrees/${targetBranch}`)
  } catch (err) {
    spin.stop('Failed to create worktree')
    p.log.error(err.message || 'git worktree add failed')
    process.exit(1)
  }

  // Install dependencies
  try {
    spin.start('Installing dependencies…')
    const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm'
    execFileSync(npmBin, ['install'], { cwd: targetDir, stdio: 'pipe' })
    spin.stop('Dependencies installed')
  } catch {
    spin.stop('npm install failed — you may need to run it manually')
  }

  // Assign a dev server port
  getPort(targetBranch)

  // 5. Pull --rebase from origin
  if (!isNew) {
    try {
      spin.start('Pulling latest changes…')
      execFileSync('git', ['pull', '--rebase', 'origin', targetBranch], { cwd: targetDir, stdio: 'pipe' })
      spin.stop('Up to date with origin')
    } catch {
      spin.stop(dim('No remote changes (or origin not available)'))
    }
  }

  // 6. Apply stash (if we stashed earlier)
  if (didStash) {
    try {
      // Apply (not pop) — keeps the backup in stash list
      execFileSync('git', ['stash', 'apply'], { cwd: targetDir, stdio: 'pipe' })
      p.log.success('Previous work applied to this branch')
    } catch {
      p.log.warning('Stash apply had conflicts — resolve them manually')
      p.log.info(`  Your work is safe in ${dim('git stash list')}`)
    }
  }

  // 7. Summary
  const lines = [
    `  Your branch is set up as a worktree in ${green(`worktrees/${targetBranch}`)}`,
  ]
  if (didStash) {
    lines.push(`  Your uncommitted work has been safely moved`)
  }
  lines.push('')
  lines.push(`  ${green('cd')} ${dim(`worktrees/${targetBranch}`)}`)
  lines.push(`  ${green('npx storyboard dev')}  ${dim('to start developing')}`)
  lines.push('')
  lines.push(`  ${dim('Tip: ask your AI agent about worktrees — they\'re great!')}`)

  p.note(lines.join('\n'), `Branch ${bold(targetBranch)} is ready`)
  p.outro('')
}

// Direct invocation
const branchArg = process.argv[3] || undefined
p.intro('storyboard branch')
runBranchGuide(branchArg)
