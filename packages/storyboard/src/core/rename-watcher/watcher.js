/**
 * Rename Watcher
 *
 * Detects file and directory renames under watched directories and updates
 * canvas embed URLs (prototype and canvas widgets) to stay current.
 * Auto-commits the changes with a configurable prefix.
 *
 * Uses snapshot-based diffing: on any fs event, re-scans the watched
 * directories and compares old vs new file sets. Only unambiguous renames
 * (1:1 file or directory mappings) are acted on.
 *
 * Configuration is loaded from config.json in this directory.
 */

import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { materializeFromText } from '../canvas/materializer.js'
import { toCanvasId } from '../canvas/identity.js'

// ─── Logging ─────────────────────────────────────────────────────────

const dim = (s) => `\x1b[2m${s}\x1b[0m`
const green = (s) => `\x1b[32m${s}\x1b[0m`
const yellow = (s) => `\x1b[33m${s}\x1b[0m`

function log(msg) { console.log(dim(`  ◈ rename-watcher: ${msg}`)) }
function logSuccess(msg) { console.log(green(`  ✓ rename-watcher: ${msg}`)) }
function logWarn(msg) { console.log(yellow(`  ⚠ rename-watcher: ${msg}`)) }

// ─── Config ──────────────────────────────────────────────────────────

function loadConfig() {
  const configPath = new URL('./config.json', import.meta.url)
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
}

// ─── File scanning ───────────────────────────────────────────────────

/**
 * Scan a watched directory and return a Set of relative file paths
 * matching the configured extensions and exclusions.
 */
function scanDirectory(root, watchEntry, config) {
  const results = new Set()
  const absDir = path.join(root, watchEntry.path)

  if (!fs.existsSync(absDir)) return results

  const excludeDirs = new Set(config.exclude.directories)
  const excludePrefixes = config.exclude.filePrefixes
  const extensions = watchEntry.extensions

  function walk(dir, rel) {
    let entries
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }

    for (const entry of entries) {
      if (excludeDirs.has(entry.name)) continue
      const relPath = rel ? `${rel}/${entry.name}` : entry.name

      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name), relPath)
      } else {
        if (excludePrefixes.some((p) => entry.name.startsWith(p))) continue
        if (extensions.some((ext) => entry.name.endsWith(ext))) {
          results.add(relPath)
        }
      }
    }
  }

  walk(absDir, '')
  return results
}

// ─── Route computation ───────────────────────────────────────────────

/**
 * Compute the route path for a prototype file (relative to src/prototypes/).
 * Mirrors the route regex in src/routes.jsx.
 */
