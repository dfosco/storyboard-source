/**
 * Canvas Collision Detection — Find collision-free positions for widgets.
 *
 * When placing or moving widgets, this module checks for overlaps with
 * existing widgets and adjusts the position until no collisions remain.
 */

import widgetsConfig from '../../../widgets.config.json' with { type: 'json' }

const FALLBACK_SIZE = { width: 270, height: 170 }

/**
 * Hardcoded fallbacks for widget types that don't specify defaults in config.
 */
const HARDCODED_DEFAULTS = {
  'markdown': { width: 530, height: 240 },
  'image': { width: 400, height: 300 },
  'link-preview': { width: 320, height: 200 },
  'component': { width: 300, height: 200 },
  'story': { width: 780, height: 420 },
}

/**
 * Default widget sizes derived from widgets.config.json prop defaults,
 * with hardcoded fallbacks for types that don't specify both width+height.
 */
export const DEFAULT_SIZES = buildDefaultSizes()

function buildDefaultSizes() {
  const sizes = {}
  const widgets = widgetsConfig.widgets || {}
  for (const [type, config] of Object.entries(widgets)) {
    const props = config.props || {}
    const hardcoded = HARDCODED_DEFAULTS[type]
    const w = props.width?.default ?? hardcoded?.width ?? FALLBACK_SIZE.width
    const h = props.height?.default ?? hardcoded?.height ?? FALLBACK_SIZE.height
    sizes[type] = { width: w, height: h }
  }
  return sizes
}

/**
 * Get the default size for a widget type from widgets.config.json.
 * @param {string} type - Widget type
 * @returns {{ width: number, height: number }}
 */
export function getDefaultSize(type) {
  return DEFAULT_SIZES[type] || FALLBACK_SIZE
}

/**
 * Get the bounding box of a widget.
 * @param {object} widget - Widget with position and props
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
export function getWidgetBounds(widget) {
  const { position = { x: 0, y: 0 }, props = {}, type } = widget
  const defaults = getDefaultSize(type)
  return {
    x: position.x,
    y: position.y,
    width: props.width ?? defaults.width,
    height: props.height ?? defaults.height,
  }
}

/**
 * Compute persistent bounds metadata for a widget.
 * Returns { width, height, startX, startY, endX, endY }.
 * @param {object} widget - Widget with position, props, and type
 * @returns {{ width: number, height: number, startX: number, startY: number, endX: number, endY: number }}
 */
export function computeWidgetBounds(widget) {
  const { x, y, width, height } = getWidgetBounds(widget)
  return {
    width,
    height,
    startX: x,
    startY: y,
    endX: x + width,
    endY: y + height,
  }
}

/**
 * Stamp bounds metadata onto a widget, returning a new widget object.
 * @param {object} widget
 * @returns {object} Widget with `bounds` field
 */
export function stampBounds(widget) {
  return { ...widget, bounds: computeWidgetBounds(widget) }
}

/**
 * Stamp bounds on every widget in an array.
 * @param {object[]} widgets
 * @returns {object[]}
 */
export function stampBoundsAll(widgets) {
  return widgets.map(stampBounds)
}

/**
 * Check if two rectangles overlap.
 * @param {{ x: number, y: number, width: number, height: number }} a
 * @param {{ x: number, y: number, width: number, height: number }} b
 * @returns {boolean}
 */
export function rectsOverlap(a, b) {
  return !(
    a.x + a.width <= b.x ||  // a is to the left of b
    b.x + b.width <= a.x ||  // b is to the left of a
    a.y + a.height <= b.y || // a is above b
    b.y + b.height <= a.y    // b is above a
  )
}

/**
 * Check if a proposed position collides with any existing widget.
 * @param {{ x: number, y: number, width: number, height: number }} rect - Proposed bounds
 * @param {object[]} widgets - Existing widgets array
 * @param {string} [excludeId] - Widget ID to exclude (for move operations)
 * @returns {object[]} - All colliding widgets (empty array if none)
 */
export function findCollisions(rect, widgets, excludeId = null) {
  const colliders = []
  for (const widget of widgets) {
    if (excludeId && widget.id === excludeId) continue
    const bounds = getWidgetBounds(widget)
    if (rectsOverlap(rect, bounds)) {
      colliders.push(widget)
    }
  }
  return colliders
}

/**
 * Check if a proposed position collides with any existing widget.
 * Returns the first colliding widget (for backwards compatibility).
 * @param {{ x: number, y: number, width: number, height: number }} rect - Proposed bounds
 * @param {object[]} widgets - Existing widgets array
 * @param {string} [excludeId] - Widget ID to exclude (for move operations)
 * @returns {object|null} - The first colliding widget, or null if no collision
 */
