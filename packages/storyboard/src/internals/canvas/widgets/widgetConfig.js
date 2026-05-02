/**
 * Widget Config Loader
 *
 * Reads widgets.config.json from @dfosco/storyboard and builds
 * schema objects compatible with the existing readProp/readAllProps/getDefaults API.
 *
 * The config is the single source of truth for widget definitions —
 * prop schemas, feature lists, labels, and icons all come from here.
 *
 * Supports `$variable` references in string values, resolved from
 * the top-level `variables` object in widgets.config.json.
 */
import widgetsConfig from '../../../../widgets.config.json'

/** Variables defined in config — used to resolve `$key` references. */
const variables = widgetsConfig.variables || {}

/**
 * Resolve `$variable` references in a string value.
 * Returns the original value if it's not a string or doesn't start with `$`.
 */
function resolveVar(value) {
  if (typeof value !== 'string' || !value.startsWith('$')) return value
  const key = value.slice(1)
  return variables[key] ?? value
}

/**
 * Resolve all string values in a feature object, including nested items.
 */
function resolveFeature(feature) {
  const resolved = {}
  for (const [key, val] of Object.entries(feature)) {
    if (key === 'items' && Array.isArray(val)) {
      resolved[key] = val.map((item) => {
        const r = {}
        for (const [k, v] of Object.entries(item)) {
          // Resolve nested alt object inside items
          if (k === 'alt' && v && typeof v === 'object') {
            const altResolved = {}
            for (const [ak, av] of Object.entries(v)) altResolved[ak] = resolveVar(av)
            r[k] = altResolved
          } else {
            r[k] = resolveVar(v)
          }
        }
        return r
      })
    } else if (key === 'alt' && val && typeof val === 'object') {
      const r = {}
      for (const [k, v] of Object.entries(val)) r[k] = resolveVar(v)
      resolved[key] = r
    } else if (key === 'toggle' && val && typeof val === 'object') {
      // Pass toggle config through as-is (stateKey, activeIcon, activeLabel)
      resolved[key] = { ...val }
    } else if (key === 'surfaces' && Array.isArray(val)) {
      resolved[key] = val
    } else {
      resolved[key] = resolveVar(val)
    }
  }
  return resolved
}

/**
 * Convert a config prop definition to the schema shape used by widgetProps.js.
 * Config uses `"default"`, schema uses `"defaultValue"`.
 */
function configPropToSchema(propDef) {
  const schema = {
    type: propDef.type,
    label: propDef.label,
    category: propDef.category,
  }
  if (propDef.default !== undefined) schema.defaultValue = propDef.default
  if (propDef.options) schema.options = propDef.options
  if (propDef.min !== undefined) schema.min = propDef.min
  if (propDef.max !== undefined) schema.max = propDef.max
  return schema
}

/**
 * Build schema objects for all widget types from the config.
 * Returns the same shape as the old hardcoded schemas in widgetProps.js.
 */
function buildSchemas() {
  const result = {}
  for (const [type, def] of Object.entries(widgetsConfig.widgets)) {
    const schema = {}
    for (const [key, propDef] of Object.entries(def.props || {})) {
      schema[key] = configPropToSchema(propDef)
    }
    result[type] = schema
  }
  return result
}

/**
 * Build resolved widget type entries with variables expanded in features.
 */
function buildWidgetTypes() {
  const result = {}
  for (const [type, def] of Object.entries(widgetsConfig.widgets)) {
    result[type] = {
      ...def,
      features: (def.features || []).map(resolveFeature),
    }
  }
  return result
}

/** All widget schemas, keyed by type string. */
export const schemas = buildSchemas()

/** Full widget config entries (with resolved variables), keyed by type string. */
export const widgetTypes = buildWidgetTypes()

/**
 * Get the feature list for a widget type.
 * In production (or when isLocalDev is false, e.g. ?prodMode simulation),
 * only features with `prod: true` are returned.
 * In dev, all features are returned.
 *
 * Features with an explicit `surfaces` array that does NOT include `"toolbar"`
 * are excluded — they only render on their declared surfaces (fullbar/splitbar).
 * Features without a `surfaces` array default to toolbar-only.
 *
 * @param {string} type — widget type string
 * @param {{ isLocalDev?: boolean }} [options]
 * @returns {Array} features array from config (variables resolved), or empty array
 */
export function getFeatures(type, { isLocalDev = true } = {}) {
  const features = widgetTypes[type]?.features ?? []
  let filtered = features.filter(f => {
    const surfaces = f.surfaces || ['toolbar']
    return surfaces.includes('toolbar')
  })
  if (import.meta.env?.PROD || !isLocalDev) {
    filtered = filtered.filter(f => f.prod)
  }
  return filtered
}

/**
 * Get features for a specific rendering surface.
 * Features without a `surfaces` array default to `["toolbar"]`.
 * @param {string} type — widget type string
 * @param {'toolbar' | 'fullbar' | 'splitbar'} surface — target surface
 * @param {{ isLocalDev?: boolean }} [options]
 * @returns {Array} filtered features for the given surface
 */