function prototypeRoute(relPath) {
  let route = relPath
    .replace(/[^/]*\.folder\//g, '')
    .replace(/\.(jsx|tsx|mdx)$/, '')
    .replace(/\/index$/, '')

  if (!route.startsWith('/')) route = '/' + route
  return route || '/'
}

/**
 * Compute the route path for a canvas file (relative to src/canvas/).
 * Uses toCanvasId() for proper folder handling.
 */
function canvasRoute(relPath) {
  // relPath is relative to src/canvas/, prepend prefix for toCanvasId()
  const canvasId = toCanvasId('src/canvas/' + relPath)
  return '/canvas/' + canvasId
}

function computeRoute(relPath, watchType) {
  if (watchType === 'prototype') return prototypeRoute(relPath)
  if (watchType === 'canvas') return canvasRoute(relPath)
  return null
}

// ─── Rename detection ────────────────────────────────────────────────

/**
 * Get compound extension (e.g. '.canvas.jsonl' not just '.jsonl').
 */
function getCompoundExt(filePath) {
  const base = path.basename(filePath)
  const parts = base.split('.')
  if (parts.length >= 3) return '.' + parts.slice(-2).join('.')
  return path.extname(filePath)
}

function groupByDir(paths) {
  const groups = new Map()
  for (const p of paths) {
    const dir = path.dirname(p)
    if (!groups.has(dir)) groups.set(dir, [])
    groups.get(dir).push(p)
  }
  return groups
}

/**
 * Find the longest common directory prefix of an array of paths.
 */
function commonDirPrefix(paths) {
  if (paths.length === 0) return ''
  if (paths.length === 1) {
    const dir = path.dirname(paths[0])
    return dir === '.' ? '' : dir + '/'
  }

  const sorted = [...paths].sort()
  const first = sorted[0]
  const last = sorted[sorted.length - 1]

  let i = 0
  while (i < first.length && i < last.length && first[i] === last[i]) i++

  const prefix = first.slice(0, i)
  const lastSlash = prefix.lastIndexOf('/')
  return lastSlash >= 0 ? prefix.slice(0, lastSlash + 1) : ''
}

/**
 * Detect renames by diffing old and new file snapshots.
 * Only returns unambiguous renames to avoid false positives.
 *
 * Phase 1 — File renames: same directory, same extension, exactly 1 removed + 1 added.
 * Phase 2 — Directory renames: a single directory-prefix swap explains all remaining changes.
 */
function detectRenames(oldSnapshot, newSnapshot, watchType) {
  const removed = [...oldSnapshot].filter((f) => !newSnapshot.has(f))
  const added = [...newSnapshot].filter((f) => !oldSnapshot.has(f))

  if (removed.length === 0 || added.length === 0) return []

  const renames = []
  const matchedRemoved = new Set()
  const matchedAdded = new Set()

  // Phase 1: File-level renames
  const removedByDir = groupByDir(removed)
  const addedByDir = groupByDir(added)

  for (const [dir, dirRemoved] of removedByDir) {
    const dirAdded = addedByDir.get(dir) || []
    if (dirRemoved.length !== 1 || dirAdded.length !== 1) continue
    if (getCompoundExt(dirRemoved[0]) !== getCompoundExt(dirAdded[0])) continue

    const oldRoute = computeRoute(dirRemoved[0], watchType)
    const newRoute = computeRoute(dirAdded[0], watchType)

    if (oldRoute === newRoute) continue

    renames.push({ oldPath: dirRemoved[0], newPath: dirAdded[0], oldRoute, newRoute })
    matchedRemoved.add(dirRemoved[0])
    matchedAdded.add(dirAdded[0])
  }

  // Phase 2: Directory-level renames
  const unmatchedRemoved = removed.filter((f) => !matchedRemoved.has(f))
  const unmatchedAdded = added.filter((f) => !matchedAdded.has(f))

  if (unmatchedRemoved.length > 0 && unmatchedRemoved.length === unmatchedAdded.length) {
    const oldPrefix = commonDirPrefix(unmatchedRemoved)
    const newPrefix = commonDirPrefix(unmatchedAdded)

    if (oldPrefix && newPrefix && oldPrefix !== newPrefix) {
      const expectedAdded = new Set(
        unmatchedRemoved.map((f) => newPrefix + f.slice(oldPrefix.length)),
      )
      const allMatch = unmatchedAdded.every((f) => expectedAdded.has(f))

      if (allMatch) {
        for (const oldFile of unmatchedRemoved) {
          const newFile = newPrefix + oldFile.slice(oldPrefix.length)
          const oldRoute = computeRoute(oldFile, watchType)
          const newRoute = computeRoute(newFile, watchType)
          if (oldRoute !== newRoute) {
            renames.push({ oldPath: oldFile, newPath: newFile, oldRoute, newRoute })
          }
        }
      }
    }
  }

  return renames
}

// ─── Canvas embed updating ───────────────────────────────────────────

/**
 * Find all .canvas.jsonl files in the project.
 */
function findAllCanvasFiles(root) {
  const results = []
  const ignore = new Set(['node_modules', 'dist', '.git', '.worktrees'])

  function walk(dir) {
    let entries
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const entry of entries) {
      if (ignore.has(entry.name)) continue
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(fullPath)
      else if (entry.name.endsWith('.canvas.jsonl')) results.push(fullPath)
    }
  }

  walk(root)
  return results
}

/**
 * Rewrite a URL's pathname if it matches a renamed route.
 * Uses segment-boundary matching to avoid partial matches (e.g. /Signup vs /Signup2).
 */
function rewriteUrl(src, renames) {
  const hashIdx = src.indexOf('#')
  const queryIdx = src.indexOf('?')

  let pathname, suffix
  if (hashIdx >= 0 && (queryIdx < 0 || hashIdx < queryIdx)) {
    pathname = src.slice(0, hashIdx)
    suffix = src.slice(hashIdx)
  } else if (queryIdx >= 0) {
    pathname = src.slice(0, queryIdx)
    suffix = src.slice(queryIdx)
  } else {
    pathname = src
    suffix = ''
  }

  for (const { oldRoute, newRoute } of renames) {
    if (!oldRoute || !newRoute) continue

    // Exact match
    if (pathname === oldRoute) return newRoute + suffix
    // Segment-boundary prefix match
    if (pathname.startsWith(oldRoute + '/')) {
      return newRoute + pathname.slice(oldRoute.length) + suffix
    }
  }

  return src
}