export function findCollision(rect, widgets, excludeId = null) {
  const colliders = findCollisions(rect, widgets, excludeId)
  return colliders.length > 0 ? colliders[0] : null
}

/**
 * Snap a value to grid.
 * @param {number} value
 * @param {number} gridSize
 * @returns {number}
 */
export function snapToGrid(value, gridSize) {
  return Math.round(value / gridSize) * gridSize
}

/**
 * Find a collision-free position for a widget.
 *
 * Strategy:
 * 1. Try the initial position
 * 2. If collision, find the max endX among all colliders and move past it
 * 3. Repeat until no collisions or maxIterations exhausted
 * 4. If horizontal resolution exhausted, fall back to moving down
 * 5. Snap final position to grid
 *
 * @param {object} options
 * @param {number} options.x - Initial X position
 * @param {number} options.y - Initial Y position
 * @param {number} options.width - Widget width
 * @param {number} options.height - Widget height
 * @param {object[]} options.widgets - Existing widgets array
 * @param {string} [options.excludeId] - Widget ID to exclude (for move operations)
 * @param {number} [options.gridSize=24] - Grid size for snapping
 * @param {number} [options.gap] - Gap between widgets (defaults to gridSize)
 * @param {number} [options.maxIterations=50] - Max collision resolution attempts
 * @returns {{ x: number, y: number, adjusted: boolean }}
 */
export function findFreePosition({
  x,
  y,
  width,
  height,
  widgets,
  excludeId = null,
  gridSize = 24,
  gap = null,
  maxIterations = 50,
}) {
  const spacing = gap ?? gridSize
  let currentX = x
  let currentY = y
  let adjusted = false

  // Phase 1: Try moving right past all colliders
  for (let i = 0; i < maxIterations; i++) {
    const rect = { x: currentX, y: currentY, width, height }
    const colliders = findCollisions(rect, widgets, excludeId)

    if (colliders.length === 0) {
      return {
        x: snapToGrid(currentX, gridSize),
        y: snapToGrid(currentY, gridSize),
        adjusted,
      }
    }

    // Jump past the rightmost edge of all colliders
    let maxEndX = 0
    for (const c of colliders) {
      const b = getWidgetBounds(c)
      const endX = b.x + b.width
      if (endX > maxEndX) maxEndX = endX
    }
    currentX = maxEndX + spacing
    adjusted = true
  }

  // Phase 2: Reset X, try moving down
  currentX = x

  for (let i = 0; i < maxIterations; i++) {
    const rect = { x: currentX, y: currentY, width, height }
    const colliders = findCollisions(rect, widgets, excludeId)

    if (colliders.length === 0) {
      return {
        x: snapToGrid(currentX, gridSize),
        y: snapToGrid(currentY, gridSize),
        adjusted,
      }
    }

    // Jump past the bottommost edge of all colliders
    let maxEndY = 0
    for (const c of colliders) {
      const b = getWidgetBounds(c)
      const endY = b.y + b.height
      if (endY > maxEndY) maxEndY = endY
    }
    currentY = maxEndY + spacing
    adjusted = true
  }

  // Fallback: return the last attempted position (snapped)
  return {
    x: snapToGrid(currentX, gridSize),
    y: snapToGrid(currentY, gridSize),
    adjusted,
  }
}

/**
 * Resolve collision for a widget being placed or moved.
 * Convenience wrapper that extracts size from widget type/props.
 *
 * @param {object} options
 * @param {number} options.x - Target X position
 * @param {number} options.y - Target Y position
 * @param {string} options.type - Widget type
 * @param {object} [options.props={}] - Widget props (may contain width/height)
 * @param {object[]} options.widgets - Existing widgets array
 * @param {string} [options.excludeId] - Widget ID to exclude
 * @param {number} [options.gridSize=24] - Grid size
 * @returns {{ x: number, y: number, adjusted: boolean }}
 */
export function resolvePosition({
  x,
  y,
  type,
  props = {},
  widgets,
  excludeId = null,
  gridSize = 24,
}) {
  const defaults = getDefaultSize(type)
  const width = props.width ?? defaults.width
  const height = props.height ?? defaults.height

  return findFreePosition({
    x,
    y,
    width,
    height,
    widgets,
    excludeId,
    gridSize,
  })
}

// --- Connector anchor calculation ---

const ANCHORS = ['top', 'bottom', 'left', 'right']
const CONTROL_OFFSET = 80 // matches connectorDefaults.controlOffset

/**
 * Compute the anchor point on a widget's edge (server-side, no DOM).
 * @param {object} widget
 * @param {string} anchor - 'top', 'bottom', 'left', 'right'
 * @returns {{ x: number, y: number }}
 */
