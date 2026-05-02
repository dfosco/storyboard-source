import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { createCanvasHandler } from './server.js'
import { serializeEvent } from './materializer.js'

/**
 * Helper: create a minimal canvas handler wired to a temp directory.
 * Returns { handler, root, canvasDir, lastResponse }.
 */
function setup() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-canvas-test-'))
  const canvasDir = path.join(root, 'src', 'canvas')
  fs.mkdirSync(canvasDir, { recursive: true })

  const lastResponse = { status: null, body: null }

  const ctx = {
    root,
    sendJson: (_res, status, body) => {
      lastResponse.status = status
      lastResponse.body = body
    },
  }

  const handler = createCanvasHandler(ctx)

  const invoke = (routePath, method, body = {}) =>
    handler(null, null, { path: routePath, method, body })

  return { invoke, root, canvasDir, lastResponse }
}

/**
 * Helper: write a single-page canvas file at src/canvas/{name}.canvas.jsonl
 */
function writeCanvas(canvasDir, name, { title, author, description, jsx } = {}) {
  const event = {
    event: 'canvas_created',
    timestamp: new Date().toISOString(),
    title: title || name,
    grid: true,
    gridSize: 24,
    colorMode: 'auto',
    widgets: [],
  }
  if (author) event.author = author
  if (description) event.description = description
  if (jsx) event.jsx = jsx
  const filePath = path.join(canvasDir, `${name}.canvas.jsonl`)
  fs.writeFileSync(filePath, serializeEvent(event) + '\n', 'utf-8')
  return filePath
}

describe('POST /create with convertFrom', () => {
  let root, canvasDir, invoke, lastResponse

  beforeEach(() => {
    ({ invoke, root, canvasDir, lastResponse } = setup())
  })

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true })
  })

  it('converts a single-page canvas to a multi-page folder', async () => {
    writeCanvas(canvasDir, 'my-canvas', { title: 'My Canvas', author: 'test' })

    await invoke('/create', 'POST', { name: 'new-page', convertFrom: 'my-canvas' })

    expect(lastResponse.status).toBe(201)
    expect(lastResponse.body.converted).toBe(true)
    expect(lastResponse.body.name).toBe('my-canvas/new-page')
    expect(lastResponse.body.route).toBe('/canvas/my-canvas/new-page')

    // Original file should be moved into the folder
    expect(fs.existsSync(path.join(canvasDir, 'my-canvas.canvas.jsonl'))).toBe(false)
    expect(fs.existsSync(path.join(canvasDir, 'my-canvas', 'my-canvas.canvas.jsonl'))).toBe(true)

    // New page should exist
    expect(fs.existsSync(path.join(canvasDir, 'my-canvas', 'new-page.canvas.jsonl'))).toBe(true)

    // Meta file should exist with correct content
    const metaPath = path.join(canvasDir, 'my-canvas', 'my-canvas.meta.json')
    expect(fs.existsSync(metaPath)).toBe(true)
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
    expect(meta.title).toBe('My Canvas')
    expect(meta.author).toBe('test')
  })

  it('preserves description in meta.json', async () => {
    writeCanvas(canvasDir, 'noted', { title: 'Noted', description: 'A described canvas' })

    await invoke('/create', 'POST', { name: 'page-two', convertFrom: 'noted' })

    expect(lastResponse.status).toBe(201)
    const meta = JSON.parse(fs.readFileSync(path.join(canvasDir, 'noted', 'noted.meta.json'), 'utf-8'))
    expect(meta.description).toBe('A described canvas')
  })

  it('rejects convertFrom with path segments', async () => {
    await invoke('/create', 'POST', { name: 'page', convertFrom: 'folder/canvas' })

    expect(lastResponse.status).toBe(400)
    expect(lastResponse.body.error).toContain('flat root canvases')
  })

  it('rejects convertFrom with proto: prefix', async () => {
    await invoke('/create', 'POST', { name: 'page', convertFrom: 'proto:MyApp/board' })

    expect(lastResponse.status).toBe(400)
    expect(lastResponse.body.error).toContain('flat root canvases')
  })

  it('returns 404 when convertFrom canvas does not exist', async () => {
    await invoke('/create', 'POST', { name: 'page', convertFrom: 'nonexistent' })

    expect(lastResponse.status).toBe(404)
  })

  it('rejects when target directory already exists', async () => {
    writeCanvas(canvasDir, 'taken')
    fs.mkdirSync(path.join(canvasDir, 'taken'))

    await invoke('/create', 'POST', { name: 'page', convertFrom: 'taken' })

    expect(lastResponse.status).toBe(409)
    expect(lastResponse.body.error).toContain('already exists')
  })

  it('rejects when new page name collides with existing canvas filename', async () => {
    writeCanvas(canvasDir, 'solo')

    await invoke('/create', 'POST', { name: 'solo', convertFrom: 'solo' })

    expect(lastResponse.status).toBe(409)
    expect(lastResponse.body.error).toContain('collides')
  })
})