/**
 * Update widget embed refs for detected renames.
 * Returns the updated widgets array if any changed, null if unchanged.
 */
function updateWidgetRefs(widgets, renames) {
  let changed = false

  const updated = widgets.map((widget) => {
    // Only process embed widget types with a src prop
    if (widget.type !== 'prototype' && widget.type !== 'canvas') return widget

    const src = widget.props?.src
    if (!src || typeof src !== 'string') return widget

    const newSrc = rewriteUrl(src, renames)
    if (newSrc === src) return widget

    changed = true
    return { ...widget, props: { ...widget.props, src: newSrc } }
  })

  return changed ? updated : null
}

// ─── Auto-commit ─────────────────────────────────────────────────────

// Lock file placed in .git/ during commit. Both the rename watcher and
// autosync share the same working tree and git index, so this file
// lets autosync's isRepoBusy() (or any future tool) detect that the
// rename watcher is mid-commit and defer its own cycle.
const LOCK_FILENAME = 'storyboard-autofix.lock'

/**
 * Resolve the .git directory, handling both regular repos and worktrees.
 * In a worktree, `.git` is a file pointing to the real git dir.
 */
function resolveGitDir(root) {
  const dotGit = path.join(root, '.git')
  try {
    const stat = fs.statSync(dotGit)
    if (stat.isDirectory()) return dotGit
    // Worktree: .git is a file like "gitdir: /path/to/.git/worktrees/name"
    const content = fs.readFileSync(dotGit, 'utf-8').trim()
    const match = content.match(/^gitdir:\s*(.+)$/)
    if (match) return path.resolve(root, match[1])
  } catch { /* fallback */ }
  return dotGit
}

/**
 * Check if the repo is in a busy state that would conflict with a commit.
 *
 * Mirrors autosync's isRepoBusy() guards so both systems respect the same
 * signals: index.lock, rebase, merge, cherry-pick, and the autofix lock file.
 * Since both autosync and the rename watcher commit directly on the current
 * branch (same working tree, same index), index.lock is the primary mutex.
 */
function isRepoBusy(root) {
  const gitDir = resolveGitDir(root)

  if (fs.existsSync(path.join(gitDir, 'index.lock'))) {
    logWarn('Auto-commit deferred: index.lock present')
    return true
  }
  if (fs.existsSync(path.join(gitDir, 'MERGE_HEAD'))) {
    logWarn('Auto-commit deferred: merge in progress')
    return true
  }
  if (fs.existsSync(path.join(gitDir, 'CHERRY_PICK_HEAD'))) {
    logWarn('Auto-commit deferred: cherry-pick in progress')
    return true
  }
  if (fs.existsSync(path.join(gitDir, 'rebase-merge')) || fs.existsSync(path.join(gitDir, 'rebase-apply'))) {
    logWarn('Auto-commit deferred: rebase in progress')
    return true
  }

  // Check for our own stale lock (crash recovery)
  const lockPath = path.join(gitDir, LOCK_FILENAME)
  if (fs.existsSync(lockPath)) {
    try {
      const lockAge = Date.now() - fs.statSync(lockPath).mtimeMs
      if (lockAge < 10_000) {
        logWarn('Auto-commit deferred: previous autofix still in progress')
        return true
      }
      // Stale lock (>10s) — remove it
      fs.unlinkSync(lockPath)
    } catch { /* race — fine */ }
  }

  return false
}

/**
 * Auto-commit modified canvas files using git commit --only to isolate
 * from any other staged or unstaged user work.
 *
 * Coordinates with autosync (which shares the same working tree + index) via:
 * - Lock file (.git/storyboard-autofix.lock) to signal mid-commit
 * - Same repo-busy guards autosync checks (index.lock, merge, rebase, cherry-pick)
 * - git commit --only uses a temporary index, so it won't interfere with
 *   files autosync may have staged independently
 *
 * If the commit is deferred (busy repo), the canvas JSONL update is still
 * persisted on disk — autosync's next cycle will pick it up naturally.
 */
