import fs from 'node:fs'
import path from 'node:path'
import { globSync } from 'glob'
import { parse as parseJsonc } from 'jsonc-parser'

const VIRTUAL_MODULE_ID = 'virtual:storyboard-data-index'
const RESOLVED_ID = '\0' + VIRTUAL_MODULE_ID

const SUFFIXES = ['scene', 'object', 'record']
const GLOB_PATTERN = '**/*.{scene,object,record}.{json,jsonc}'

/**
 * Extract the data name and type suffix from a file path.
 * e.g. "src/data/default.scene.json" → { name: "default", suffix: "scene" }
 *      "anywhere/posts.record.jsonc" → { name: "posts", suffix: "record" }
 */
function parseDataFile(filePath) {
  const base = path.basename(filePath)
  const match = base.match(/^(.+)\.(scene|object|record)\.(jsonc?)$/)
  if (!match) return null
  return { name: match[1], suffix: match[2], ext: match[3] }
}

/**
 * Scan the repo for all data files, validate uniqueness, return the index.
 */
function buildIndex(root) {
  const ignore = ['node_modules/**', 'dist/**', '.git/**']
  const files = globSync(GLOB_PATTERN, { cwd: root, ignore, absolute: false })

  const index = { scene: {}, object: {}, record: {} }
  const seen = {} // "name.suffix" → absolute path (for duplicate detection)

  for (const relPath of files) {
    const parsed = parseDataFile(relPath)
    if (!parsed) continue

    const key = `${parsed.name}.${parsed.suffix}`
    const absPath = path.resolve(root, relPath)

    if (seen[key]) {
      throw new Error(
        `[storyboard-data] Duplicate data file: "${key}.json"\n` +
        `  Found at: ${seen[key]}\n` +
        `  And at:   ${absPath}\n` +
        `  Every data file name+suffix must be unique across the repo.`
      )
    }

    seen[key] = absPath
    index[parsed.suffix][parsed.name] = absPath
  }

  return index
}

/**
 * Generate the virtual module source code.
 * Reads each data file, parses JSONC at build time, and emits pre-parsed
 * JavaScript objects — no runtime parsing needed.
 */
function generateModule(index) {
  const declarations = []
  const entries = { scene: [], object: [], record: [] }
  let i = 0

  for (const suffix of SUFFIXES) {
    for (const [name, absPath] of Object.entries(index[suffix])) {
      const varName = `_d${i++}`
      const raw = fs.readFileSync(absPath, 'utf-8')
      const parsed = parseJsonc(raw)
      declarations.push(`const ${varName} = ${JSON.stringify(parsed)}`)
      entries[suffix].push(`  ${JSON.stringify(name)}: ${varName}`)
    }
  }

  return [
    declarations.join('\n'),
    '',
    `export const scenes = {\n${entries.scene.join(',\n')}\n}`,
    `export const objects = {\n${entries.object.join(',\n')}\n}`,
    `export const records = {\n${entries.record.join(',\n')}\n}`,
    '',
    `export const index = { scenes, objects, records }`,
    `export default index`,
  ].join('\n')
}

/**
 * Vite plugin for storyboard data discovery.
 *
 * - Scans the repo for *.scene.json, *.object.json, *.record.json
 * - Validates no two files share the same name+suffix (hard build error)
 * - Generates a virtual module `virtual:storyboard-data-index`
 * - Watches for file additions/removals in dev mode
 */
export default function storyboardDataPlugin() {
  let root = ''
  let index = null

  return {
    name: 'storyboard-data',
    enforce: 'pre',

    configResolved(config) {
      root = config.root
    },

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_ID
    },

    load(id) {
      if (id !== RESOLVED_ID) return null
      if (!index) index = buildIndex(root)
      return generateModule(index)
    },

    configureServer(server) {
      // Watch for data file changes in dev mode
      const dataGlob = GLOB_PATTERN
      const watcher = server.watcher

      const invalidate = (filePath) => {
        const parsed = parseDataFile(filePath)
        if (!parsed) return
        // Rebuild index and invalidate virtual module
        index = null
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) {
          server.moduleGraph.invalidateModule(mod)
          server.ws.send({ type: 'full-reload' })
        }
      }

      watcher.on('add', invalidate)
      watcher.on('unlink', invalidate)
      watcher.on('change', invalidate)
    },

    // Rebuild index on each build start
    buildStart() {
      index = null
    },
  }
}
