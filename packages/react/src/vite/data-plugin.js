import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { globSync } from 'glob'
import { parse as parseJsonc } from 'jsonc-parser'
import { materializeFromText } from '@dfosco/storyboard-core/canvas/materializer'
import { toCanvasId } from '@dfosco/storyboard-core/canvas/identity'
import { isCanvasWriteInFlight } from '@dfosco/storyboard-core/canvas/writeGuard'
import { getConfig } from '@dfosco/storyboard-core/config'
import { list as listRunningServers } from '@dfosco/storyboard-core/worktree/serverRegistry'

const VIRTUAL_MODULE_ID = 'virtual:storyboard-data-index'
const RESOLVED_ID = '\0' + VIRTUAL_MODULE_ID

const GLOB_PATTERN = '**/*.{flow,scene,object,record,prototype,folder}.{json,jsonc}'
const CANVAS_GLOB_PATTERN = '**/*.canvas.jsonl'
const CANVAS_META_GLOB_PATTERN = '**/*.meta.json'
const STORY_GLOB_PATTERN = '**/*.story.{jsx,tsx}'

/**
 * Extract the data name and type suffix from a file path.
 * Flows, records, and objects inside src/prototypes/{Name}/ get prefixed with
 * the prototype name (e.g. "Dashboard/default", "Dashboard/helpers").
 * Directories ending in .folder/ are skipped when extracting prototype scope.
 *
 * e.g. "src/data/default.flow.json"                → { name: "default",           suffix: "flow" }
 *      "src/prototypes/Dashboard/default.flow.json" → { name: "Dashboard/default", suffix: "flow" }
 *      "src/prototypes/Dashboard/helpers.object.json"→ { name: "Dashboard/helpers", suffix: "object" }
 *      "src/prototypes/X.folder/Dashboard/default.flow.json" → { name: "Dashboard/default", suffix: "flow", folder: "X" }
 */