function autocommit(root, modifiedFiles, renames, config) {
  if (!config.autocommit.enabled || modifiedFiles.length === 0) return

  const relPaths = modifiedFiles.map((f) => path.relative(root, f))

  if (isRepoBusy(root)) return

  const gitDir = resolveGitDir(root)
  const lockPath = path.join(gitDir, LOCK_FILENAME)

  try {
    // Acquire lock so autosync (or other tools) can defer
    fs.writeFileSync(lockPath, `${process.pid}\n${Date.now()}\n`, 'utf-8')

    execFileSync('git', ['add', '--', ...relPaths], { cwd: root, stdio: 'pipe' })

    const summary = [...new Set(
      renames
        .filter((r) => r.oldRoute && r.newRoute)
        .map((r) => `${r.oldRoute} → ${r.newRoute}`),
    )].join(', ')

    const message = `${config.autocommit.prefix} Update embed URLs: ${summary}`

    execFileSync('git', ['commit', '--only', '--', ...relPaths, '-m', message], {
      cwd: root,
      stdio: 'pipe',
    })

    logSuccess(`Auto-committed: ${summary}`)
  } catch (err) {
    logWarn(`Auto-commit skipped: ${(err.message || '').split('\n')[0]}`)
  } finally {
    // Release lock
    try { fs.unlinkSync(lockPath) } catch { /* already gone */ }
  }
}

// ─── Main ────────────────────────────────────────────────────────────

/**
 * Process a detected change — rescan, detect renames, update embeds, commit.
 */
function processChange(root, snapshots, config) {
  const allRenames = []

  for (const entry of config.watch) {
    const oldSnapshot = snapshots.get(entry.path)
    const newSnapshot = scanDirectory(root, entry, config)
    const renames = detectRenames(oldSnapshot, newSnapshot, entry.type)
    if (renames.length > 0) allRenames.push(...renames)
    snapshots.set(entry.path, newSnapshot)
  }

  if (allRenames.length === 0) return

  // Deduplicate by route pair
  const uniqueRenames = []
  const seen = new Set()
  for (const r of allRenames) {
    const key = `${r.oldRoute}→${r.newRoute}`
    if (!seen.has(key)) {
      seen.add(key)
      uniqueRenames.push(r)
      log(`Detected: ${r.oldRoute} → ${r.newRoute}`)
    }
  }

  // Scan all canvas files and update embed references
  const canvasFiles = findAllCanvasFiles(root)
  const modifiedFiles = []

  for (const canvasFile of canvasFiles) {
    try {
      const text = fs.readFileSync(canvasFile, 'utf-8')
      const state = materializeFromText(text)

      if (!state.widgets || state.widgets.length === 0) continue

      const updatedWidgets = updateWidgetRefs(state.widgets, uniqueRenames)
      if (updatedWidgets) {
        const event = {
          event: 'widgets_replaced',
          timestamp: new Date().toISOString(),
          widgets: updatedWidgets,
        }
        fs.appendFileSync(canvasFile, JSON.stringify(event) + '\n', 'utf-8')
        modifiedFiles.push(canvasFile)
        log(`Updated embeds in ${path.relative(root, canvasFile)}`)
      }
    } catch (err) {
      logWarn(`Failed to update ${path.basename(canvasFile)}: ${err.message}`)
    }
  }

  autocommit(root, modifiedFiles, uniqueRenames, config)
}

/**
 * Start the rename watcher.
 * @param {string} root — project root directory
 * @returns {{ close: () => void }}
 */
export function startRenameWatcher(root) {
  const config = loadConfig()
  const watchers = []
  const snapshots = new Map()

  for (const entry of config.watch) {
    snapshots.set(entry.path, scanDirectory(root, entry, config))
  }

  let debounceTimer = null

  function handleChange() {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      try {
        processChange(root, snapshots, config)
      } catch (err) {
        logWarn(`Error: ${err.message}`)
      }
    }, config.debounceMs)
  }

  for (const entry of config.watch) {
    const absDir = path.join(root, entry.path)
    if (!fs.existsSync(absDir)) {
      logWarn(`Skipping ${entry.path} (not found)`)
      continue
    }

    try {
      const watcher = fs.watch(absDir, { recursive: true }, handleChange)
      watcher.on('error', (err) => logWarn(`${entry.path}: ${err.message}`))
      watchers.push(watcher)
    } catch (err) {
      logWarn(`Could not watch ${entry.path}: ${err.message}`)
    }
  }

  return {
    close() {
      if (debounceTimer) clearTimeout(debounceTimer)
      for (const w of watchers) w.close()
    },
  }
}