// ──────────────────────────────────────────────────
// POST /batch
// ──────────────────────────────────────────────────

describe('POST /batch', () => {
  let root, canvasDir, invoke, lastResponse

  beforeEach(() => {
    ({ invoke, root, canvasDir, lastResponse } = setup())
    writeCanvas(canvasDir, 'test-canvas')
  })

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true })
  })

  it('creates multiple widgets in one batch', async () => {
    await invoke('/batch', 'POST', {
      name: 'test-canvas',
      operations: [
        { op: 'create-widget', type: 'sticky-note', props: { text: 'A' } },
        { op: 'create-widget', type: 'sticky-note', props: { text: 'B' } },
        { op: 'create-widget', type: 'sticky-note', props: { text: 'C' } },
      ],
    })

    expect(lastResponse.status).toBe(200)
    expect(lastResponse.body.success).toBe(true)
    expect(lastResponse.body.results).toHaveLength(3)
    expect(lastResponse.body.results[0].widget.props.text).toBe('A')
    expect(lastResponse.body.results[1].widget.props.text).toBe('B')
    expect(lastResponse.body.results[2].widget.props.text).toBe('C')
  })

  it('auto-assigns index refs ($0, $1, ...)', async () => {
    await invoke('/batch', 'POST', {
      name: 'test-canvas',
      operations: [
        { op: 'create-widget', type: 'sticky-note', props: { text: 'first' } },
        { op: 'create-widget', type: 'sticky-note', props: { text: 'second' } },
      ],
    })

    expect(lastResponse.body.success).toBe(true)
    const { refs } = lastResponse.body
    expect(refs['0']).toBe(lastResponse.body.results[0].widgetId)
    expect(refs['1']).toBe(lastResponse.body.results[1].widgetId)
  })

  it('supports named refs alongside index refs', async () => {
    await invoke('/batch', 'POST', {
      name: 'test-canvas',
      operations: [
        { op: 'create-widget', type: 'sticky-note', ref: 'header', props: { text: 'H' } },
      ],
    })

    expect(lastResponse.body.success).toBe(true)
    const { refs } = lastResponse.body
    const widgetId = lastResponse.body.results[0].widgetId
    expect(refs['0']).toBe(widgetId)
    expect(refs['header']).toBe(widgetId)
  })

  it('resolves $index refs in create-connector', async () => {
    // First create a widget to act as the "existing" terminal widget
    await invoke('/widget', 'POST', { name: 'test-canvas', type: 'terminal', props: {} })
    const terminalId = lastResponse.body.widget.id

    await invoke('/batch', 'POST', {
      name: 'test-canvas',
      operations: [
        { op: 'create-widget', type: 'sticky-note', props: { text: 'target' } },
        { op: 'create-connector', startWidgetId: terminalId, endWidgetId: '$0', startAnchor: 'right', endAnchor: 'left' },
      ],
    })

    expect(lastResponse.body.success).toBe(true)
    expect(lastResponse.body.results).toHaveLength(2)
    expect(lastResponse.body.results[1].op).toBe('create-connector')
    expect(lastResponse.body.results[1].connectorId).toBeTruthy()
  })

  it('resolves $named refs in update-widget', async () => {
    await invoke('/batch', 'POST', {
      name: 'test-canvas',
      operations: [
        { op: 'create-widget', type: 'sticky-note', ref: 'note', props: { text: 'before' } },
        { op: 'update-widget', widgetId: '$note', props: { text: 'after' } },
      ],
    })

    expect(lastResponse.body.success).toBe(true)
    expect(lastResponse.body.results[1].op).toBe('update-widget')
    expect(lastResponse.body.results[1].success).toBe(true)
  })

  it('supports move-widget with ref resolution', async () => {
    await invoke('/batch', 'POST', {
      name: 'test-canvas',
      operations: [
        { op: 'create-widget', type: 'sticky-note', position: { x: 0, y: 0 }, props: { text: 'X' } },
        { op: 'move-widget', widgetId: '$0', position: { x: 500, y: 300 } },
      ],
    })

    expect(lastResponse.body.success).toBe(true)
    expect(lastResponse.body.results[1].op).toBe('move-widget')
    expect(lastResponse.body.results[1].success).toBe(true)
  })

  it('supports delete-widget with ref resolution', async () => {
    await invoke('/batch', 'POST', {
      name: 'test-canvas',
      operations: [
        { op: 'create-widget', type: 'sticky-note', props: { text: 'temp' } },
        { op: 'delete-widget', widgetId: '$0' },
      ],
    })

    expect(lastResponse.body.success).toBe(true)
    expect(lastResponse.body.results[1].op).toBe('delete-widget')
    expect(lastResponse.body.results[1].success).toBe(true)
  })

  it('fails fast on unknown ref', async () => {
    await invoke('/batch', 'POST', {
      name: 'test-canvas',
      operations: [
        { op: 'create-widget', type: 'sticky-note', props: { text: 'ok' } },
        { op: 'update-widget', widgetId: '$nonexistent', props: { text: 'fail' } },
      ],
    })

    expect(lastResponse.status).toBe(400)
    expect(lastResponse.body.success).toBe(false)
    expect(lastResponse.body.failedAt).toBe(1)
    expect(lastResponse.body.error).toContain('Unknown ref')
    // First operation's result should still be returned
    expect(lastResponse.body.results).toHaveLength(1)
    expect(lastResponse.body.results[0].op).toBe('create-widget')
  })

  it('fails fast on unknown operation type', async () => {
    await invoke('/batch', 'POST', {
      name: 'test-canvas',
      operations: [
        { op: 'explode-widget' },
      ],
    })

    expect(lastResponse.status).toBe(400)
    expect(lastResponse.body.success).toBe(false)
    expect(lastResponse.body.failedAt).toBe(0)
    expect(lastResponse.body.error).toContain('Unknown operation')
  })

  it('rejects empty operations array', async () => {
    await invoke('/batch', 'POST', {
      name: 'test-canvas',
      operations: [],
    })

    expect(lastResponse.status).toBe(400)
    expect(lastResponse.body.error).toContain('non-empty')
  })

  it('rejects missing canvas name', async () => {
    await invoke('/batch', 'POST', {
      operations: [{ op: 'create-widget', type: 'sticky-note' }],
    })

    expect(lastResponse.status).toBe(400)
    expect(lastResponse.body.error).toContain('Canvas name')
  })

  it('rejects batch exceeding 200 operations', async () => {
    const ops = Array.from({ length: 201 }, (_, i) => ({
      op: 'create-widget', type: 'sticky-note', props: { text: `#${i}` },
    }))

    await invoke('/batch', 'POST', { name: 'test-canvas', operations: ops })

    expect(lastResponse.status).toBe(400)
    expect(lastResponse.body.error).toContain('200')
  })

  it('returns 404 for unknown canvas', async () => {
    await invoke('/batch', 'POST', {
      name: 'nonexistent',
      operations: [{ op: 'create-widget', type: 'sticky-note' }],
    })

    expect(lastResponse.status).toBe(404)
  })

  it('supports full create-update-move-connect workflow', async () => {
    // Create a pre-existing terminal widget for connectors
    await invoke('/widget', 'POST', { name: 'test-canvas', type: 'terminal', props: {} })
    const termId = lastResponse.body.widget.id

    await invoke('/batch', 'POST', {
      name: 'test-canvas',
      operations: [
        { op: 'create-widget', type: 'sticky-note', position: { x: 100, y: 100 }, props: { text: 'Draft' } },
        { op: 'update-widget', widgetId: '$0', props: { text: 'Final', color: 'blue' } },
        { op: 'move-widget', widgetId: '$0', position: { x: 500, y: 300 } },
        { op: 'create-connector', startWidgetId: termId, endWidgetId: '$0', startAnchor: 'right', endAnchor: 'left' },
      ],
    })

    expect(lastResponse.body.success).toBe(true)
    expect(lastResponse.body.results).toHaveLength(4)
    expect(lastResponse.body.results[0].op).toBe('create-widget')
    expect(lastResponse.body.results[1].op).toBe('update-widget')
    expect(lastResponse.body.results[2].op).toBe('move-widget')
    expect(lastResponse.body.results[3].op).toBe('create-connector')
  })

  it('connector refs also get index refs', async () => {
    await invoke('/widget', 'POST', { name: 'test-canvas', type: 'terminal', props: {} })
    const termId = lastResponse.body.widget.id

    await invoke('/batch', 'POST', {
      name: 'test-canvas',
      operations: [
        { op: 'create-widget', type: 'sticky-note', props: { text: 'A' } },
        { op: 'create-connector', startWidgetId: termId, endWidgetId: '$0', startAnchor: 'right', endAnchor: 'left' },
      ],
    })

    expect(lastResponse.body.success).toBe(true)
    const { refs } = lastResponse.body
    // Op 0 = widget, Op 1 = connector — both get index refs
    expect(refs['0']).toMatch(/^sticky-note-/)
    expect(refs['1']).toMatch(/^connector-/)
  })
})
