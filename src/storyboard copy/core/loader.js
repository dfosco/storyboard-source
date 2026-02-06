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

/**
 * Dynamically imports a scene file.
 * Vite handles JSON imports natively.
 */
async function importScene(sceneName) {
  const module = await import(`../../data/scenes/${sceneName}.json`)
  return module.default
}

/**
 * Dynamically imports a shared file.
 */
async function importShared(fileName) {
  // fileName comes as "shared/navigation.json", extract just the name
  const name = fileName.replace('shared/', '').replace('.json', '')
  const module = await import(`../../data/shared/${name}.json`)
  return module.default
}

/**
 * Loads a scene file and resolves any $import references.
 * @param {string} sceneName - Name of the scene (e.g., "default")
 * @returns {Promise<object>} - Merged scene data
 */
export async function loadScene(sceneName = 'default') {
  let sceneData
  try {
    sceneData = await importScene(sceneName)
  } catch (err) {
    throw new Error(`Failed to load scene: ${sceneName}`)
  }
  
  // Clone to avoid mutating the cached module
  sceneData = JSON.parse(JSON.stringify(sceneData))
  
  // Handle $import if present
  if (sceneData.$import && Array.isArray(sceneData.$import)) {
    const imports = sceneData.$import
    delete sceneData.$import
    
    // Fetch all imported files in parallel
    const importPromises = imports.map(async (importPath) => {
      try {
        return await importShared(importPath)
      } catch (err) {
        console.warn(`Failed to load import: ${importPath}`)
        return {}
      }
    })
    
    const importedData = await Promise.all(importPromises)
    
    // Merge all imports together (later imports override earlier)
    let mergedImports = {}
    for (const data of importedData) {
      mergedImports = deepMerge(mergedImports, data)
    }
    
    // Scene data takes priority over imports
    return deepMerge(mergedImports, sceneData)
  }
  
  return sceneData
}

export { deepMerge }
