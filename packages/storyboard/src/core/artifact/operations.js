/**
 * Artifact disk operations — create, edit, delete artifacts on the filesystem.
 *
 * Each operation validates first, then performs the FS mutation.
 */

import fs from 'node:fs'
import path from 'node:path'
import { validateArtifact, resolvePrototypeDir, toPascalCase } from './validate.js'

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

function prototypeJson(values) {
  const meta = {}
  if (values.title) meta.title = values.title
  if (values.description) meta.description = values.description
  if (values.author) meta.author = values.author
  if (values.icon) meta.icon = values.icon
  if (values.tags) meta.tags = values.tags
  if (values.team) meta.team = values.team
  const obj = { meta }
  if (values.url) obj.url = values.url
  return JSON.stringify(obj, null, 2) + '\n'
}

function prototypeIndexJsx(name) {
  const pascal = toPascalCase(name)
  return `export default function ${pascal}() {
  return (
    <div>
      <h1>${pascal}</h1>
    </div>
  )
}
`
}

function flowJson(globals = []) {
  return JSON.stringify({ $global: globals }, null, 2) + '\n'
}

function canvasJsonl(settings = {}) {
  const { grid, gridSize, colorMode, title, description, author, ...rest } = settings
  const event = {
    event: 'canvas_created',
    timestamp: new Date().toISOString(),
    title: title || '',
    grid: grid !== false,
    gridSize: gridSize ?? 24,
    colorMode: colorMode ?? 'auto',
    widgets: [],
    ...rest,
  }
  if (description) event.description = description
  if (author) event.author = author
  return JSON.stringify(event) + '\n'
}

function canvasJsx(name) {
  const pascal = toPascalCase(name)
  return `export default function ${pascal}Canvas() {
  return null
}
`
}

function componentJsx(pascal) {
  return `import styles from './${pascal}.module.css'

export default function ${pascal}({ children }) {
  return (
    <div className={styles.root}>
      {children}
    </div>
  )
}
`
}

function componentCss() {
  return `.root {
}
`
}

function componentStory(pascal, kebab) {
  return `import ${pascal} from './${pascal}.jsx'

export const name = '${kebab}'

export function Default() {
  return <${pascal}>Hello</${pascal}>
}
`
}

function pageJsx(pageName) {
  const pascal = toPascalCase(pageName.split('/').pop() || 'Page')
  return `export default function ${pascal}Page() {
  return (
    <div>
      <h1>${pascal}</h1>
    </div>
  )
}
`
}

function objectJson(body = {}) {
  return JSON.stringify(body, null, 2) + '\n'
}

function recordJson(entries = []) {
  return JSON.stringify(entries, null, 2) + '\n'
}

// ---------------------------------------------------------------------------
// Create operations
// ---------------------------------------------------------------------------

function createPrototype(values, root) {
  const prototypesDir = path.join(root, 'src', 'prototypes')
  const targetDir = values.folder
    ? path.join(prototypesDir, `${values.folder}.folder`, values.name)
    : path.join(prototypesDir, values.name)

  fs.mkdirSync(targetDir, { recursive: true })

  const files = []
  const relDir = path.relative(root, targetDir)

  // Write .prototype.json
  const protoFile = `${values.name}.prototype.json`
  fs.writeFileSync(path.join(targetDir, protoFile), prototypeJson(values), 'utf-8')
  files.push(`${relDir}/${protoFile}`)

  // Write index.jsx (only for non-external prototypes)
  if (!values.url) {
    fs.writeFileSync(path.join(targetDir, 'index.jsx'), prototypeIndexJsx(values.name), 'utf-8')
    files.push(`${relDir}/index.jsx`)
  }

  // Optionally create flow
  if (values.flow && !values.url) {
    const flowFile = `${values.name}.flow.json`
    fs.writeFileSync(path.join(targetDir, flowFile), flowJson(), 'utf-8')
    files.push(`${relDir}/${flowFile}`)
  }

  return { success: true, type: 'prototype', name: values.name, path: relDir, route: `/${values.name}`, files }
}

