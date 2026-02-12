/**
 * Deep merges two objects. Source values take priority over target.
 * Arrays are replaced, not concatenated.
 */
function deepMerge(target, source) {
  const result = { ...target }
  
  for (const key of Object.keys(source)) {
    const sourceValue = source[key]
    const targetValue = target[key]
    
    if (
      sourceValue !== null &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue !== null &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(targetValue, sourceValue)
    } else {
      result[key] = sourceValue
    }
  }
  
  return result
}

import { parse as parseJsonc } from 'jsonc-parser'

/**
 * All known data modules, keyed by path relative to src/data/.
 * Loaded as raw text so we can parse with JSONC support (comments allowed).
 * Supports both .json and .jsonc extensions.
 */
const dataModules = import.meta.glob('../../data/**/*.{json,jsonc}', {
  eager: true,
  query: '?raw',
  import: 'default',
})

/**
 * Resolves a relative reference path against a base directory path.
 * @param {string} ref - Relative path (e.g., "../objects/navigation")
 * @param {string} baseDir - Directory of the referring file (e.g., "scenes")
 * @returns {string} Normalized path relative to data root (e.g., "objects/navigation")
 */
function resolveRefPath(ref, baseDir) {
  const segments = baseDir.split('/').filter(Boolean)
  const refParts = ref.split('/')
  
  for (const part of refParts) {
    if (part === '..') {
      segments.pop()
    } else if (part !== '.') {
      segments.push(part)
    }
  }
  
  return segments.join('/')
}

/**
 * Loads a data file by its path relative to src/data/ (without extension).
 * Tries .jsonc first, then .json. Parses with JSONC parser to allow comments.
 * @param {string} dataPath - e.g., "objects/navigation"
 * @returns {object} Parsed file contents
 */
function loadDataFile(dataPath) {
  const jsoncKey = `../../data/${dataPath}.jsonc`
  const jsonKey = `../../data/${dataPath}.json`
  const raw = dataModules[jsoncKey] ?? dataModules[jsonKey]
  if (raw == null) {
    throw new Error(`Data file not found: ${dataPath}.json(c)`)
  }
  return parseJsonc(raw)
}

/**
 * Recursively resolves $ref objects within data.
 * A $ref object is `{ "$ref": "<relative-path>" }` — it gets replaced
 * with the contents of the referenced file.
 *
 * @param {*} node - Current data node
 * @param {string} baseDir - Directory of the file containing this node
 * @param {Set} seen - Tracks visited paths to prevent circular refs
 * @returns {Promise<*>} Resolved data
 */
async function resolveRefs(node, baseDir, seen = new Set()) {
  if (node === null || typeof node !== 'object') return node
  if (Array.isArray(node)) {
    return Promise.all(node.map((item) => resolveRefs(item, baseDir, seen)))
  }

  // Handle $ref replacement
  if (node.$ref && typeof node.$ref === 'string') {
    const resolved = resolveRefPath(node.$ref, baseDir)
    if (seen.has(resolved)) {
      throw new Error(`Circular $ref detected: ${resolved}`)
    }
    seen.add(resolved)
    const refData = loadDataFile(resolved)
    const refDir = resolved.substring(0, resolved.lastIndexOf('/')) || ''
    return resolveRefs(refData, refDir, seen)
  }

  // Recurse into object values
  const result = {}
  for (const [key, value] of Object.entries(node)) {
    result[key] = await resolveRefs(value, baseDir, seen)
  }
  return result
}

/**
 * Loads a scene file and resolves $global and $ref references.
 *
 * - $global: array of relative paths merged into root (scene wins on conflicts)
 * - $ref: inline object replacement at any nesting level
 *
 * @param {string} sceneName - Name of the scene (e.g., "default")
 * @returns {Promise<object>} Resolved scene data
 */
/**
 * Checks whether a scene file exists for the given name.
 * @param {string} sceneName - e.g., "Overview"
 * @returns {boolean}
 */
export function sceneExists(sceneName) {
  const jsoncKey = `../../data/scenes/${sceneName}.jsonc`
  const jsonKey = `../../data/scenes/${sceneName}.json`
  return (dataModules[jsoncKey] ?? dataModules[jsonKey]) != null
}

export async function loadScene(sceneName = 'default') {
  const scenePath = `scenes/${sceneName}`
  let sceneData

  try {
    sceneData = loadDataFile(scenePath)
  } catch (err) {
    throw new Error(`Failed to load scene: ${sceneName}`)
  }

  const baseDir = 'scenes'

  // Handle $global: root-level merge from referenced files
  if (Array.isArray(sceneData.$global)) {
    const globalPaths = sceneData.$global
    delete sceneData.$global

    let mergedGlobals = {}
    for (const ref of globalPaths) {
      const resolved = resolveRefPath(ref, baseDir)
      try {
        let globalData = loadDataFile(resolved)
        const refDir = resolved.substring(0, resolved.lastIndexOf('/')) || ''
        globalData = await resolveRefs(globalData, refDir)
        mergedGlobals = deepMerge(mergedGlobals, globalData)
      } catch (err) {
        console.warn(`Failed to load $global: ${ref}`, err)
      }
    }

    // Scene data takes priority over globals
    sceneData = deepMerge(mergedGlobals, sceneData)
  }

  // Resolve any $ref objects throughout the tree
  sceneData = await resolveRefs(sceneData, baseDir)

  return sceneData
}

export { deepMerge }
