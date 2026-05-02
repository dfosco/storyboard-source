import fs from 'node:fs'
import path from 'node:path'
import { parse as parseJsonc } from 'jsonc-parser'

const TEMPLATE_DIR_NAMES = new Set(['template', 'templates'])
const RECIPE_DIR_NAMES = new Set(['recipe', 'recipes'])
const PARTIAL_DIR_NAMES = new Set([...TEMPLATE_DIR_NAMES, ...RECIPE_DIR_NAMES])

function normalizeSlashes(value) {
  return value.replaceAll('\\', '/')
}

function isExternalPrototype(prototypePath) {
  try {
    const raw = fs.readFileSync(prototypePath, 'utf-8')
    const parsed = parseJsonc(raw)
    return typeof parsed?.url === 'string' && parsed.url.trim().length > 0
  } catch {
    return false
  }
}

function isPartialDirName(directory) {
  return PARTIAL_DIR_NAMES.has(directory)
}

function toPartialKind(directory) {
  if (TEMPLATE_DIR_NAMES.has(directory)) return 'template'
  if (RECIPE_DIR_NAMES.has(directory)) return 'recipe'
  return null
}

function listPrototypeDirs(root) {
  const prototypesDir = path.join(root, 'src', 'prototypes')
  if (!fs.existsSync(prototypesDir)) return []

  const results = []

  function scanDir(dir, folder) {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      if (entry.name.endsWith('.folder')) {
        scanDir(path.join(dir, entry.name), entry.name.replace(/\.folder$/, ''))
        continue
      }

      const protoDir = path.join(dir, entry.name)
      const prototypeFile = fs.readdirSync(protoDir).find((f) => f.endsWith('.prototype.json'))
      if (!prototypeFile) continue
      if (isExternalPrototype(path.join(protoDir, prototypeFile))) continue

      results.push({
        name: entry.name,
        folder,
        dir: protoDir,
      })
    }
  }

  scanDir(prototypesDir)
  return results
}

function makeId(prefix, directory, name, prototype, folder) {
  if (prefix === 'global') {
    return `global:${directory}/${name}`
  }
  const folderPart = folder ? `${folder}/` : ''
  return `prototype:${folderPart}${prototype}:${directory}/${name}`
}

export function buildTemplateRecipeIndex(root, configPartials = []) {
  const srcRoot = path.join(root, 'src')
  const results = []
  const seenIds = new Set()

  for (const partial of configPartials) {
    if (!partial || !isPartialDirName(partial.directory) || !partial.name) continue
    const kind = toPartialKind(partial.directory)
    if (!kind) continue
    const id = makeId('global', partial.directory, partial.name)
    if (seenIds.has(id)) continue
    seenIds.add(id)
    results.push({
      id,
      name: partial.name,
      directory: partial.directory,
      kind,
      scope: 'global',
      baseDir: partial.directory,
      globals: Array.isArray(partial.globals) ? partial.globals : undefined,
    })
  }

  const prototypes = listPrototypeDirs(root)
  for (const proto of prototypes) {
    for (const directory of PARTIAL_DIR_NAMES) {
      const localPartialsDir = path.join(proto.dir, directory)
      if (!fs.existsSync(localPartialsDir)) continue

      for (const entry of fs.readdirSync(localPartialsDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue
        const kind = toPartialKind(directory)
        if (!kind) continue

        const baseDir = normalizeSlashes(path.relative(srcRoot, localPartialsDir))
        const id = makeId('prototype', directory, entry.name, proto.name, proto.folder)
        if (seenIds.has(id)) continue
        seenIds.add(id)
        results.push({
          id,
          name: entry.name,
          directory,
          kind,
          scope: 'prototype',
          prototype: proto.name,
          ...(proto.folder ? { folder: proto.folder } : {}),
          baseDir,
        })
      }
    }
  }

  return results.sort((a, b) => {
    if (a.scope !== b.scope) return a.scope.localeCompare(b.scope)
    if ((a.prototype || '') !== (b.prototype || '')) return (a.prototype || '').localeCompare(b.prototype || '')
    if ((a.folder || '') !== (b.folder || '')) return (a.folder || '').localeCompare(b.folder || '')
    if (a.kind !== b.kind) return a.kind.localeCompare(b.kind)
    return a.name.localeCompare(b.name)
  })
}

export function resolveTemplateRecipeEntry(entries, templateValue, { prototype, folder } = {}) {
  if (!templateValue || typeof templateValue !== 'string') return null

  const trimmed = templateValue.trim()
  if (!trimmed) return null

  const byId = entries.find((entry) => entry.id === trimmed)
  if (byId) return byId

  const exactScoped = entries.find((entry) =>
    entry.scope === 'prototype' &&
    entry.name === trimmed &&
    entry.prototype === prototype &&
    (entry.folder || '') === (folder || '')
  )
  if (exactScoped) return exactScoped

  const globalMatch = entries.find((entry) => entry.scope === 'global' && entry.name === trimmed)
  if (globalMatch) return globalMatch

  return entries.find((entry) => entry.name === trimmed) || null
}
