import { describe, it, expect } from 'vitest'
import { parseCanvasJsonl, materialize, materializeFromText, serializeEvent } from './materializer.js'

describe('parseCanvasJsonl', () => {
  it('parses multiple JSONL lines', () => {
    const text = '{"event":"canvas_created","title":"Test"}\n{"event":"widget_added","widget":{"id":"w1"}}\n'
    const events = parseCanvasJsonl(text)
    expect(events).toHaveLength(2)
    expect(events[0].event).toBe('canvas_created')
    expect(events[1].event).toBe('widget_added')
  })

  it('skips blank lines', () => {
    const text = '{"event":"canvas_created"}\n\n\n{"event":"widget_added","widget":{"id":"w1"}}\n'
    const events = parseCanvasJsonl(text)
    expect(events).toHaveLength(2)
  })

  it('skips malformed lines', () => {
    const text = '{"event":"canvas_created"}\nnot json\n{"event":"widget_added","widget":{"id":"w1"}}\n'
    const events = parseCanvasJsonl(text)
    expect(events).toHaveLength(2)
  })

  it('parses concatenated JSON objects on a single line', () => {
    const text = '{"event":"canvas_created","title":"Test"}{"event":"source_updated","sources":[]}'
    const events = parseCanvasJsonl(text)
    expect(events).toHaveLength(2)
    expect(events[0].event).toBe('canvas_created')
    expect(events[1].event).toBe('source_updated')
  })

  it('handles braces inside JSON strings', () => {
    const text = '{"event":"canvas_created","title":"A {title}"}{"event":"widget_added","widget":{"id":"w1","props":{"text":"x}"}}}'
    const events = parseCanvasJsonl(text)
    expect(events).toHaveLength(2)
    expect(events[0].title).toBe('A {title}')
    expect(events[1].widget.props.text).toBe('x}')
  })

  it('returns empty array for empty input', () => {
    expect(parseCanvasJsonl('')).toEqual([])
    expect(parseCanvasJsonl('\n\n')).toEqual([])
  })
})