function createCanvas(values, root) {
  const canvasDir = path.join(root, 'src', 'canvas')
  const targetDir = values.folder ? path.join(canvasDir, values.folder) : canvasDir
  fs.mkdirSync(targetDir, { recursive: true })

  const files = []
  const fileName = `${values.name}.canvas.jsonl`
  const filePath = path.join(targetDir, fileName)
  const relPath = path.relative(root, filePath)

  fs.writeFileSync(filePath, canvasJsonl({
    grid: values.grid,
    title: values.title || values.name,
    description: values.description,
  }), 'utf-8')
  files.push(relPath)

  if (values.jsx) {
    const jsxFile = `${values.name}.canvas.jsx`
    fs.writeFileSync(path.join(targetDir, jsxFile), canvasJsx(values.name), 'utf-8')
    files.push(path.relative(root, path.join(targetDir, jsxFile)))
  }

  const canvasRoute = `/canvas/${values.folder ? `${values.folder}/` : ''}${values.name}`
  return { success: true, type: 'canvas', name: values.name, path: path.relative(root, targetDir), route: canvasRoute, files }
}

function createComponent(values, root) {
  const componentsDir = path.join(root, 'src', 'components')
  const pascal = toPascalCase(values.name)
  const targetDir = values.directory
    ? path.join(componentsDir, values.directory, pascal)
    : path.join(componentsDir, pascal)

  fs.mkdirSync(targetDir, { recursive: true })

  const files = []
  const relDir = path.relative(root, targetDir)

  fs.writeFileSync(path.join(targetDir, `${pascal}.jsx`), componentJsx(pascal), 'utf-8')
  files.push(`${relDir}/${pascal}.jsx`)

  fs.writeFileSync(path.join(targetDir, `${pascal}.module.css`), componentCss(), 'utf-8')
  files.push(`${relDir}/${pascal}.module.css`)

  fs.writeFileSync(path.join(targetDir, `${values.name}.story.jsx`), componentStory(pascal, values.name), 'utf-8')
  files.push(`${relDir}/${values.name}.story.jsx`)

  return { success: true, type: 'component', name: values.name, path: relDir, files }
}

function createFlow(values, root) {
  const prototypesDir = path.join(root, 'src', 'prototypes')
  const protoDir = resolvePrototypeDir(prototypesDir, values.prototype, values.folder)
  if (!protoDir) {
    return { success: false, error: `Prototype "${values.prototype}" not found` }
  }

  const flowFile = `${values.name}.flow.json`
  const flowPath = path.join(protoDir, flowFile)
  const relPath = path.relative(root, flowPath)

  let content
  if (values['copy-from']) {
    const sourceFlow = path.join(protoDir, `${values['copy-from']}.flow.json`)
    if (fs.existsSync(sourceFlow)) {
      content = fs.readFileSync(sourceFlow, 'utf-8')
    } else {
      content = flowJson(values.globals || [])
    }
  } else {
    content = flowJson(values.globals || [])
  }

  fs.writeFileSync(flowPath, content, 'utf-8')
  return { success: true, type: 'flow', name: values.name, path: relPath, route: `/${values.prototype}?flow=${encodeURIComponent(values.name)}`, files: [relPath] }
}

function createObject(values, root) {
  let targetDir
  if (values.prototype) {
    const prototypesDir = path.join(root, 'src', 'prototypes')
    const protoDir = resolvePrototypeDir(prototypesDir, values.prototype, values.folder)
    if (!protoDir) return { success: false, error: `Prototype "${values.prototype}" not found` }
    targetDir = protoDir
  } else {
    targetDir = path.join(root, 'src', 'data')
  }
  fs.mkdirSync(targetDir, { recursive: true })

  const fileName = `${values.name}.object.json`
  const filePath = path.join(targetDir, fileName)
  const relPath = path.relative(root, filePath)

  fs.writeFileSync(filePath, objectJson(values.body || {}), 'utf-8')
  return { success: true, type: 'object', name: values.name, path: relPath, files: [relPath] }
}

function createRecord(values, root) {
  let targetDir
  if (values.prototype) {
    const prototypesDir = path.join(root, 'src', 'prototypes')
    const protoDir = resolvePrototypeDir(prototypesDir, values.prototype, values.folder)
    if (!protoDir) return { success: false, error: `Prototype "${values.prototype}" not found` }
    targetDir = protoDir
  } else {
    targetDir = path.join(root, 'src', 'data')
  }
  fs.mkdirSync(targetDir, { recursive: true })

  const fileName = `${values.name}.record.json`
  const filePath = path.join(targetDir, fileName)
  const relPath = path.relative(root, filePath)

  fs.writeFileSync(filePath, recordJson(values.entries || []), 'utf-8')
  return { success: true, type: 'record', name: values.name, path: relPath, files: [relPath] }
}