export function getFeaturesForSurface(type, surface, { isLocalDev = true } = {}) {
  let features = widgetTypes[type]?.features ?? []
  if (import.meta.env?.PROD || !isLocalDev) {
    features = features.filter(f => f.prod)
  }
  return features.filter(f => {
    const surfaces = f.surfaces || ['toolbar']
    return surfaces.includes(surface)
  })
}

/**
 * Check if a widget type supports resize in the current environment.
 * Returns false if resize is disabled, or if in production and prod is not true.
 * @param {string} type — widget type string
 * @returns {boolean}
 */
export function isResizable(type) {
  const resize = widgetTypes[type]?.resize
  if (!resize?.enabled) return false
  if (import.meta.env?.PROD && !resize.prod) return false
  return true
}

/**
 * Get the display metadata (label, icon) for a widget type.
 * @param {string} type — widget type string
 * @returns {{ label: string, icon: string } | null}
 */
export function getWidgetMeta(type) {
  const def = widgetTypes[type]
  if (!def) return null
  return { label: def.label, icon: def.icon }
}

/**
 * Check if a widget type supports expanding to a full-screen modal.
 * @param {string} type — widget type string
 * @returns {boolean}
 */
export function isExpandable(type) {
  return widgetTypes[type]?.expandable === true
}

/**
 * Check if a widget type can appear in a split-screen pane.
 * @param {string} type — widget type string
 * @returns {boolean}
 */
export function isSplitScreenCapable(type) {
  return widgetTypes[type]?.splitScreen === true
}

/**
 * Get the interact gate config for a widget type.
 * @returns {{ enabled: boolean, label: string }} 
 */
export function getInteractGate(type) {
  const def = widgetTypes[type]
  if (!def || !def.interactGate) return { enabled: false, label: 'Click to interact' }
  return {
    enabled: true,
    label: def.interactGateLabel || 'Click to interact',
  }
}

/**
 * Get all widget types as an array of { type, label, icon } for menus.
 * Excludes link-preview, image, and figma-embed which are created via paste only.
 */
export function getMenuWidgetTypes() {
  return Object.entries(widgetTypes)
    .filter(([type, def]) => type !== 'link-preview' && type !== 'image' && type !== 'figma-embed' && type !== 'codepen-embed' && type !== 'story' && type !== 'terminal-read' && !def.unlisted)
    .map(([type, def]) => ({ type, label: def.label, icon: def.icon }))
}

/**
 * Get the connector configuration for a widget type.
 * @param {string} type — widget type string
 * @returns {{ anchors: Record<string, string>, accept: string[], exclude: string[], defaults: Object|undefined }}
 */
export function getConnectorConfig(type) {
  const def = widgetTypes[type]?.connectors
  return {
    anchors: def?.anchors ?? { top: 'available', bottom: 'available', left: 'available', right: 'available' },
    accept: def?.accept ?? ['*'],
    exclude: def?.exclude ?? [],
    defaults: def?.defaults,
  }
}

/**
 * Check if a specific anchor is available on a widget type.
 * @param {string} type — widget type string
 * @param {string} anchor — anchor name (top/bottom/left/right)
 * @returns {'available' | 'disabled' | 'unavailable'}
 */
export function getAnchorState(type, anchor) {
  const config = getConnectorConfig(type)
  return config.anchors[anchor] ?? 'available'
}

/**
 * Get the connector styling defaults from config.
 * @returns {Object} connector default styles
 */
export function getConnectorDefaults() {
  const defaults = widgetsConfig.connectorDefaults ?? {}
  return {
    controlOffset: defaults.controlOffset ?? 80,
    stroke: defaults.stroke ?? 'var(--fgColor-accent, #0969da)',
    strokeWidth: defaults.strokeWidth ?? 4,
    hoverStroke: defaults.hoverStroke ?? 'var(--fgColor-danger, #cf222e)',
    hoverStrokeWidth: defaults.hoverStrokeWidth ?? 5,
    endpointRadius: defaults.endpointRadius ?? 6,
    endpointFill: defaults.endpointFill ?? 'var(--fgColor-accent, #0969da)',
    endpointStroke: defaults.endpointStroke ?? 'var(--bgColor-default, #ffffff)',
    endpointStrokeWidth: defaults.endpointStrokeWidth ?? 3,
    hitAreaStrokeWidth: defaults.hitAreaStrokeWidth ?? 24,
    dragStroke: defaults.dragStroke ?? 'var(--fgColor-accent, #0969da)',
    dragStrokeWidth: defaults.dragStrokeWidth ?? 2,
    dragDasharray: defaults.dragDasharray ?? '6 4',
    dragOpacity: defaults.dragOpacity ?? 0.7,
    startEndpoint: defaults.startEndpoint ?? 'circle',
    endEndpoint: defaults.endEndpoint ?? 'circle',
  }
}

/**
 * Check if a connection from sourceType to targetType is allowed.
 * @param {string} targetType — widget type receiving the connection
 * @param {string} sourceType — widget type initiating the connection
 * @returns {boolean}
 */
export function canAcceptConnection(targetType, sourceType) {
  const config = getConnectorConfig(targetType)
  if (config.exclude.includes(sourceType)) return false
  if (config.accept.includes('*')) return true
  return config.accept.includes(sourceType)
}