describe('materialize', () => {
  it('materializes a canvas_created event', () => {
    const events = [
      { event: 'canvas_created', timestamp: '2026-01-01', title: 'Test', grid: true, gridSize: 24, widgets: [] },
    ]
    const state = materialize(events)
    expect(state.title).toBe('Test')
    expect(state.grid).toBe(true)
    expect(state.gridSize).toBe(24)
    expect(state.widgets).toEqual([])
    // event metadata should be stripped
    expect(state.event).toBeUndefined()
    expect(state.timestamp).toBeUndefined()
  })

  it('applies widget_added events', () => {
    const events = [
      { event: 'canvas_created', timestamp: '2026-01-01', title: 'Test', widgets: [] },
      { event: 'widget_added', timestamp: '2026-01-02', widget: { id: 'w1', type: 'sticky-note', position: { x: 0, y: 0 }, props: { text: 'Hello', color: 'yellow' } } },
      { event: 'widget_added', timestamp: '2026-01-03', widget: { id: 'w2', type: 'markdown', position: { x: 100, y: 100 }, props: { content: '# Test' } } },
    ]
    const state = materialize(events)
    expect(state.widgets).toHaveLength(2)
    expect(state.widgets[0].id).toBe('w1')
    expect(state.widgets[1].id).toBe('w2')
  })

  it('applies widget_updated events', () => {
    const events = [
      { event: 'canvas_created', timestamp: '2026-01-01', title: 'Test', widgets: [
        { id: 'w1', type: 'sticky-note', position: { x: 0, y: 0 }, props: { text: 'Original', color: 'yellow' } },
      ] },
      { event: 'widget_updated', timestamp: '2026-01-02', widgetId: 'w1', props: { text: 'Updated' } },
    ]
    const state = materialize(events)
    expect(state.widgets[0].props.text).toBe('Updated')
    expect(state.widgets[0].props.color).toBe('yellow') // unchanged props preserved
  })

  it('applies widget_moved events', () => {
    const events = [
      { event: 'canvas_created', timestamp: '2026-01-01', title: 'Test', widgets: [
        { id: 'w1', type: 'sticky-note', position: { x: 0, y: 0 }, props: {} },
      ] },
      { event: 'widget_moved', timestamp: '2026-01-02', widgetId: 'w1', position: { x: 300, y: 400 } },
    ]
    const state = materialize(events)
    expect(state.widgets[0].position).toEqual({ x: 300, y: 400 })
  })

  it('applies widget_removed events', () => {
    const events = [
      { event: 'canvas_created', timestamp: '2026-01-01', title: 'Test', widgets: [
        { id: 'w1', type: 'sticky-note', position: { x: 0, y: 0 }, props: {} },
        { id: 'w2', type: 'markdown', position: { x: 100, y: 100 }, props: {} },
      ] },
      { event: 'widget_removed', timestamp: '2026-01-02', widgetId: 'w1' },
    ]
    const state = materialize(events)
    expect(state.widgets).toHaveLength(1)
    expect(state.widgets[0].id).toBe('w2')
  })

  it('applies settings_updated events', () => {
    const events = [
      { event: 'canvas_created', timestamp: '2026-01-01', title: 'Test', grid: true, gridSize: 24, widgets: [] },
      { event: 'settings_updated', timestamp: '2026-01-02', settings: { gridSize: 12, title: 'Updated Title' } },
    ]
    const state = materialize(events)
    expect(state.gridSize).toBe(12)
    expect(state.title).toBe('Updated Title')
    expect(state.grid).toBe(true) // unchanged setting preserved
  })

  it('applies source_updated events', () => {
    const events = [
      { event: 'canvas_created', timestamp: '2026-01-01', title: 'Test', sources: [{ export: 'A' }], widgets: [] },
      { event: 'source_updated', timestamp: '2026-01-02', sources: [{ export: 'B' }, { export: 'C' }] },
    ]
    const state = materialize(events)
    expect(state.sources).toEqual([{ export: 'B' }, { export: 'C' }])
  })

  it('applies widgets_replaced events (bulk update)', () => {
    const events = [
      { event: 'canvas_created', timestamp: '2026-01-01', title: 'Test', widgets: [
        { id: 'w1', type: 'sticky-note', position: { x: 0, y: 0 }, props: {} },
      ] },
      { event: 'widgets_replaced', timestamp: '2026-01-02', widgets: [
        { id: 'w1', type: 'sticky-note', position: { x: 50, y: 50 }, props: {} },
        { id: 'w3', type: 'markdown', position: { x: 200, y: 200 }, props: {} },
      ] },
    ]
    const state = materialize(events)
    expect(state.widgets).toHaveLength(2)
    expect(state.widgets[0].position).toEqual({ x: 50, y: 50 })
    expect(state.widgets[1].id).toBe('w3')
  })

  it('returns empty object for empty event stream', () => {
    expect(materialize([])).toEqual({})
  })

  it('silently ignores unknown event types', () => {
    const events = [
      { event: 'canvas_created', timestamp: '2026-01-01', title: 'Test', widgets: [] },
      { event: 'future_event', timestamp: '2026-01-02', data: 'whatever' },
    ]
    const state = materialize(events)
    expect(state.title).toBe('Test')
  })

  it('handles a full lifecycle: create, add, update, move, remove', () => {
    const events = [
      { event: 'canvas_created', timestamp: '1', title: 'Canvas', grid: true, gridSize: 24, colorMode: 'auto', widgets: [] },
      { event: 'widget_added', timestamp: '2', widget: { id: 'w1', type: 'sticky-note', position: { x: 0, y: 0 }, props: { text: 'Hello', color: 'yellow' } } },
      { event: 'widget_added', timestamp: '3', widget: { id: 'w2', type: 'markdown', position: { x: 100, y: 0 }, props: { content: '# Title' } } },
      { event: 'widget_updated', timestamp: '4', widgetId: 'w1', props: { text: 'Updated hello' } },
      { event: 'widget_moved', timestamp: '5', widgetId: 'w2', position: { x: 200, y: 300 } },
      { event: 'widget_added', timestamp: '6', widget: { id: 'w3', type: 'sticky-note', position: { x: 400, y: 0 }, props: { text: 'Temp', color: 'red' } } },
      { event: 'widget_removed', timestamp: '7', widgetId: 'w3' },
      { event: 'settings_updated', timestamp: '8', settings: { gridSize: 12 } },
    ]
    const state = materialize(events)
    expect(state.title).toBe('Canvas')
    expect(state.gridSize).toBe(12)
    expect(state.widgets).toHaveLength(2)
    expect(state.widgets[0]).toEqual({ id: 'w1', type: 'sticky-note', position: { x: 0, y: 0 }, props: { text: 'Updated hello', color: 'yellow' } })
    expect(state.widgets[1]).toEqual({ id: 'w2', type: 'markdown', position: { x: 200, y: 300 }, props: { content: '# Title' } })
  })
})