function getAnchorPoint(widget, anchor) {
  const { x, y, width: w, height: h } = getWidgetBounds(widget)
  switch (anchor) {
    case 'top':    return { x: x + w / 2, y }
    case 'bottom': return { x: x + w / 2, y: y + h }
    case 'left':   return { x, y: y + h / 2 }
    case 'right':  return { x: x + w, y: y + h / 2 }
    default:       return { x: x + w / 2, y: y + h / 2 }
  }
}

/**
 * Compute the control point offset direction for an anchor.
 * When `scale` < 1, reduces the offset proportionally (for close widgets).
 */
function getControlOffset(anchor, scale = 1) {
  const offset = CONTROL_OFFSET * scale
  switch (anchor) {
    case 'top':    return { dx: 0, dy: -offset }
    case 'bottom': return { dx: 0, dy: offset }
    case 'left':   return { dx: -offset, dy: 0 }
    case 'right':  return { dx: offset, dy: 0 }
    default:       return { dx: 0, dy: 0 }
  }
}

/** Threshold distance (3 grid sizes) below which curve bounciness is reduced. */
const CLOSE_THRESHOLD = 24 * 3 // 72px

/**
 * Compute scale factor for control offset based on anchor distance.
 * When anchors are closer than CLOSE_THRESHOLD, reduce bounciness proportionally.
 */
function computeControlScale(dist) {
  if (dist >= CLOSE_THRESHOLD) return 1
  // Scale linearly from 0.3 at dist=0 to 1.0 at dist=CLOSE_THRESHOLD
  return 0.3 + (dist / CLOSE_THRESHOLD) * 0.7
}

/**
 * Evaluate a cubic Bézier curve at parameter t.
 */
function evalCubicBezier(p0, p1, p2, p3, t) {
  const mt = 1 - t
  const mt2 = mt * mt
  const mt3 = mt2 * mt
  const t2 = t * t
  const t3 = t2 * t
  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
  }
}

/**
 * Check if a point is inside a rect (with margin).
 */
function pointInRect(pt, rect, margin = 0) {
  return (
    pt.x >= rect.x + margin &&
    pt.x <= rect.x + rect.width - margin &&
    pt.y >= rect.y + margin &&
    pt.y <= rect.y + rect.height - margin
  )
}

/**
 * Check if a Bézier path overlaps with a widget's bounding box.
 * Samples points along the curve, skipping near anchors.
 */
function pathOverlapsWidget(p0, cp1, cp2, p3, widgetBounds, numSamples = 16) {
  for (let i = 1; i < numSamples; i++) {
    const t = 0.1 + (i / numSamples) * 0.8
    const pt = evalCubicBezier(p0, cp1, cp2, p3, t)
    if (pointInRect(pt, widgetBounds, 8)) {
      return true
    }
  }
  return false
}

/**
 * Find the best anchor pair between two widgets.
 * Considers both distance and overlap avoidance:
 * 1. Prefers paths that don't overlap either widget
 * 2. Among valid paths, picks the shortest
 * 3. Falls back to shortest path if all overlap
 *
 * @param {object} widgetA — source widget
 * @param {object} widgetB — target widget
 * @returns {{ startAnchor: string, endAnchor: string }}
 */
export function findBestAnchors(widgetA, widgetB) {
  const boundsA = getWidgetBounds(widgetA)
  const boundsB = getWidgetBounds(widgetB)

  const candidates = []

  for (const anchorA of ANCHORS) {
    const ptA = getAnchorPoint(widgetA, anchorA)

    for (const anchorB of ANCHORS) {
      const ptB = getAnchorPoint(widgetB, anchorB)
      const dist = Math.hypot(ptA.x - ptB.x, ptA.y - ptB.y)

      // Use same scaling as client-side for accurate overlap detection
      const scale = computeControlScale(dist)
      const c1 = getControlOffset(anchorA, scale)
      const c2 = getControlOffset(anchorB, scale)
      const cp1 = { x: ptA.x + c1.dx, y: ptA.y + c1.dy }
      const cp2 = { x: ptB.x + c2.dx, y: ptB.y + c2.dy }

      const overlapsA = pathOverlapsWidget(ptA, cp1, cp2, ptB, boundsA)
      const overlapsB = pathOverlapsWidget(ptA, cp1, cp2, ptB, boundsB)

      candidates.push({
        startAnchor: anchorA,
        endAnchor: anchorB,
        dist,
        overlaps: overlapsA || overlapsB,
      })
    }
  }

  // Sort: non-overlapping first, then by distance
  candidates.sort((a, b) => {
    if (a.overlaps !== b.overlaps) return a.overlaps ? 1 : -1
    return a.dist - b.dist
  })

  const best = candidates[0]
  return { startAnchor: best.startAnchor, endAnchor: best.endAnchor }
}
