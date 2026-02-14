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

import dataIndex from 'virtual:storyboard-data-index'

/**
 * Loads a data file by name and type from the data index.
 * Data is pre-parsed at build time — returns a deep clone to prevent mutation.
 * @param {string} name - Data file name (e.g., "jane-doe", "default")
 * @param {string} [type] - Data type: "scenes", "objects", or "records". If omitted, searches all types.
 * @returns {object} Parsed file contents
 */
function loadDataFile(name, type) {
  if (type && dataIndex[type]?.[name] != null) {
    return structuredClone(dataIndex[type][name])
  }

  // Search all types if no specific type given
  if (!type) {
    for (const t of ['scenes', 'objects', 'records']) {
      if (dataIndex[t]?.[name] != null) {
        return structuredClone(dataIndex[t][name])
      }
    }
  }

  // Case-insensitive fallback for scenes
  if (type === 'scenes' || !type) {
    const lower = name.toLowerCase()
    for (const key of Object.keys(dataIndex.scenes)) {
      if (key.toLowerCase() === lower) {
        return structuredClone(dataIndex.scenes[key])
      }
    }
  }

  throw new Error(`Data file not found: ${name}${type ? ` (type: ${type})` : ''}`)
}

/**
 * Recursively resolves $ref objects within data.
 * A $ref is a name resolved from the data index (objects first, then any type).
 *
 * @param {*} node - Current data node
 * @param {Set} seen - Tracks visited names to prevent circular refs
 * @returns {Promise<*>} Resolved data
 */
async function resolveRefs(node, seen = new Set()) {
  if (node === null || typeof node !== 'object') return node
  if (Array.isArray(node)) {
    return Promise.all(node.map((item) => resolveRefs(item, seen)))
  }

  // Handle $ref replacement
  if (node.$ref && typeof node.$ref === 'string') {
    const refName = node.$ref
    if (seen.has(refName)) {
      throw new Error(`Circular $ref detected: ${refName}`)
    }
    seen.add(refName)
    const refData = loadDataFile(refName, 'objects')
    return resolveRefs(refData, seen)
  }

  // Recurse into object values
  const result = {}
  for (const [key, value] of Object.entries(node)) {
    result[key] = await resolveRefs(value, seen)
  }
  return result
}

/**
 * Checks whether a scene file exists for the given name.
 * @param {string} sceneName - e.g., "Overview"
 * @returns {boolean}
 */
export function sceneExists(sceneName) {
  if (dataIndex.scenes[sceneName] != null) return true
  const lower = sceneName.toLowerCase()
  for (const key of Object.keys(dataIndex.scenes)) {
    if (key.toLowerCase() === lower) return true
  }
  return false
}

/**
 * Loads a scene file and resolves $global and $ref references.
 *
 * - $global: array of data names merged into root (scene wins on conflicts)
 * - $ref: inline object replacement at any nesting level
 *
 * @param {string} sceneName - Name of the scene (e.g., "default")
 * @returns {Promise<object>} Resolved scene data
 */
export async function loadScene(sceneName = 'default') {
  let sceneData

  try {
    sceneData = loadDataFile(sceneName, 'scenes')
  } catch (err) {
    throw new Error(`Failed to load scene: ${sceneName}`)
  }

  // Handle $global: root-level merge from referenced data files
  if (Array.isArray(sceneData.$global)) {
    const globalNames = sceneData.$global
    delete sceneData.$global

    let mergedGlobals = {}
    for (const name of globalNames) {
      try {
        let globalData = loadDataFile(name)
        globalData = await resolveRefs(globalData)
        mergedGlobals = deepMerge(mergedGlobals, globalData)
      } catch (err) {
        console.warn(`Failed to load $global: ${name}`, err)
      }
    }

    sceneData = deepMerge(mergedGlobals, sceneData)
  }

  sceneData = await resolveRefs(sceneData)

  return sceneData
}

/**
 * Loads a record collection by name.
 * @param {string} recordName - Name of the record file (e.g., "posts")
 * @returns {Array} Parsed record collection
 */
export function loadRecord(recordName) {
  const data = dataIndex.records[recordName]
  if (data == null) {
    throw new Error(`Record not found: ${recordName}`)
  }
  if (!Array.isArray(data)) {
    throw new Error(`Record "${recordName}" must be an array, got ${typeof data}`)
  }
  return structuredClone(data)
}

/**
 * Finds a single record entry by id within a collection.
 * @param {string} recordName - Record collection name (e.g., "posts")
 * @param {string} id - The id to match
 * @returns {object|null} The matched entry, or null
 */
export function findRecord(recordName, id) {
  const records = loadRecord(recordName)
  return records.find((entry) => entry.id === id) ?? null
}

export { deepMerge }