describe('connectors', () => {
  const baseEvents = [
    { event: 'canvas_created', timestamp: '1', title: 'Test', widgets: [
      { id: 'w1', type: 'sticky-note', position: { x: 0, y: 0 }, props: {} },
      { id: 'w2', type: 'markdown', position: { x: 200, y: 0 }, props: {} },
      { id: 'w3', type: 'sticky-note', position: { x: 400, y: 0 }, props: {} },
    ] },
  ]

  const connector = {
    id: 'connector-001',
    type: 'connector',
    connectorType: 'default',
    start: { widgetId: 'w1', anchor: 'right' },
    end: { widgetId: 'w2', anchor: 'left' },
    meta: {},
  }

  it('materializes connector_added events into connectors array', () => {
    const state = materialize([
      ...baseEvents,
      { event: 'connector_added', timestamp: '2', connector },
    ])
    expect(state.connectors).toHaveLength(1)
    expect(state.connectors[0].id).toBe('connector-001')
  })

  it('derives connectorIds on widgets from connectors', () => {
    const state = materialize([
      ...baseEvents,
      { event: 'connector_added', timestamp: '2', connector },
    ])
    expect(state.widgets.find((w) => w.id === 'w1').connectorIds).toEqual(['connector-001'])
    expect(state.widgets.find((w) => w.id === 'w2').connectorIds).toEqual(['connector-001'])
    expect(state.widgets.find((w) => w.id === 'w3').connectorIds).toBeUndefined()
  })

  it('removes connectors with connector_removed', () => {
    const state = materialize([
      ...baseEvents,
      { event: 'connector_added', timestamp: '2', connector },
      { event: 'connector_removed', timestamp: '3', connectorId: 'connector-001' },
    ])
    expect(state.connectors).toHaveLength(0)
    // connectorIds should not appear on widgets when no connectors reference them
    expect(state.widgets.find((w) => w.id === 'w1').connectorIds).toBeUndefined()
  })

  it('cascades connector removal when widget is removed', () => {
    const state = materialize([
      ...baseEvents,
      { event: 'connector_added', timestamp: '2', connector },
      { event: 'widget_removed', timestamp: '3', widgetId: 'w1' },
    ])
    expect(state.connectors).toHaveLength(0)
    expect(state.widgets).toHaveLength(2)
  })

  it('cleans orphaned connectors on widgets_replaced', () => {
    const state = materialize([
      ...baseEvents,
      { event: 'connector_added', timestamp: '2', connector },
      { event: 'widgets_replaced', timestamp: '3', widgets: [
        { id: 'w2', type: 'markdown', position: { x: 200, y: 0 }, props: {} },
        { id: 'w3', type: 'sticky-note', position: { x: 400, y: 0 }, props: {} },
      ] },
    ])
    // w1 removed by replacement, so connector referencing w1 is orphaned
    expect(state.connectors).toHaveLength(0)
  })

  it('supports multiple connectors on the same widget', () => {
    const conn2 = {
      id: 'connector-002',
      type: 'connector',
      connectorType: 'default',
      start: { widgetId: 'w2', anchor: 'right' },
      end: { widgetId: 'w3', anchor: 'left' },
      meta: {},
    }
    const state = materialize([
      ...baseEvents,
      { event: 'connector_added', timestamp: '2', connector },
      { event: 'connector_added', timestamp: '3', connector: conn2 },
    ])
    expect(state.connectors).toHaveLength(2)
    expect(state.widgets.find((w) => w.id === 'w2').connectorIds).toEqual(
      expect.arrayContaining(['connector-001', 'connector-002']),
    )
    expect(state.widgets.find((w) => w.id === 'w2').connectorIds).toHaveLength(2)
  })

  it('initializes connectors array when none existed', () => {
    const state = materialize([
      { event: 'canvas_created', timestamp: '1', title: 'Empty', widgets: [
        { id: 'w1', type: 'sticky-note', position: { x: 0, y: 0 }, props: {} },
        { id: 'w2', type: 'sticky-note', position: { x: 100, y: 0 }, props: {} },
      ] },
      { event: 'connector_added', timestamp: '2', connector },
    ])
    expect(state.connectors).toHaveLength(1)
  })

  it('updates connector anchors in-place via connector_updated', () => {
    const state = materialize([
      ...baseEvents,
      { event: 'connector_added', timestamp: '2', connector },
      { event: 'connector_updated', timestamp: '3', connectorId: 'connector-001', updates: {
        startAnchor: 'bottom',
        endAnchor: 'top',
      } },
    ])
    expect(state.connectors).toHaveLength(1)
    expect(state.connectors[0].start.widgetId).toBe('w1')
    expect(state.connectors[0].start.anchor).toBe('bottom')
    expect(state.connectors[0].end.widgetId).toBe('w2')
    expect(state.connectors[0].end.anchor).toBe('top')
  })

  it('updates only startAnchor when endAnchor is omitted', () => {
    const state = materialize([
      ...baseEvents,
      { event: 'connector_added', timestamp: '2', connector },
      { event: 'connector_updated', timestamp: '3', connectorId: 'connector-001', updates: {
        startAnchor: 'top',
      } },
    ])
    expect(state.connectors[0].start.anchor).toBe('top')
    expect(state.connectors[0].end.anchor).toBe('left')
  })

  it('does not leak startAnchor/endAnchor as top-level connector properties', () => {
    const state = materialize([
      ...baseEvents,
      { event: 'connector_added', timestamp: '2', connector },
      { event: 'connector_updated', timestamp: '3', connectorId: 'connector-001', updates: {
        startAnchor: 'bottom',
        endAnchor: 'top',
      } },
    ])
    expect(state.connectors[0]).not.toHaveProperty('startAnchor')
    expect(state.connectors[0]).not.toHaveProperty('endAnchor')
  })

  it('preserves meta when updating anchors', () => {
    const state = materialize([
      ...baseEvents,
      { event: 'connector_added', timestamp: '2', connector },
      { event: 'connector_updated', timestamp: '3', connectorId: 'connector-001', updates: {
        meta: { messagingMode: 'two-way' },
      } },
      { event: 'connector_updated', timestamp: '4', connectorId: 'connector-001', updates: {
        startAnchor: 'bottom',
      } },
    ])
    expect(state.connectors[0].start.anchor).toBe('bottom')
    expect(state.connectors[0].meta.messagingMode).toBe('two-way')
  })
})

describe('materializeFromText', () => {
  it('parses and materializes in one step', () => {
    const text = '{"event":"canvas_created","timestamp":"2026-01-01","title":"Test","widgets":[]}\n{"event":"widget_added","timestamp":"2026-01-02","widget":{"id":"w1","type":"sticky-note","position":{"x":0,"y":0},"props":{"text":"Hello"}}}\n'
    const state = materializeFromText(text)
    expect(state.title).toBe('Test')
    expect(state.widgets).toHaveLength(1)
    expect(state.widgets[0].props.text).toBe('Hello')
  })
})

describe('serializeEvent', () => {
  it('serializes an event to a single line', () => {
    const event = { event: 'widget_added', timestamp: '2026-01-01', widget: { id: 'w1' } }
    const line = serializeEvent(event)
    expect(line).not.toContain('\n')
    expect(JSON.parse(line)).toEqual(event)
  })
})
