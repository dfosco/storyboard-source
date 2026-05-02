import { getConnectorDefaults } from './widgets/widgetConfig.js'

const connectorConfig = getConnectorDefaults()
const CONTROL_OFFSET = connectorConfig.controlOffset

/**
 * Compute the anchor point on a widget's edge.
 * Reads actual DOM dimensions for accuracy (widgets like markdown auto-size).
 * Falls back to props/bounds/defaults if DOM element isn't found.
 */
export function getAnchorPoint(widget, anchor) {
  const x = widget.position?.x ?? 0
  const y = widget.position?.y ?? 0

  let w, h
  const el = typeof document !== 'undefined' ? document.getElementById(widget.id) : null
  if (el) {
    const firstChild = el.querySelector('[data-widget-id]') || el.firstElementChild
    if (firstChild) {
      w = firstChild.offsetWidth
      h = firstChild.offsetHeight
    }
  }
  if (!w) w = widget.props?.width ?? widget.bounds?.width ?? 270
  if (!h) h = widget.props?.height ?? widget.bounds?.height ?? 170

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
 */
export function getControlOffset(anchor) {
  switch (anchor) {
    case 'top':    return { dx: 0, dy: -CONTROL_OFFSET }
    case 'bottom': return { dx: 0, dy: CONTROL_OFFSET }
    case 'left':   return { dx: -CONTROL_OFFSET, dy: 0 }
    case 'right':  return { dx: CONTROL_OFFSET, dy: 0 }
    default:       return { dx: 0, dy: 0 }
  }
}

/**
 * Build a cubic Bézier path string between two anchor points.
 * When `freeEnd` is true, the end control point is computed from
 * the direction vector (end→start) so the curve never bends in
 * front of the cursor during drag.
 */
export function buildPath(startPt, startAnchor, endPt, endAnchor, freeEnd = false) {
  const c1 = getControlOffset(startAnchor)
  let c2
  if (freeEnd) {
    const dx = startPt.x - endPt.x
    const dy = startPt.y - endPt.y
    const dist = Math.hypot(dx, dy) || 1
    const scale = Math.min(CONTROL_OFFSET, dist * 0.4)
    c2 = { dx: (dx / dist) * scale, dy: (dy / dist) * scale }
  } else {
    c2 = getControlOffset(endAnchor)
  }
  return `M ${startPt.x} ${startPt.y} C ${startPt.x + c1.dx} ${startPt.y + c1.dy}, ${endPt.x + c2.dx} ${endPt.y + c2.dy}, ${endPt.x} ${endPt.y}`
}

/**
 * Evaluate a cubic Bézier curve at parameter t.
 * B(t) = (1-t)³·P0 + 3(1-t)²t·P1 + 3(1-t)t²·P2 + t³·P3
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
 * Resolve a connector's Bézier control points from widget positions.
 * Returns { p0, cp1, cp2, p3 } or null if either widget is missing.
 */
export function getConnectorControlPoints(connector, widgetMap) {
  const startWidget = widgetMap.get(connector.start?.widgetId)
  const endWidget = widgetMap.get(connector.end?.widgetId)
  if (!startWidget || !endWidget) return null

  const p0 = getAnchorPoint(startWidget, connector.start.anchor)
  const p3 = getAnchorPoint(endWidget, connector.end.anchor)
  const c1 = getControlOffset(connector.start.anchor)
  const c2 = getControlOffset(connector.end.anchor)

  return {
    p0,
    cp1: { x: p0.x + c1.dx, y: p0.y + c1.dy },
    cp2: { x: p3.x + c2.dx, y: p3.y + c2.dy },
    p3,
  }
}

/**
 * Test whether any point along a connector's Bézier path falls inside a rect.
 * @param {Object} connector — { start: { widgetId, anchor }, end: { widgetId, anchor } }
 * @param {Map} widgetMap — Map<widgetId, widget>
 * @param {{ x, y, width, height }} rect — axis-aligned selection rectangle
 * @param {number} numSamples — number of evenly-spaced points to test (default 24)
 * @returns {boolean}
 */
export function connectorIntersectsRect(connector, widgetMap, rect, numSamples = 24) {
  const pts = getConnectorControlPoints(connector, widgetMap)
  if (!pts) return false

  const { p0, cp1, cp2, p3 } = pts
  const rRight = rect.x + rect.width
  const rBottom = rect.y + rect.height

  for (let i = 0; i <= numSamples; i++) {
    const t = i / numSamples
    const pt = evalCubicBezier(p0, cp1, cp2, p3, t)
    if (pt.x >= rect.x && pt.x <= rRight && pt.y >= rect.y && pt.y <= rBottom) {
      return true
    }
  }
  return false
}