function createPage(values, root) {
  const prototypesDir = path.join(root, 'src', 'prototypes')
  const protoDir = resolvePrototypeDir(prototypesDir, values.prototype, values.folder)
  if (!protoDir) {
    return { success: false, error: `Prototype "${values.prototype}" not found` }
  }

  const pagesDir = path.join(protoDir, 'pages')
  const pagePath = path.join(pagesDir, `${values.path}.jsx`)
  const pageDir = path.dirname(pagePath)
  fs.mkdirSync(pageDir, { recursive: true })

  const relPath = path.relative(root, pagePath)
  fs.writeFileSync(pagePath, pageJsx(values.path), 'utf-8')

  return { success: true, type: 'page', name: values.path, path: relPath, route: `/${values.prototype}/${values.path}`, files: [relPath] }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const creators = {
  prototype: createPrototype,
  canvas: createCanvas,
  component: createComponent,
  flow: createFlow,
  object: createObject,
  record: createRecord,
  page: createPage,
}

/**
 * Create an artifact. Validates first, then performs FS operations.
 */
export function createArtifact(type, values, root) {
  const validation = validateArtifact(type, values, root)
  if (!validation.valid) {
    return { success: false, errors: validation.errors }
  }

  const creator = creators[type]
  if (!creator) {
    return { success: false, errors: [{ field: '_type', message: `No creator for type: ${type}` }] }
  }

  try {
    return creator(validation.normalized, root)
  } catch (err) {
    return { success: false, errors: [{ field: '_fs', message: err.message }] }
  }
}

/**
 * Edit artifact metadata.
 */
export function editArtifact(type, name, updates, root) {
  if (type === 'prototype') {
    const prototypesDir = path.join(root, 'src', 'prototypes')
    const protoDir = resolvePrototypeDir(prototypesDir, name, updates.folder)
    if (!protoDir) {
      return { success: false, error: `Prototype "${name}" not found` }
    }

    const files = fs.readdirSync(protoDir)
    const protoJsonFile = files.find(f => f.endsWith('.prototype.json'))
    if (!protoJsonFile) {
      return { success: false, error: `No .prototype.json file found in "${name}"` }
    }

    const protoJsonPath = path.join(protoDir, protoJsonFile)
    const json = JSON.parse(fs.readFileSync(protoJsonPath, 'utf-8'))
    if (!json.meta) json.meta = {}

    if (updates.title !== undefined) json.meta.title = updates.title
    if (updates.description !== undefined) json.meta.description = updates.description
    if (updates.author !== undefined) {
      json.meta.author = typeof updates.author === 'string'
        ? updates.author.split(',').map(a => a.trim()).filter(Boolean)
        : updates.author
    }
    if (updates.icon !== undefined) json.meta.icon = updates.icon
    if (updates.tags !== undefined) json.meta.tags = updates.tags
    if (updates.team !== undefined) json.meta.team = updates.team
    if (updates.url !== undefined) json.url = updates.url

    fs.writeFileSync(protoJsonPath, JSON.stringify(json, null, 2) + '\n', 'utf-8')
    return { success: true, updated: name }
  }

  return { success: false, error: `Edit not yet supported for type: ${type}` }
}

/**
 * Delete an artifact.
 */
export function deleteArtifact(type, name, options, root) {
  const { folder } = options || {}

  if (type === 'prototype') {
    const prototypesDir = path.join(root, 'src', 'prototypes')
    const protoDir = resolvePrototypeDir(prototypesDir, name, folder)
    if (!protoDir) {
      return { success: false, error: `Prototype "${name}" not found` }
    }
    const resolved = path.resolve(protoDir)
    if (!resolved.startsWith(path.resolve(prototypesDir))) {
      return { success: false, error: 'Invalid path — outside prototypes directory' }
    }
    fs.rmSync(protoDir, { recursive: true, force: true })
    return { success: true, deleted: name }
  }

  if (type === 'canvas') {
    const canvasDir = path.join(root, 'src', 'canvas')
    const filePath = folder
      ? path.join(canvasDir, folder, `${name}.canvas.jsonl`)
      : path.join(canvasDir, `${name}.canvas.jsonl`)
    if (!fs.existsSync(filePath)) {
      return { success: false, error: `Canvas "${name}" not found` }
    }
    fs.unlinkSync(filePath)
    // Also remove .jsx companion if it exists
    const jsxPath = filePath.replace('.canvas.jsonl', '.canvas.jsx')
    if (fs.existsSync(jsxPath)) fs.unlinkSync(jsxPath)
    return { success: true, deleted: name }
  }

  if (type === 'component') {
    const componentsDir = path.join(root, 'src', 'components')
    const pascal = toPascalCase(name)
    const targetDir = options?.directory
      ? path.join(componentsDir, options.directory, pascal)
      : path.join(componentsDir, pascal)
    if (!fs.existsSync(targetDir)) {
      return { success: false, error: `Component "${name}" not found` }
    }
    fs.rmSync(targetDir, { recursive: true, force: true })
    return { success: true, deleted: name }
  }

  if (type === 'flow') {
    const prototypesDir = path.join(root, 'src', 'prototypes')
    const protoDir = resolvePrototypeDir(prototypesDir, options?.prototype, folder)
    if (!protoDir) {
      return { success: false, error: `Prototype "${options?.prototype}" not found` }
    }
    const flowPath = path.join(protoDir, `${name}.flow.json`)
    if (!fs.existsSync(flowPath)) {
      return { success: false, error: `Flow "${name}" not found` }
    }
    fs.unlinkSync(flowPath)
    return { success: true, deleted: name }
  }

  if (type === 'object') {
    const filePath = path.join(root, 'src', 'data', `${name}.object.json`)
    if (!fs.existsSync(filePath)) {
      return { success: false, error: `Object "${name}" not found` }
    }
    fs.unlinkSync(filePath)
    return { success: true, deleted: name }
  }

  if (type === 'record') {
    const filePath = path.join(root, 'src', 'data', `${name}.record.json`)
    if (!fs.existsSync(filePath)) {
      return { success: false, error: `Record "${name}" not found` }
    }
    fs.unlinkSync(filePath)
    return { success: true, deleted: name }
  }

  return { success: false, error: `Delete not supported for type: ${type}` }
}

/**
 * List artifacts of a given type.
 */
export function listArtifacts(type, options, root) {
  const { folder } = options || {}

  if (type === 'prototype') {
    const prototypesDir = path.join(root, 'src', 'prototypes')
    if (!fs.existsSync(prototypesDir)) return { type, items: [] }
    return { type, items: scanPrototypes(prototypesDir, folder) }
  }

  if (type === 'canvas') {
    const canvasDir = path.join(root, 'src', 'canvas')
    if (!fs.existsSync(canvasDir)) return { type, items: [] }
    return { type, items: scanCanvases(canvasDir, folder, root) }
  }

  if (type === 'component') {
    const componentsDir = path.join(root, 'src', 'components')
    if (!fs.existsSync(componentsDir)) return { type, items: [] }
    return { type, items: scanComponents(componentsDir, root) }
  }

  return { type, items: [] }
}

function scanPrototypes(prototypesDir, filterFolder) {
  const items = []
  const entries = fs.readdirSync(prototypesDir, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    if (entry.name.endsWith('.folder')) {
      const folderName = entry.name.replace('.folder', '')
      if (filterFolder && filterFolder !== folderName) continue
      const folderPath = path.join(prototypesDir, entry.name)
      const subs = fs.readdirSync(folderPath, { withFileTypes: true })
      for (const sub of subs) {
        if (!sub.isDirectory()) continue
        items.push({ name: sub.name, folder: folderName, path: `src/prototypes/${entry.name}/${sub.name}` })
      }
    } else if (!filterFolder) {
      items.push({ name: entry.name, folder: null, path: `src/prototypes/${entry.name}` })
    }
  }

  return items
}

function scanCanvases(canvasDir, filterFolder, root) {
  const items = []
  const scanDir = (dir, folder) => {
    if (!fs.existsSync(dir)) return
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory()) {
        scanDir(path.join(dir, entry.name), entry.name)
      } else if (entry.name.endsWith('.canvas.jsonl')) {
        const name = entry.name.replace('.canvas.jsonl', '')
        if (!filterFolder || folder === filterFolder) {
          items.push({ name, folder: folder || null, path: path.relative(root, path.join(dir, entry.name)) })
        }
      }
    }
  }
  scanDir(canvasDir, null)
  return items
}

function scanComponents(componentsDir, root) {
  const items = []
  const entries = fs.readdirSync(componentsDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    items.push({ name: entry.name, path: path.relative(root, path.join(componentsDir, entry.name)) })
  }
  return items
}
