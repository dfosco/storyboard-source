/**
 * Canvas JSONL Materializer
 *
 * Pure, framework-agnostic module that replays a stream of canvas events
 * into a materialized canvas state object. Zero dependencies.
 *
 * Event types:
 *   canvas_created   — full initial state (first line)
 *   widget_added     — append a widget
 *   widget_updated   — patch widget props
 *   widget_moved     — update widget position
 *   widget_removed   — remove a widget by id
 *   settings_updated — patch canvas-level settings
 *   source_updated   — replace the sources array
 *   widgets_replaced — replace the entire widgets array (bulk update)
 *   connector_added  — append a connector between two widgets
 *   connector_removed — remove a connector by id
 *   connectors_replaced — replace the entire connectors array (bulk update, used by undo/redo)
 */

/**
 * Split a text blob into top-level JSON object snippets.
 * Supports strict JSONL and accidentally concatenated objects.
 *
 * @param {string} text
 * @returns {string[]}
 */
function splitJsonObjects(text) {
  const chunks = []
  let start = -1
  let depth = 0
  let inString = false
  let escaped = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === '"') {
        inString = false
      }
      continue
    }

    if (ch === '"') {
      inString = true
      continue
    }

    if (ch === '{') {
      if (depth === 0) start = i
      depth++
      continue
    }

    if (ch === '}') {
      if (depth > 0) depth--
      if (depth === 0 && start >= 0) {
        chunks.push(text.slice(start, i + 1))
        start = -1
      }
    }
  }

  return chunks
}

/**
 * Parse canvas event text into an array of event objects.
 * Blank lines and malformed JSON snippets are skipped.
 *
 * @param {string} text - Raw canvas event file contents
 * @returns {object[]} Parsed event objects
 */
export function parseCanvasJsonl(text) {
  const events = []
  for (const snippet of splitJsonObjects(text || '')) {
    try {
      events.push(JSON.parse(snippet))
    } catch {
      // Skip malformed snippets
    }
  }
  return events
}

/**
 * Materialize a canvas state from an ordered array of events.
 *
 * @param {object[]} events - Array of event objects (first should be canvas_created)
 * @returns {object} Materialized canvas state
 */
export function materialize(events) {
  let state = {}

  for (const evt of events) {
    switch (evt.event) {
      case 'canvas_created': {
        // Strip event metadata, keep everything else as initial state
        const initial = { ...evt }
        delete initial.event
        delete initial.timestamp
        if (!initial.connectors) initial.connectors = []
        state = initial
        break
      }

      case 'widget_added': {
        if (!state.widgets) state.widgets = []
        state.widgets = [...state.widgets, evt.widget]
        break
      }

      case 'widget_updated': {
        state.widgets = (state.widgets || []).map((w) =>
          w.id === evt.widgetId
            ? { ...w, props: { ...w.props, ...evt.props } }
            : w,
        )
        break
      }

      case 'widget_moved': {
        state.widgets = (state.widgets || []).map((w) =>
          w.id === evt.widgetId ? { ...w, position: evt.position } : w,
        )
        break
      }

      case 'widget_removed': {
        state.widgets = (state.widgets || []).filter(
          (w) => w.id !== evt.widgetId,
        )
        // Cascade: remove connectors referencing the deleted widget
        if (state.connectors?.length) {
          state.connectors = state.connectors.filter(
            (c) => c.start.widgetId !== evt.widgetId && c.end.widgetId !== evt.widgetId,
          )
        }
        break
      }

      case 'settings_updated': {
        if (evt.settings) {
          const { ...rest } = state
          Object.assign(rest, evt.settings)
          state = rest
        }
        break
      }

      case 'source_updated': {
        state.sources = evt.sources
        break
      }

      case 'widgets_replaced': {
        state.widgets = evt.widgets
        // Orphan cleanup: remove connectors referencing deleted widgets
        if (state.connectors?.length) {
          const widgetIds = new Set((state.widgets || []).map((w) => w.id))
          state.connectors = state.connectors.filter(
            (c) => widgetIds.has(c.start.widgetId) && widgetIds.has(c.end.widgetId),
          )
        }
        break
      }

      case 'connector_added': {
        if (!state.connectors) state.connectors = []
        state.connectors = [...state.connectors, evt.connector]
        break
      }

      case 'connector_removed': {
        state.connectors = (state.connectors || []).filter(
          (c) => c.id !== evt.connectorId,
        )
        break
      }

      case 'connectors_replaced': {
        state.connectors = evt.connectors || []
        break
      }

      case 'connector_updated': {
        state.connectors = (state.connectors || []).map((c) => {
          if (c.id !== evt.connectorId) return c
          const { startAnchor, endAnchor, meta, ...rest } = evt.updates || {}
          // Deep-merge meta so per-widget messaging settings accumulate
          const mergedMeta = { ...(c.meta || {}), ...(meta || {}) }
          if (meta?.messaging) {
            mergedMeta.messaging = { ...(c.meta?.messaging || {}), ...meta.messaging }
          }
          // Clear messagingMode if explicitly set to null (switching from two-way to per-widget)
          if (meta && meta.messagingMode === null) {
            delete mergedMeta.messagingMode
          }
          // Apply anchor updates if provided, preserving widget connections
          const start = startAnchor
            ? { ...c.start, anchor: startAnchor }
            : c.start
          const end = endAnchor
            ? { ...c.end, anchor: endAnchor }
            : c.end
          return { ...c, ...rest, meta: mergedMeta, id: c.id, start, end }
        })
        break
      }

      // Unknown events are silently ignored (forward compatibility)
    }
  }

  // Derive connectorIds on widgets from the connectors array
  if (state.connectors?.length && state.widgets?.length) {
    // Build a map: widgetId → Set of connectorIds
    const widgetConnMap = new Map()
    for (const conn of state.connectors) {
      for (const endpoint of [conn.start, conn.end]) {
        if (!widgetConnMap.has(endpoint.widgetId)) {
          widgetConnMap.set(endpoint.widgetId, new Set())
        }
        widgetConnMap.get(endpoint.widgetId).add(conn.id)
      }
    }
    state.widgets = state.widgets.map((w) => {
      const ids = widgetConnMap.get(w.id)
      return ids ? { ...w, connectorIds: [...ids] } : w
    })
  }

  return state
}

/**
 * Convenience: parse JSONL text and materialize in one step.
 *
 * @param {string} text - Raw JSONL file contents
 * @returns {object} Materialized canvas state
 */
export function materializeFromText(text) {
  return materialize(parseCanvasJsonl(text))
}

/**
 * Serialize a single event object to a JSONL line (no trailing newline).
 *
 * @param {object} event - Event object
 * @returns {string} Single-line JSON string
 */
export function serializeEvent(event) {
  return JSON.stringify(event)
}