function parseDataFile(filePath) {
  const base = path.basename(filePath)

  // Handle .canvas.jsonl files
  const canvasJsonlMatch = base.match(/^(.+)\.canvas\.jsonl$/)
  if (canvasJsonlMatch) {
    if (canvasJsonlMatch[1].startsWith('_')) return null
    const normalized = filePath.replace(/\\/g, '/')
    if (normalized.split('/').some(seg => seg.startsWith('_'))) return null

    const baseName = canvasJsonlMatch[1]
    let name = baseName
    let inferredRoute = null
    const canvasFolderMatch = normalized.match(/(?:^|\/)src\/canvas\/([^/]+)\.folder\//)
    const canvasFolderName = canvasFolderMatch ? canvasFolderMatch[1] : null
    const folderDirMatch = normalized.match(/(?:^|\/)src\/prototypes\/([^/]+)\.folder\//)
    const folderName = folderDirMatch ? folderDirMatch[1] : null

    const canvasCheck = normalized.match(/(?:^|\/)src\/canvas\//)
    if (canvasCheck) {
      const dirPath = normalized.substring(0, normalized.lastIndexOf('/'))
      // Path-based ID: include folder context for uniqueness.
      // .folder dirs contribute their name (sans .folder suffix) to the ID.
      const idBase = (dirPath + '/')
        .replace(/^.*?src\/canvas\//, '')
        .replace(/\.folder\/?/g, '/')
        .replace(/\/+/g, '/')
        .replace(/\/$/, '')
      name = idBase ? `${idBase}/${baseName}` : baseName
      inferredRoute = '/canvas/' + name
      inferredRoute = inferredRoute.replace(/\/+/g, '/').replace(/\/$/, '') || '/canvas'
    }
    const protoCheck = normalized.match(/(?:^|\/)src\/prototypes\//)
    if (!canvasCheck && protoCheck) {
      const dirPath = normalized.substring(0, normalized.lastIndexOf('/'))
      // For prototypes, .folder is purely organizational — strip entirely
      const idBase = (dirPath + '/')
        .replace(/^.*?src\/prototypes\//, '')
        .replace(/[^/]*\.folder\/?/g, '')
        .replace(/\/+/g, '/')
        .replace(/\/$/, '')
      name = idBase ? `${idBase}/${baseName}` : baseName
      inferredRoute = '/canvas/' + name
      inferredRoute = inferredRoute.replace(/\/+/g, '/').replace(/\/$/, '') || '/canvas'
    }
    // Derive group: canvases sharing a directory form a group
    const slashIdx = name.lastIndexOf('/')
    const group = canvasFolderName || (slashIdx > 0 ? name.substring(0, slashIdx) : null)
    // Extract a relative path for toCanvasId (it expects src/canvas/... or src/prototypes/...)
    const canvasIdInput = normalized.replace(/^.*?(src\/(?:canvas|prototypes)\/)/, '$1')
    return { name, suffix: 'canvas', ext: 'jsonl', folder: canvasFolderName || folderName, inferredRoute, id: toCanvasId(canvasIdInput), group }
  }

  // Handle canvas .meta.json files
  const metaMatch = base.match(/^(.+)\.meta\.json$/)
  if (metaMatch) {
    const normalized = filePath.replace(/\\/g, '/')
    // Only handle meta files inside src/canvas/ directories
    const canvasCheck = normalized.match(/(?:^|\/)src\/canvas\//)
    if (!canvasCheck) return null
    // Skip _-prefixed
    if (metaMatch[1].startsWith('_')) return null
    if (normalized.split('/').some(seg => seg.startsWith('_'))) return null
    return { name: metaMatch[1], suffix: 'canvas-meta', ext: 'json', inferredRoute: null }
  }

  // Handle .story.jsx / .story.tsx files
  const storyMatch = base.match(/^(.+)\.story\.(jsx|tsx)$/)
  if (storyMatch) {
    if (storyMatch[1].startsWith('_')) return null
    const normalized = filePath.replace(/\\/g, '/')
    if (normalized.split('/').some(seg => seg.startsWith('_'))) return null

    const name = storyMatch[1]
    let inferredRoute = null

    // All stories route under /components/ regardless of directory location
    const canvasCheck = normalized.match(/(?:^|\/)src\/canvas\//)
    const componentsCheck = normalized.match(/(?:^|\/)src\/components\//)
    if (canvasCheck) {
      const dirPath = normalized.substring(0, normalized.lastIndexOf('/'))
      const routeBase = (dirPath + '/')
        .replace(/^.*?src\/canvas\//, '')
        .replace(/[^/]*\.folder\/?/g, '')
        .replace(/\/$/, '')
      inferredRoute = '/components/' + (routeBase ? routeBase + '/' : '') + name
      inferredRoute = inferredRoute.replace(/\/+/g, '/').replace(/\/$/, '') || '/components'
    } else if (componentsCheck) {
      const dirPath = normalized.substring(0, normalized.lastIndexOf('/'))
      const routeBase = (dirPath + '/')
        .replace(/^.*?src\/components\//, '')
        .replace(/[^/]*\.folder\/?/g, '')
        .replace(/\/$/, '')
      inferredRoute = '/components/' + (routeBase ? routeBase + '/' : '') + name
      inferredRoute = inferredRoute.replace(/\/+/g, '/').replace(/\/$/, '') || '/components'
    }

    return { name, suffix: 'story', ext: storyMatch[2], inferredRoute }
  }

  const match = base.match(/^(.+)\.(flow|scene|object|record|prototype|folder)\.(jsonc?)$/)
  if (!match) return null

  // Skip _-prefixed files (drafts/internal)
  if (match[1].startsWith('_')) return null

  // Skip files inside _-prefixed directories
  const normalized = filePath.replace(/\\/g, '/')
  if (normalized.split('/').some(seg => seg.startsWith('_'))) return null
  // Normalize .scene → .flow for backward compatibility
  const suffix = match[2] === 'scene' ? 'flow' : match[2]
  let name = match[1]

  // Detect if this file is inside a .folder/ directory
  const folderDirMatch = normalized.match(/(?:^|\/)src\/prototypes\/([^/]+)\.folder\//)
  const folderName = folderDirMatch ? folderDirMatch[1] : null

  // Folder metadata files are keyed by their folder directory name (sans .folder suffix)
  if (suffix === 'folder') {
    if (folderName) {
      name = folderName
    }
    return { name, suffix, ext: match[3] }
  }

  // Prototype metadata files are keyed by their prototype directory name
  // (skip .folder/ segments when determining prototype name)
  if (suffix === 'prototype') {
    const protoMatch = normalized.match(/(?:^|\/)src\/prototypes\/(?:[^/]+\.folder\/)?([^/]+)\//)
    if (protoMatch) {
      name = protoMatch[1]
    }
    return { name, suffix, ext: match[3], folder: folderName }
  }

  // Scope flows, records, and objects inside src/prototypes/{Name}/ with a prefix
  // (skip .folder/ segments when determining prototype name)
  const protoMatch = normalized.match(/(?:^|\/)src\/prototypes\/(?:[^/]+\.folder\/)?([^/]+)\//)
  if (protoMatch) {
    name = `${protoMatch[1]}/${name}`
  }

  // Infer route for prototype-scoped flows from their file path.
  // Mirrors the generouted route regex: strip src/prototypes/ and *.folder/ segments.
  let inferredRoute = null
  if (suffix === 'flow') {
    const protoCheck = normalized.match(/(?:^|\/)src\/prototypes\//)
    if (protoCheck) {
      const dirPath = normalized.substring(0, normalized.lastIndexOf('/'))
      inferredRoute = '/' + dirPath
        .replace(/^.*?src\/prototypes\//, '')
        .replace(/[^/]*\.folder\//g, '')
      // Normalize trailing slash and double slashes
      inferredRoute = inferredRoute.replace(/\/+/g, '/').replace(/\/$/, '') || '/'
    }
  }

  return { name, suffix, ext: match[3], inferredRoute }
}

/**
 * Batch-fetch git metadata (author + lastModified) for multiple files in a
 * single subprocess, avoiding per-file git overhead during startup.
 *
 * Returns a Map<absPath, { gitAuthor: string|null, lastModified: string|null }>
 */
function batchGitMetadata(root, filePaths) {
  const result = new Map()
  if (filePaths.length === 0) return result

  // Initialize all entries
  for (const fp of filePaths) {
    result.set(fp, { gitAuthor: null, lastModified: null })
  }

  try {
    // Batch lastModified: one git log call with all paths
    // git log -1 gives the most recent commit touching any of these paths,
    // but we need per-path data. Use --name-only to correlate.
    // For efficiency, use a single git log with --format and --name-only
    // that outputs one record per commit touching these files.
    const allDirs = [...new Set(filePaths.map(fp => path.dirname(fp)))]
    const dirsArg = allDirs.map(d => `"${d}"`).join(' ')

    // Get lastModified per directory in one call using git log --format
    // We output "MARKER<sep>dir<sep>date" per commit, then take the latest per dir.
    const logResult = execSync(
      `git log --format="%aI" --name-only -- ${dirsArg}`,
      { cwd: root, encoding: 'utf-8', timeout: 10000, maxBuffer: 1024 * 1024 },
    ).trim()

    if (logResult) {
      // Parse: alternating date lines and filename lines separated by blank lines
      const blocks = logResult.split('\n\n')
      const dirDates = new Map() // dir → most recent date
      for (const block of blocks) {
        const lines = block.split('\n').filter(Boolean)
        if (lines.length < 2) continue
        const date = lines[0]
        for (let li = 1; li < lines.length; li++) {
          const fileLine = lines[li].trim()
          if (!fileLine) continue
          const dir = path.dirname(path.resolve(root, fileLine))
          if (!dirDates.has(dir)) {
            dirDates.set(dir, date)
          }
        }
      }
      for (const fp of filePaths) {
        const dir = path.dirname(fp)
        const entry = result.get(fp)
        if (dirDates.has(dir) && entry) {
          entry.lastModified = dirDates.get(dir)
        }
      }
    }
  } catch { /* git not available or failed — leave nulls */ }

  // Batch gitAuthor: use git log for each file's creation author.
  // Unfortunately --follow --diff-filter=A doesn't combine well with multiple
  // paths, so batch them in a single shell invocation using a for loop.
  try {
    const relPaths = filePaths.map(fp => path.relative(root, fp))
    // Build a shell script that outputs "PATH<tab>AUTHOR" per file
    const cmds = relPaths.map(rp =>
      `echo -n "${rp}\\t"; git log --follow --diff-filter=A --format="%aN" -- "${rp}" | tail -1`
    ).join('; ')
    const authorResult = execSync(cmds, {
      cwd: root, encoding: 'utf-8', timeout: 10000, shell: true, maxBuffer: 1024 * 1024,
    }).trim()

    if (authorResult) {
      for (const line of authorResult.split('\n')) {
        const tabIdx = line.indexOf('\t')
        if (tabIdx < 0) continue
        const relPath = line.slice(0, tabIdx)
        const author = line.slice(tabIdx + 1).trim()
        if (!author) continue
        const absPath2 = path.resolve(root, relPath)
        const entry = result.get(absPath2)
        if (entry) entry.gitAuthor = author
      }
    }
  } catch { /* git not available */ }

  return result
}

/**
 * Scan the repo for all data files, validate uniqueness, return the index.
 */
function buildIndex(root) {
  const ignore = ['node_modules/**', 'dist/**', '.git/**', '.worktrees/**', 'public/**']
  const files = globSync(GLOB_PATTERN, { cwd: root, ignore, absolute: false })
  const canvasFiles = globSync(CANVAS_GLOB_PATTERN, { cwd: root, ignore, absolute: false })
  const canvasMetaFiles = globSync(CANVAS_META_GLOB_PATTERN, { cwd: root, ignore, absolute: false })
  const storyFiles = globSync(STORY_GLOB_PATTERN, { cwd: root, ignore, absolute: false })

  // Detect nested .folder/ directories (not supported)
  // Scan directories directly since empty nested folders have no data files
  const folderDirs = globSync('src/prototypes/**/*.folder', { cwd: root, ignore, absolute: false })
  for (const dir of folderDirs) {
    const normalized = dir.replace(/\\/g, '/')
    const segments = normalized.split('/').filter(s => s.endsWith('.folder'))
    if (segments.length > 1) {
      throw new Error(
        `[storyboard-data] Nested .folder directories are not supported.\n` +
        `  Found at: ${dir}\n` +
        `  Folders can only be one level deep inside src/prototypes/.`
      )
    }
  }

  const index = { flow: {}, object: {}, record: {}, prototype: {}, folder: {}, canvas: {}, 'canvas-meta': {}, story: {} }
  const seen = {} // "name.suffix" or "id.suffix" → absolute path (for duplicate detection)
  const protoFolders = {} // prototype name → folder name (for injection)
  const flowRoutes = {} // flow name → inferred route (for _route injection)
  const canvasRoutes = {} // canvas name → inferred route
  const canvasAliases = {} // basename → canonical ID (only when unique)
  const canvasNameCount = {} // canvas basename → count (for ambiguity detection)
  const canvasGroups = {} // canvas name → group name (shared folder prefix)
  const storyRoutes = {} // story name → inferred route

  for (const relPath of [...files, ...canvasFiles, ...canvasMetaFiles, ...storyFiles]) {
    const parsed = parseDataFile(relPath)
    if (!parsed) continue

    // Canvas files use path-based IDs for dedup; others use basename
    const dedupKey = parsed.suffix === 'canvas' && parsed.id
      ? `${parsed.id}.${parsed.suffix}`
      : `${parsed.name}.${parsed.suffix}`
    const absPath = path.resolve(root, relPath)

    if (seen[dedupKey]) {
      const hint = parsed.suffix === 'folder'
          ? '  Folder names must be unique across the project.'
          : parsed.suffix === 'canvas'
          ? '  Canvas IDs must be unique. Move or rename one file to resolve the collision.'
          : '  Flows, records, and objects are scoped to their prototype directory.\n' +
            '  If both files are global (outside src/prototypes/), rename one to avoid the collision.'

      throw new Error(
        `[storyboard-data] Duplicate ${parsed.suffix} "${parsed.id || parsed.name}"\n` +
        `  Found at: ${seen[dedupKey]}\n` +
        `  And at:   ${absPath}\n` +
        hint
      )
    }

    seen[dedupKey] = absPath

    // Canvas: index only by canonical ID. Basename aliases go in a separate map
    // so listCanvases() and viewfinder don't show duplicates.
    if (parsed.suffix === 'canvas' && parsed.id) {
      index.canvas[parsed.id] = absPath
      // Track basename for alias resolution (only when unique)
      canvasNameCount[parsed.name] = (canvasNameCount[parsed.name] || 0) + 1
      if (canvasNameCount[parsed.name] === 1) {
        canvasAliases[parsed.name] = parsed.id
      } else {
        delete canvasAliases[parsed.name]
      }
    } else {
      index[parsed.suffix][parsed.name] = absPath
    }

    // Track which folder a prototype belongs to
    if (parsed.suffix === 'prototype' && parsed.folder) {
      protoFolders[parsed.name] = parsed.folder
    }

    // Track inferred routes for flows
    if (parsed.suffix === 'flow' && parsed.inferredRoute) {
      flowRoutes[parsed.name] = parsed.inferredRoute
    }

    // Track inferred routes for canvases (keyed by canonical ID)
    if (parsed.suffix === 'canvas' && parsed.inferredRoute) {
      const canvasKey = parsed.id || parsed.name
      canvasRoutes[canvasKey] = parsed.inferredRoute
    }

    // Track canvas groups (canvases sharing a folder prefix)
    // Use canonical ID as key to match the canvas index
    if (parsed.suffix === 'canvas' && parsed.group) {
      const groupKey = parsed.id || parsed.name
      canvasGroups[groupKey] = parsed.group
    }

    // Track inferred routes for stories
    if (parsed.suffix === 'story' && parsed.inferredRoute) {
      storyRoutes[parsed.name] = parsed.inferredRoute
    }
  }

  return { index, protoFolders, flowRoutes, canvasRoutes, canvasAliases, canvasGroups, storyRoutes }
}

/**
 * Recursively walk a parsed JSON value and replace `${varName}` patterns
 * in every string value. Only string values are processed — keys, numbers,
 * booleans, and null are left untouched.
 */
function resolveTemplateVars(obj, vars) {
  if (typeof obj === 'string') {
    let result = obj
    for (const [key, value] of Object.entries(vars)) {
      result = result.replaceAll(`\${${key}}`, value)
    }
    return result
  }
  if (Array.isArray(obj)) return obj.map(item => resolveTemplateVars(item, vars))
  if (obj !== null && typeof obj === 'object') {
    const out = {}
    for (const [key, value] of Object.entries(obj)) {
      out[key] = resolveTemplateVars(value, vars)
    }
    return out
  }
  return obj
}

/**
 * Compute path-based template variables for a data file.
 *
 * - currentDir:      directory of the file, relative to project root
 * - currentProto:    path to the prototype directory (e.g. src/prototypes/main.folder/Example)
 * - currentProtoDir: path to the first parent *.folder directory (e.g. src/prototypes/main.folder)
 */
function computeTemplateVars(absPath, root) {
  const relPath = path.relative(root, absPath).replace(/\\/g, '/')
  const currentDir = path.dirname(relPath).replace(/\\/g, '/')

  const protoMatch = relPath.match(/^(src\/prototypes\/(?:[^/]+\.folder\/)?[^/]+)\//)
  const currentProto = protoMatch && !protoMatch[1].endsWith('.folder') ? protoMatch[1] : ''

  const folderMatch = relPath.match(/^(src\/prototypes\/[^/]+\.folder)\//)
  const currentProtoDir = folderMatch ? folderMatch[1] : ''

  return { currentDir, currentProto, currentProtoDir }
}

/**
 * Generate the virtual module source code.
 * Reads each data file, parses JSONC at build time, and emits pre-parsed
 * JavaScript objects — no runtime parsing needed.
 */
/**
 * Read storyboard.config.json from the project root (if it exists).
 * Returns the parsed and defaulted config object, or null if not found.
 */
function readConfig(root) {
  const configPath = path.resolve(root, 'storyboard.config.json')
  try {
    const raw = fs.readFileSync(configPath, 'utf-8')
    const errors = []
    const config = parseJsonc(raw, errors)
    // Treat malformed JSON (e.g. mid-edit partial saves) as missing config
    if (errors.length > 0) return { config: null, configPath }
    return { config: getConfig(config), configPath }
  } catch {
    return { config: null, configPath }
  }
}

/**
 * Read toolbar.config.json from @dfosco/storyboard-core.
 * Returns the full config object with modes array.
 * Falls back to hardcoded defaults if not found.
 */
function readModesConfig(root) {
  const fallback = {
    modes: [
      { name: 'prototype', label: 'Navigate', hue: '#2a2a2a' },
      { name: 'inspect', label: 'Develop', hue: '#7655a4' },
      { name: 'present', label: 'Collaborate', hue: '#2a9d8f' },
      { name: 'plan', label: 'Canvas', hue: '#4a7fad' },
    ],
  }

  // Try local workspace path first (monorepo), then node_modules
  const candidates = [
    path.resolve(root, 'packages/core/toolbar.config.json'),
    path.resolve(root, 'packages/core/configs/modes.config.json'),
    path.resolve(root, 'node_modules/@dfosco/storyboard-core/toolbar.config.json'),
    path.resolve(root, 'node_modules/@dfosco/storyboard-core/configs/modes.config.json'),
  ]

  for (const filePath of candidates) {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8')
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed.modes) && parsed.modes.length > 0) {
        return { modes: parsed.modes }
      }
    } catch {
      // try next candidate
    }
  }

  return fallback
}

/**
 * Read a JSON/JSONC file, returning null on failure.
 */
function readJsonFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const errors = []
    const parsed = parseJsonc(raw, errors)
    return errors.length === 0 ? parsed : null
  } catch {
    return null
  }
}

/**
 * Find a core config file from either the monorepo workspace or node_modules.
 */
function readCoreConfigFile(root, filename) {
  const candidates = [
    path.resolve(root, `packages/core/${filename}`),
    path.resolve(root, `node_modules/@dfosco/storyboard-core/${filename}`),
  ]
  for (const p of candidates) {
    const parsed = readJsonFile(p)
    if (parsed) return parsed
  }
  return null
}

/**
 * Deep-merge helper (same as loader.js deepMerge but available at build time).
 * Arrays are replaced, not concatenated. Objects are recursively merged.
 */
function deepMergeBuild(target, source) {
  if (!source || typeof source !== 'object') return target
  if (!target || typeof target !== 'object') return source
  const result = { ...target }
  for (const key of Object.keys(source)) {
    const sv = source[key]
    const tv = target[key]
    if (sv && typeof sv === 'object' && !Array.isArray(sv) && tv && typeof tv === 'object' && !Array.isArray(tv)) {
      result[key] = deepMergeBuild(tv, sv)
    } else if (Array.isArray(sv) && Array.isArray(tv) && sv.length > 0 && tv.length > 0 && sv[0]?.id && tv[0]?.id) {
      // Id-based array merge: override matching entries by id, keep the rest, append new ones
      const targetMap = new Map(tv.map(item => [item.id, item]))
      for (const item of sv) {
        targetMap.set(item.id, item.id && targetMap.has(item.id)
          ? deepMergeBuild(targetMap.get(item.id), item)
          : item)
      }
      result[key] = [...targetMap.values()]
    } else {
      result[key] = sv
    }
  }
  return result
}

/**
 * Build the unified config object by reading and merging all config sources.
 *
 * Priority (lowest → highest):
 *   configSchema defaults → core domain configs → storyboard.config.json → user domain configs
 *
 * Domain-specific config files (toolbar.config.json, commandpalette.config.json, etc.)
 * always win over storyboard.config.json — specificity beats generality.
 * Deep merge is used at every layer: objects are recursively merged (keys append),
 * arrays and scalars are replaced.
 *
 * Returns { unified, warnings } where warnings is an array of overlap messages.
 */
function buildUnifiedConfig(root) {
  const warnings = []

  // 1. Read core defaults (lowest priority domain configs)
  const coreToolbar = readCoreConfigFile(root, 'toolbar.config.json') || {}
  const coreCommandPalette = readCoreConfigFile(root, 'commandpalette.config.json') || {}
  const corePaste = readCoreConfigFile(root, 'paste.config.json') || {}
  const coreWidgets = readCoreConfigFile(root, 'widgets.config.json') || {}

  // 2. Read storyboard.config.json (middle priority)
  // Use the schema-defaulted config for most things, but also read
  // the raw file to know which keys were explicitly set by the user.
  const { config: sbConfig } = readConfig(root)
  const rawSbConfig = readJsonFile(path.resolve(root, 'storyboard.config.json')) || {}

  // 3. Apply storyboard.config.json overrides on top of core domain configs.
  // Only merge when the user explicitly defined the key in storyboard.config.json
  // (not from configSchema defaults, which would overwrite core config with empty arrays).
  const afterSbToolbar = rawSbConfig.toolbar
    ? deepMergeBuild(coreToolbar, sbConfig.toolbar)
    : coreToolbar
  const afterSbCommandPalette = rawSbConfig.commandPalette
    ? deepMergeBuild(coreCommandPalette, sbConfig.commandPalette)
    : coreCommandPalette
  const afterSbPaste = rawSbConfig.paste
    ? deepMergeBuild(corePaste, sbConfig.paste || {})
    : corePaste
  const afterSbWidgets = rawSbConfig.widgets
    ? deepMergeBuild(coreWidgets, sbConfig.widgets || {})
    : coreWidgets

  // 4. Read user domain config files (highest priority)
  const userFiles = [
    { domain: 'widgets', filename: 'widgets.config.json' },
    { domain: 'paste', filename: 'paste.config.json' },
    { domain: 'toolbar', filename: 'toolbar.config.json' },
    { domain: 'commandPalette', filename: 'commandpalette.config.json' },
  ]

  const userConfigs = {}
  for (const { domain, filename } of userFiles) {
    const filePath = path.resolve(root, filename)
    const parsed = readJsonFile(filePath)
    if (parsed) userConfigs[domain] = { data: parsed, filename }
  }

  // 5. Apply user domain configs on top of everything (highest priority)
  const finalToolbar = userConfigs.toolbar
    ? deepMergeBuild(afterSbToolbar, userConfigs.toolbar.data)
    : afterSbToolbar
  const finalCommandPalette = userConfigs.commandPalette
    ? deepMergeBuild(afterSbCommandPalette, userConfigs.commandPalette.data)
    : afterSbCommandPalette
  const finalPaste = userConfigs.paste
    ? deepMergeBuild(afterSbPaste, userConfigs.paste.data)
    : afterSbPaste
  const finalWidgets = userConfigs.widgets
    ? deepMergeBuild(afterSbWidgets, userConfigs.widgets.data)
    : afterSbWidgets

  // 6. Detect overlaps between storyboard.config.json and user domain configs
  const domainOverlapChecks = [
    { sbKey: 'toolbar', domain: 'toolbar', label: 'toolbar.config.json' },
    { sbKey: 'commandPalette', domain: 'commandPalette', label: 'commandpalette.config.json' },
    { sbKey: 'paste', domain: 'paste', label: 'paste.config.json' },
    { sbKey: 'widgets', domain: 'widgets', label: 'widgets.config.json' },
  ]
  for (const { sbKey, domain, label } of domainOverlapChecks) {
    if (rawSbConfig[sbKey] && userConfigs[domain]) {
      const overlaps = findOverlappingKeys(rawSbConfig[sbKey], userConfigs[domain].data)
      for (const key of overlaps) {
        warnings.push(`Config overlap: "${key}" is defined in both storyboard.config.json.${sbKey} and ${label} — ${label} wins.`)
      }
    }
  }

  // 7. Build the unified config object
  const unified = {
    toolbar: finalToolbar,
    commandPalette: finalCommandPalette,
    paste: finalPaste,
    widgets: finalWidgets,
    featureFlags: sbConfig?.featureFlags || {},
    modes: sbConfig?.modes || {},
    ui: sbConfig?.ui || {},
    canvas: sbConfig?.canvas || {},
    comments: sbConfig?.comments || {},
    customerMode: sbConfig?.customerMode || {},
    plugins: sbConfig?.plugins || {},
    repository: sbConfig?.repository || {},
    workshop: sbConfig?.workshop || {},
  }

  return { unified, warnings }
}

/**
 * Find top-level keys that exist in both objects (overlap detection).
 */
function findOverlappingKeys(a, b, prefix = '') {
  const overlaps = []
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return overlaps
  for (const key of Object.keys(a)) {
    if (key in b) {
      const path = prefix ? `${prefix}.${key}` : key
      overlaps.push(path)
    }
  }
  return overlaps
}

function generateModule({ index, protoFolders, flowRoutes, canvasRoutes, canvasAliases, canvasGroups, storyRoutes }, root) {
  const declarations = []
  const INDEX_KEYS = ['flow', 'object', 'record', 'prototype', 'folder', 'canvas']
  const entries = { flow: [], object: [], record: [], prototype: [], folder: [], canvas: [] }
  const storyEntries = [] // handled separately (code modules, not JSON data)
  const resolvedFlowRoutes = {} // flow name → resolved route (for multi-flow logging)
  let i = 0

  // Batch-fetch git metadata for all prototype + canvas files in 1-2 subprocesses
  const gitPaths = [
    ...Object.values(index.prototype || {}),
    ...Object.values(index.canvas || {}),
  ]
  const gitMeta = batchGitMetadata(root, gitPaths)

  // Read canvas-meta files and build a directory-based lookup
  const canvasMetaByDir = {}
  for (const [, absPath] of Object.entries(index['canvas-meta'] || {})) {
    try {
      const raw = fs.readFileSync(absPath, 'utf-8')
      const parsed = parseJsonc(raw)
      if (parsed) {
        // Key by the parent directory path relative to src/canvas/
        const dirPath = path.dirname(absPath).replace(/\\/g, '/')
        const canvasRelDir = dirPath.replace(/^.*?src\/canvas\//, '')
        canvasMetaByDir[canvasRelDir] = parsed
      }
    } catch { /* skip invalid meta files */ }
  }

  for (const suffix of INDEX_KEYS) {
    for (const [name, absPath] of Object.entries(index[suffix])) {
      const varName = `_d${i++}`
      const raw = fs.readFileSync(absPath, 'utf-8')
      let parsed = suffix === 'canvas'
        ? materializeFromText(raw)
        : parseJsonc(raw)

      // Auto-fill gitAuthor for prototype metadata from git history
      if (suffix === 'prototype' && parsed && !parsed.gitAuthor) {
        const meta = gitMeta.get(absPath)
        if (meta?.gitAuthor) {
          parsed = { ...parsed, gitAuthor: meta.gitAuthor }
        }
      }

      // Auto-fill lastModified from git history for prototypes
      if (suffix === 'prototype' && parsed) {
        const meta = gitMeta.get(absPath)
        if (meta?.lastModified) {
          parsed = { ...parsed, lastModified: meta.lastModified }
        }
      }

      // Inject folder association into prototype metadata
      if (suffix === 'prototype' && protoFolders[name]) {
        parsed = { ...parsed, folder: protoFolders[name] }
      }

      // Load prototype-level config overrides from the prototype directory.
      // Any config file placed alongside the .prototype.json becomes an override
      // for that domain when the prototype is active.
      if (suffix === 'prototype') {
        const protoDir = path.dirname(absPath)
        const protoConfigFiles = [
          { filename: 'toolbar.config.json', key: 'toolbarConfig' },
          { filename: 'commandpalette.config.json', key: 'commandPaletteConfig' },
          { filename: 'widgets.config.json', key: 'widgetsConfig' },
          { filename: 'paste.config.json', key: 'pasteConfig' },
        ]
        for (const { filename, key } of protoConfigFiles) {
          const cfgPath = path.join(protoDir, filename)
          if (fs.existsSync(cfgPath)) {
            try {
              const raw = fs.readFileSync(cfgPath, 'utf-8')
              const cfg = parseJsonc(raw)
              if (cfg) {
                parsed = { ...parsed, [key]: cfg }
              }
            } catch { /* skip invalid config */ }
          }
        }
      }

      // Inject inferred _route into flow data (explicit route takes precedence)
      if (suffix === 'flow' && flowRoutes[name] && !parsed?.route) {
        parsed = { ...parsed, _route: flowRoutes[name] }
      }

      // Track resolved route for multi-flow logging
      if (suffix === 'flow') {
        const route = parsed?.route || parsed?._route || null
        if (route) {
          resolvedFlowRoutes[name] = { route, isDefault: parsed?.meta?.default === true }
        }
      }

      // Auto-fill gitAuthor for canvas metadata from git history
      if (suffix === 'canvas' && parsed && !parsed.gitAuthor) {
        const meta = gitMeta.get(absPath)
        if (meta?.gitAuthor) {
          parsed = { ...parsed, gitAuthor: meta.gitAuthor }
        }
      }

      // Inject inferred route, group, and resolve JSX companion for canvases
      if (suffix === 'canvas') {
        if (canvasRoutes[name]) {
          parsed = { ...parsed, _route: canvasRoutes[name] }
        }
        if (canvasGroups[name]) {
          parsed = { ...parsed, _group: canvasGroups[name] }
        }
        // Inject canvas folder metadata from .meta.json
        if (canvasGroups[name] && canvasMetaByDir[canvasGroups[name]]) {
          parsed = { ...parsed, _canvasMeta: canvasMetaByDir[canvasGroups[name]] }
        }
        // Inject folder association
        const folderDirMatch = path.relative(root, absPath).replace(/\\/g, '/').match(/(?:^|\/)src\/(?:prototypes|canvas)\/([^/]+)\.folder\//)
        if (folderDirMatch) {
          parsed = { ...parsed, _folder: folderDirMatch[1] }
        }
        // Resolve JSX companion file path
        if (parsed?.jsx) {
          const jsxPath = path.resolve(path.dirname(absPath), parsed.jsx)
          if (fs.existsSync(jsxPath)) {
            const relJsx = '/' + path.relative(root, jsxPath).replace(/\\/g, '/')
            parsed = { ...parsed, _jsxModule: relJsx }
          } else {
            console.warn(
              `[storyboard-data] Canvas "${name}" references JSX file "${parsed.jsx}" but it was not found at ${jsxPath}`
            )
          }
        }
      }

      // Resolve template variables (${currentDir}, ${currentProto}, ${currentProtoDir})
      const templateVars = computeTemplateVars(absPath, root)
      if (!templateVars.currentProto && raw.includes('${currentProto}')) {
        console.warn(
          `[storyboard-data] \${currentProto} used in "${path.relative(root, absPath)}" ` +
          `but file is not inside a prototype directory. Variable resolves to empty string.`
        )
      }
      if (!templateVars.currentProtoDir && raw.includes('${currentProtoDir}')) {
        console.warn(
          `[storyboard-data] \${currentProtoDir} used in "${path.relative(root, absPath)}" ` +
          `but file is not inside a .folder directory. Variable resolves to empty string.`
        )
      }
      parsed = resolveTemplateVars(parsed, templateVars)

      if (suffix === 'canvas' && parsed._jsxModule) {
        declarations.push(`const ${varName} = Object.assign(${JSON.stringify(parsed)}, { _jsxImport: () => import(${JSON.stringify(parsed._jsxModule)}) })`)
      } else {
        declarations.push(`const ${varName} = ${JSON.stringify(parsed)}`)
      }
      entries[suffix].push(`  ${JSON.stringify(name)}: ${varName}`)
    }
  }

  // Generate story entries (code modules with dynamic imports, not JSON data)
  for (const [name, absPath] of Object.entries(index.story || {})) {
    const varName = `_d${i++}`
    const relModule = '/' + path.relative(root, absPath).replace(/\\/g, '/')
    const storyMeta = { _storyModule: relModule }
    if (storyRoutes[name]) {
      storyMeta._route = storyRoutes[name]
    }
    declarations.push(
      `const ${varName} = Object.assign(${JSON.stringify(storyMeta)}, { _storyImport: () => import(${JSON.stringify(relModule)}) })`
    )
    storyEntries.push(`  ${JSON.stringify(name)}: ${varName}`)
  }

  const imports = [`import { init } from '@dfosco/storyboard-core'`]
  const initCalls = [`init({ flows, objects, records, prototypes, folders, canvases, stories })`]

  // Build unified config from all sources
  const { unified: unifiedConfig, warnings: configWarnings } = buildUnifiedConfig(root)
  for (const w of configWarnings) {
    console.warn(`[storyboard] ⚠ ${w}`)
  }
  imports.push(`import { initConfig } from '@dfosco/storyboard-core'`)
  initCalls.push(`initConfig(${JSON.stringify(unifiedConfig)})`)

  // Feature flags from storyboard.config.json
  const { config } = readConfig(root)
  if (config?.featureFlags && Object.keys(config.featureFlags).length > 0) {
    imports.push(`import { initFeatureFlags } from '@dfosco/storyboard-core'`)
    initCalls.push(`initFeatureFlags(${JSON.stringify(config.featureFlags)})`)
  }

  // Plugin configuration from storyboard.config.json
  if (config?.plugins && Object.keys(config.plugins).length > 0) {
    imports.push(`import { initPlugins } from '@dfosco/storyboard-core'`)
    initCalls.push(`initPlugins(${JSON.stringify(config.plugins)})`)
  }

  // Modes configuration from storyboard.config.json
  if (config?.modes) {
    imports.push(`import { initModesConfig, registerMode, syncModeClasses, initTools } from '@dfosco/storyboard-core'`)
    initCalls.push(`initModesConfig(${JSON.stringify(config.modes)})`)

    if (config.modes.enabled) {
      imports.push(`import '@dfosco/storyboard-core/modes.css'`)

      const modesConfig = readModesConfig(root)
      const modes = config.modes.defaults || modesConfig.modes
      for (const m of modes) {
        initCalls.push(`registerMode(${JSON.stringify(m.name)}, { label: ${JSON.stringify(m.label)} })`)
      }

      initCalls.push(`syncModeClasses()`)
    }
  }

  // UI config from storyboard.config.json (menu visibility overrides)
  if (config?.ui) {
    imports.push(`import { initUIConfig } from '@dfosco/storyboard-core'`)
    initCalls.push(`initUIConfig(${JSON.stringify(config.ui)})`)
  }

  // Customer mode config from storyboard.config.json
  if (config?.customerMode) {
    imports.push(`import { initCustomerModeConfig } from '@dfosco/storyboard-core'`)
    initCalls.push(`initCustomerModeConfig(${JSON.stringify(config.customerMode)})`)
  }

  // Client toolbar overrides from root toolbar.config.json
  const clientToolbarPath = path.resolve(root, 'toolbar.config.json')
  try {
    if (fs.existsSync(clientToolbarPath)) {
      const raw = fs.readFileSync(clientToolbarPath, 'utf-8')
      const errors = []
      const parsed = parseJsonc(raw, errors)
      if (parsed && errors.length === 0) {
        imports.push(`import { setClientToolbarOverrides } from '@dfosco/storyboard-core'`)
        initCalls.push(`setClientToolbarOverrides(${JSON.stringify(parsed)})`)
      }
    }
  } catch { /* skip if unreadable */ }

  // Log info when multiple flows target the same route
  const routeGroups = {}
  for (const [name, { route, isDefault }] of Object.entries(resolvedFlowRoutes)) {
    if (!routeGroups[route]) routeGroups[route] = []
    routeGroups[route].push({ name, isDefault })
  }
  for (const [route, flows] of Object.entries(routeGroups)) {
    if (flows.length > 1) {
      const defaults = flows.filter(f => f.isDefault)
      if (defaults.length > 1) {
        console.warn(
          `[storyboard-data] Warning: Route "${route}" has ${defaults.length} flows with meta.default: true.\n` +
          `  Only one flow per route should be marked as default.`
        )
      }
    }
  }

  return [
    imports.join('\n'),
    '',
    declarations.join('\n'),
    '',
    `const flows = {\n${entries.flow.join(',\n')}\n}`,
    `const objects = {\n${entries.object.join(',\n')}\n}`,
    `const records = {\n${entries.record.join(',\n')}\n}`,
    `const prototypes = {\n${entries.prototype.join(',\n')}\n}`,
    `const folders = {\n${entries.folder.join(',\n')}\n}`,
    `const canvases = {\n${entries.canvas.join(',\n')}\n}`,
    `const stories = {\n${storyEntries.join(',\n')}\n}`,
    '',
    `// Legacy basename → canonical ID aliases (only unique basenames)`,
    `const canvasAliases = ${JSON.stringify(canvasAliases || {})}`,
    '',
    '// Backward-compatible alias',
    'const scenes = flows',
    '',
    initCalls.join('\n'),
    '',
    `export { flows, scenes, objects, records, prototypes, folders, canvases, canvasAliases, stories }`,
    `export const index = { flows, scenes, objects, records, prototypes, folders, canvases, canvasAliases, stories }`,
    `export default index`,
    '',
    '// Live-patch canvas data on HMR events so SPA navigation shows fresh state',
    'if (import.meta.hot) {',
    '  import.meta.hot.on("storyboard:canvas-file-changed", (data) => {',
    '    if (!data) return',
    '    const id = data.canvasId || data.name',
    '    if (data.removed) {',
    '      delete canvases[id]',
    '    } else if (data.metadata) {',
    '      // Merge into existing entry to preserve build-time fields (_jsxModule, _jsxImport, etc.)',
    '      canvases[id] = canvases[id]',
    '        ? Object.assign({}, canvases[id], data.metadata)',
    '        : data.metadata',
    '    }',
    '    init({ flows, objects, records, prototypes, folders, canvases, stories })',
    '  })',
    '  import.meta.hot.on("storyboard:story-file-changed", (data) => {',
    '    if (!data) return',
    '    if (data.removed) {',
    '      delete stories[data.name]',
    '    } else {',
    '      stories[data.name] = { _storyModule: data._storyModule, _route: data._route,',
    '        _storyImport: () => import(/* @vite-ignore */ data._storyModule) }',
    '    }',
    '    init({ flows, objects, records, prototypes, folders, canvases, stories })',
    '    document.dispatchEvent(new CustomEvent("storyboard:story-index-changed"))',
    '  })',
    '}',
  ].join('\n')
}

/**
 * Vite plugin for storyboard data discovery.
 *
 * - Scans the repo for *.flow.json, *.scene.json (compat), *.object.json, *.record.json, *.canvas.jsonl, *.story.{jsx,tsx}
 * - Validates no two files share the same name+suffix (hard build error)
 * - Generates a virtual module `virtual:storyboard-data-index`
 * - Watches for file additions/removals in dev mode
 */
export default function storyboardDataPlugin() {
  let root = ''
  let buildResult = null

  return {
    name: 'storyboard-data',
    enforce: 'pre',

    config() {
      return {
        optimizeDeps: {
          // @dfosco/storyboard-react is excluded (virtual module), so Vite
          // can't trace into its deps. Include the remark entry points so
          // Vite pre-bundles the full chain — covers all transitive CJS
          // packages (debug, extend, etc.) without whack-a-mole.
          include: ['cmdk', 'remark', 'remark-gfm', 'remark-html', 'use-sync-external-store/shim', 'use-sync-external-store/shim/with-selector'],
          exclude: ['@dfosco/storyboard-react'],
        },
      }
    },

    configResolved(config) {
      root = config.root
    },

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_ID
    },

    load(id) {
      if (id !== RESOLVED_ID) return null
      if (!buildResult) buildResult = buildIndex(root)
      return generateModule(buildResult, root)
    },

    configureServer(server) {
      // ── Component isolate middleware ───────────────────────────────
      // Serves a minimal HTML shell for iframe-isolated component widgets.
      // The iframe loads componentIsolate.jsx which reads query params
      // (module, export, theme) and renders a single story export.
      const isolateEntryPath = new URL('../canvas/componentIsolate.jsx', import.meta.url).pathname
      // Component-set isolate — renders all exports in a grid, bypassing the full SPA.
      const componentSetIsolateEntryPath = new URL('../canvas/componentSetIsolate.jsx', import.meta.url).pathname
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next()
        let url = req.url
        const baseNoTrail = (server.config.base || '/').replace(/\/$/, '')
        if (baseNoTrail && url.startsWith(baseNoTrail)) {
          url = url.slice(baseNoTrail.length) || '/'
        }
        // Match both single-component and component-set isolate routes
        const isComponentSet = url.startsWith('/_storyboard/canvas/isolate-set')
        const isSingle = !isComponentSet && url.startsWith('/_storyboard/canvas/isolate')
        if (!isSingle && !isComponentSet) return next()

        const entryPath = isComponentSet ? componentSetIsolateEntryPath : isolateEntryPath
        const rawHtml = [
          '<!DOCTYPE html>',
          '<html><head>',
          '<style>html,body{margin:0;padding:0;width:100%;height:100%;background:var(--bgColor-default,transparent)}#root{width:100%;height:100%}</style>',
          '</head><body>',
          '<div id="root"></div>',
          `<script type="module" src="/@fs${entryPath}"></script>`,
          '</body></html>',
        ].join('\n')

        try {
          const html = await server.transformIndexHtml(req.url, rawHtml)
          res.writeHead(200, { 'Content-Type': 'text/html' })
          res.end(html)
        } catch (err) {
          console.error('[storyboard] Component isolate HTML transform failed:', err)
          res.writeHead(500, { 'Content-Type': 'text/plain' })
          res.end('Component isolate failed')
        }
      })

      // ── Stories list API ──────────────────────────────────────────
      // Serves the list of discovered stories for the CLI and UI story picker.
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next()
        let url = req.url
        const baseNoTrail = (server.config.base || '/').replace(/\/$/, '')
        if (baseNoTrail && url.startsWith(baseNoTrail)) {
          url = url.slice(baseNoTrail.length) || '/'
        }
        if (!url.startsWith('/_storyboard/stories/list')) return next()

        if (!buildResult) buildResult = buildIndex(root)
        const storyEntries = Object.entries(buildResult.index.story || {})
        const storyRoutes = buildResult.storyRoutes || {}
        const stories = storyEntries.map(([name]) => ({
          name,
          route: storyRoutes[name] || null,
        }))

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ stories }))
      })

      // Watch for data file changes in dev mode
      const watcher = server.watcher
      if (!buildResult) buildResult = buildIndex(root)
      const knownCanvasIds = new Set(Object.keys(buildResult.index.canvas || {}))
      const pendingCanvasUnlinks = new Map()

      const triggerFullReload = () => {
        buildResult = null
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) {
          server.moduleGraph.invalidateModule(mod)
          server.ws.send({ type: 'full-reload' })
        }
      }

      // Mark the virtual module as stale so the next page load rebuilds it,
      // but do NOT trigger a full-reload (avoids losing canvas editing state).
      const softInvalidate = () => {
        buildResult = null
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) server.moduleGraph.invalidateModule(mod)
      }

      // Read a canvas file and build HMR metadata for the client-side listener.
      const readCanvasMetadata = (filePath, parsed) => {
        try {
          const absPath = path.resolve(root, filePath)
          const raw = fs.readFileSync(absPath, 'utf-8')
          const materialized = materializeFromText(raw)
          const result = { ...materialized }
          // Inject _route and _folder the same way generateModule does
          if (parsed.inferredRoute) result._route = parsed.inferredRoute
          const folderDirMatch = path.relative(root, absPath).replace(/\\/g, '/').match(/(?:^|\/)src\/(?:prototypes|canvas)\/([^/]+)\.folder\//)
          if (folderDirMatch) result._folder = folderDirMatch[1]
          return result
        } catch {
          return null
        }
      }

      const invalidate = (filePath) => {
        const normalized = filePath.replace(/\\/g, '/')
        // Canvas .jsonl content changes are mutated at runtime by the canvas
        // server API. A full-reload would create a feedback loop (save →
        // file change → reload → lose editing state). Instead, soft-invalidate
        // the virtual module (so page refresh picks up changes) and send a
        // custom HMR event with updated metadata so the canvas page and
        // viewfinder can react in place.
        if (/\.canvas\.jsonl$/.test(normalized)) {
          // If this file change was caused by the canvas server API, it has
          // already pushed an HMR event via pushCanvasUpdate(). Skip the
          // duplicate watcher-triggered event to prevent stale-data rollbacks.
          const absPath = path.resolve(root, filePath)
          if (!isCanvasWriteInFlight(absPath)) {
            const parsed = parseDataFile(filePath)
            if (parsed?.suffix === 'canvas' && parsed?.id) {
              const metadata = readCanvasMetadata(filePath, parsed)
              server.ws.send({
                type: 'custom',
                event: 'storyboard:canvas-file-changed',
                data: { canvasId: parsed.id, name: parsed.id, ...(metadata ? { metadata } : {}) },
              })
            }
          }
          softInvalidate()
          return
        }

        // Invalidate when any config file inside a prototype changes
        const protoConfigPattern = /\/(toolbar|commandpalette|widgets|paste)\.config\.json$/
        if (protoConfigPattern.test(normalized) && normalized.includes('/prototypes/')) {
          buildResult = null
          const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
          if (mod) {
            server.moduleGraph.invalidateModule(mod)
            server.ws.send({ type: 'full-reload' })
          }
          return
        }

        // Invalidate when root toolbar.config.json changes
        if (normalized === path.resolve(root, 'toolbar.config.json').split(path.sep).join('/') ||
            normalized === path.resolve(root, 'toolbar.config.json')) {
          buildResult = null
          const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
          if (mod) {
            server.moduleGraph.invalidateModule(mod)
            server.ws.send({ type: 'full-reload' })
          }
          return
        }

        const parsed = parseDataFile(filePath)
        // Also invalidate when files are added/removed inside .folder/ directories
        const inFolder = normalized.includes('.folder/')
        if (!parsed && !inFolder) return
        // Source files inside .folder/ dirs (jsx, css, etc.) are handled by
        // Vite's built-in HMR / React Fast Refresh — don't full-reload for them.
        if (!parsed && inFolder) return

        // Story file content changes are handled by Vite's built-in HMR
        // (React Fast Refresh). Only soft-invalidate the virtual module so
        // the next page load picks up updated metadata — don't full-reload,
        // which would destroy canvas state and cause embedded iframes to
        // reload unnecessarily.
        if (parsed?.suffix === 'story') {
          softInvalidate()
          return
        }

        // Rebuild index and invalidate virtual module
        buildResult = null
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) {
          server.moduleGraph.invalidateModule(mod)
          server.ws.send({ type: 'full-reload' })
        }
      }

      const invalidateOnAddRemove = (filePath, eventType) => {
        const parsed = parseDataFile(filePath)
        const inFolder = filePath.replace(/\\/g, '/').includes('.folder/')
        if (!parsed && !inFolder) return
        // Source files (jsx, css, etc.) inside .folder/ dirs are handled by
        // Vite's built-in HMR — don't trigger a full-reload for them.
        if (!parsed && inFolder) return

        // Canvas writers/editors can emit unlink+add for an in-place save.
        // Treat canvas add/unlink as runtime data updates and never full-reload
        // from watcher events. Canvas pages sync from disk via custom WS events.
        if (parsed?.suffix === 'canvas') {
          const canvasId = parsed.id || parsed.name
          if (eventType === 'unlink') {
            const timer = setTimeout(() => {
              pendingCanvasUnlinks.delete(canvasId)
              knownCanvasIds.delete(canvasId)
              server.ws.send({
                type: 'custom',
                event: 'storyboard:canvas-file-changed',
                data: { canvasId, name: canvasId, removed: true },
              })
              softInvalidate()
            }, 1500)
            pendingCanvasUnlinks.set(canvasId, timer)
            return
          }

          if (eventType === 'add') {
            const metadata = readCanvasMetadata(filePath, parsed)
            const pending = pendingCanvasUnlinks.get(canvasId)
            if (pending) {
              // unlink+add pair = in-place save (atomic write), not a real remove
              clearTimeout(pending)
              pendingCanvasUnlinks.delete(canvasId)
              server.ws.send({
                type: 'custom',
                event: 'storyboard:canvas-file-changed',
                data: { canvasId, name: canvasId, ...(metadata ? { metadata } : {}) },
              })
              softInvalidate()
              return
            }

            if (knownCanvasIds.has(canvasId)) {
              server.ws.send({
                type: 'custom',
                event: 'storyboard:canvas-file-changed',
                data: { canvasId, name: canvasId, ...(metadata ? { metadata } : {}) },
              })
              softInvalidate()
              return
            }

            knownCanvasIds.add(canvasId)
            server.ws.send({
              type: 'custom',
              event: 'storyboard:canvas-file-changed',
              data: { canvasId, name: canvasId, ...(metadata ? { metadata } : {}) },
            })
            softInvalidate()
            return
          }
        }

        // Story add/remove: soft-invalidate + custom HMR event (full-reload
        // is blocked by the canvas reload guard). The virtual module HMR
        // handler live-patches `stories` and re-runs init().
        if (parsed?.suffix === 'story') {
          softInvalidate()
          if (!buildResult) buildResult = buildIndex(root)
          const storyRoutes = buildResult.storyRoutes || {}
          const storyIndex = buildResult.index.story || {}
          const name = parsed.name
          if (eventType === 'unlink') {
            server.ws.send({
              type: 'custom',
              event: 'storyboard:story-file-changed',
              data: { name, removed: true },
            })
          } else if (eventType === 'add' && storyIndex[name]) {
            const relModule = '/' + path.relative(root, storyIndex[name]).replace(/\\/g, '/')
            server.ws.send({
              type: 'custom',
              event: 'storyboard:story-file-changed',
              data: {
                name,
                _storyModule: relModule,
                _route: storyRoutes[name] || null,
              },
            })
          }
          return
        }

        // Non-canvas additions/removals and folder changes update the route/data graph.
        triggerFullReload()
      }

      // Watch storyboard.config.json for changes
      const { configPath } = readConfig(root)
      watcher.add(configPath)

      // Watch all root domain config files for changes
      const domainConfigFiles = [
        'toolbar.config.json',
        'commandpalette.config.json',
        'paste.config.json',
        'widgets.config.json',
      ].map(f => path.resolve(root, f))
      const watchedConfigPaths = new Set([configPath, ...domainConfigFiles])
      for (const p of domainConfigFiles) watcher.add(p)

      const invalidateConfig = (filePath) => {
        const resolved = path.resolve(filePath)
        if (watchedConfigPaths.has(resolved)) {
          buildResult = null
          const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
          if (mod) {
            server.moduleGraph.invalidateModule(mod)
            server.ws.send({ type: 'full-reload' })
          }
        }
      }

      watcher.on('add', (filePath) => invalidateOnAddRemove(filePath, 'add'))
      watcher.on('unlink', (filePath) => invalidateOnAddRemove(filePath, 'unlink'))
      watcher.on('change', (filePath) => {
        invalidate(filePath)
        invalidateConfig(filePath)
      })
    },

    handleHotUpdate(ctx) {
      const normalized = ctx.file.replace(/\\/g, '/')
      if (!/\.canvas\.jsonl$/.test(normalized)) return

      // Prevent Vite's default fallback behavior (full page reload) for
      // non-module .canvas.jsonl edits. The watcher 'change' handler
      // (invalidate) already sends the custom HMR event and soft-invalidates
      // the virtual module — no duplicate event needed here.
      return []
    },

    // Inject __SB_BRANCHES__ into HTML so the Viewfinder branch selector works.
    // Uses server registry (live running processes) instead of stale ports.json.
    transformIndexHtml(html, ctx) {
      // Only inject in dev mode
      if (!ctx.server) return html

      try {
        const servers = listRunningServers()
        const branches = servers
          .filter(srv => srv.worktree !== 'main')
          .map(srv => ({ branch: srv.worktree, folder: `branch--${srv.worktree}`, port: srv.port }))

        if (branches.length === 0) return html

        const script = `<script>window.__SB_BRANCHES__ = ${JSON.stringify(branches)};</script>`
        return html.replace('</head>', `${script}\n</head>`)
      } catch {
        return html
      }
    },

    // Rebuild index on each build start
    buildStart() {
      buildResult = null
    },

    // Emit terminal snapshots into the build so TerminalReadWidget can
    // fetch them as static files in production (no dev-server API).
    generateBundle() {
      const emittedIds = new Set()

      // 1. New public snapshots (flat structure) — .json and .txt
      const publicDir = path.resolve('assets/.storyboard-public/terminal-snapshots')
      if (fs.existsSync(publicDir)) {
        for (const file of fs.readdirSync(publicDir)) {
          if (file.startsWith('~') || file.startsWith('.')) continue
          const isJson = file.endsWith('.snapshot.json')
          const isTxt = file.endsWith('.snapshot.txt')
          if (!isJson && !isTxt) continue
          if (isJson) {
            const widgetId = file.replace(/\.snapshot\.json$/, '')
            if (widgetId) emittedIds.add(widgetId)
          }
          this.emitFile({
            type: 'asset',
            fileName: `_storyboard/terminal-snapshots/${file}`,
            source: fs.readFileSync(path.join(publicDir, file), 'utf-8'),
          })
        }
      }

      // 2. Legacy snapshots (nested by canvas dir) — skip if already emitted
      const legacyDir = path.resolve('.storyboard/terminal-snapshots')
      if (fs.existsSync(legacyDir)) {
        const walk = (dir) => {
          const entries = fs.readdirSync(dir, { withFileTypes: true })
          for (const entry of entries) {
            const full = path.join(dir, entry.name)
            if (entry.isDirectory()) {
              walk(full)
            } else if (entry.name.endsWith('.json') && !entry.name.startsWith('~')) {
              const widgetId = entry.name.replace(/\.json$/, '')
              if (emittedIds.has(widgetId)) continue
              const rel = path.relative(legacyDir, full).replace(/\\/g, '/')
              this.emitFile({
                type: 'asset',
                fileName: `_storyboard/terminal-snapshots/${rel}`,
                source: fs.readFileSync(full, 'utf-8'),
              })
            }
          }
        }
        walk(legacyDir)
      }
    },
  }
}

/**
 * Vite plugin that copies terminal snapshots into the build output
 * so TerminalReadWidget can fetch them as static files in production.
 *
 * Sources (in priority order):
 *   1. assets/.storyboard-public/terminal-snapshots/<widgetId>.snapshot.json (new, flat)
 *   2. assets/.storyboard-public/terminal-snapshots/<widgetId>.snapshot.txt  (human-readable companion)
 *   3. .storyboard/terminal-snapshots/<canvasDir>/<widgetId>.json (legacy, nested)
 *
 * All are emitted to `_storyboard/terminal-snapshots/` in the build.
 * Tilde-prefixed files (~) are excluded (private).
 */
export function terminalSnapshotPlugin() {
  return {
    name: 'storyboard-terminal-snapshots',

    generateBundle() {
      const emittedIds = new Set()

      // 1. New public snapshots (flat structure) — .json and .txt
      const publicDir = path.resolve('assets/.storyboard-public/terminal-snapshots')
      if (fs.existsSync(publicDir)) {
        for (const file of fs.readdirSync(publicDir)) {
          if (file.startsWith('~') || file.startsWith('.')) continue
          const isJson = file.endsWith('.snapshot.json')
          const isTxt = file.endsWith('.snapshot.txt')
          if (!isJson && !isTxt) continue
          if (isJson) {
            const widgetId = file.replace(/\.snapshot\.json$/, '')
            if (widgetId) emittedIds.add(widgetId)
          }
          this.emitFile({
            type: 'asset',
            fileName: `_storyboard/terminal-snapshots/${file}`,
            source: fs.readFileSync(path.join(publicDir, file), 'utf-8'),
          })
        }
      }

      // 2. Legacy snapshots (nested by canvas dir) — skip if already emitted
      const legacyDir = path.resolve('.storyboard/terminal-snapshots')
      if (fs.existsSync(legacyDir)) {
        const walk = (dir) => {
          const entries = fs.readdirSync(dir, { withFileTypes: true })
          for (const entry of entries) {
            const full = path.join(dir, entry.name)
            if (entry.isDirectory()) {
              walk(full)
            } else if (entry.name.endsWith('.json') && !entry.name.startsWith('~')) {
              const widgetId = entry.name.replace(/\.json$/, '')
              if (emittedIds.has(widgetId)) continue // new format takes priority
              const rel = path.relative(legacyDir, full).replace(/\\/g, '/')
              this.emitFile({
                type: 'asset',
                fileName: `_storyboard/terminal-snapshots/${rel}`,
                source: fs.readFileSync(full, 'utf-8'),
              })
            }
          }
        }
        walk(legacyDir)
      }
    },
  }
}

// Exported for testing
export { resolveTemplateVars, computeTemplateVars, parseDataFile }
