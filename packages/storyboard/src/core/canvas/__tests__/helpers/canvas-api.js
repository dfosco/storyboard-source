/**
 * Canvas HTTP API helpers for integration tests.
 *
 * Wraps fetch calls to /_storyboard/canvas/* endpoints.
 * Every call is automatically timed via perf.js.
 */

import * as perf from './perf.js'

let baseUrl = 'http://localhost:1234'

/** Set the base URL for all API calls. */
export function setBaseUrl(url) {
  baseUrl = url.replace(/\/$/, '')
}

/** Get the current base URL. */
export function getBaseUrl() {
  return baseUrl
}

async function apiFetch(path, options = {}) {
  const url = `${baseUrl}/_storyboard/canvas${path}`
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = { raw: text }
  }
  if (!res.ok && !options.allowFailure) {
    throw new Error(`API ${options.method || 'GET'} ${path} returned ${res.status}: ${JSON.stringify(json)}`)
  }
  return { status: res.status, ok: res.ok, data: json }
}

/** Create a widget on a canvas. */
export async function createWidget(canvasName, type, props = {}, position = { x: 0, y: 0 }) {
  const timer = perf.start(`widget.create`, { type })
  const res = await apiFetch('/widget', {
    method: 'POST',
    body: JSON.stringify({ name: canvasName, type, props, position }),
  })
  timer.end({ widgetId: res.data?.widget?.id })
  return res.data
}

/** Read full canvas state. */
export async function readCanvas(canvasName) {
  const timer = perf.start('canvas.read', { canvas: canvasName })
  const res = await apiFetch(`/read?name=${encodeURIComponent(canvasName)}`)
  timer.end({ widgetCount: res.data?.widgets?.length })
  return res.data
}

/** Read a specific widget from a canvas. */
export async function readWidget(canvasName, widgetId) {
  const timer = perf.start('canvas.readWidget', { canvas: canvasName, widgetId })
  const res = await apiFetch(`/read?name=${encodeURIComponent(canvasName)}&widget=${encodeURIComponent(widgetId)}`)
  timer.end()
  return res.data
}

/** Update a widget's props and/or position. */
export async function updateWidget(canvasName, widgetId, { props, position } = {}) {
  const timer = perf.start('widget.update', { widgetId })
  const body = { name: canvasName, widgetId }
  if (props) body.props = props
  if (position) body.position = position
  const res = await apiFetch('/widget', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  timer.end()
  return res.data
}

/** Delete a widget from a canvas. */
export async function deleteWidget(canvasName, widgetId) {
  const timer = perf.start('widget.delete', { widgetId })
  const res = await apiFetch('/widget', {
    method: 'DELETE',
    body: JSON.stringify({ name: canvasName, widgetId }),
  })
  timer.end()
  return res.data
}

/** Add a connector between two widgets. */
export async function addConnector(canvasName, startWidgetId, startAnchor, endWidgetId, endAnchor) {
  const timer = perf.start('connector.add')
  const res = await apiFetch('/connector', {
    method: 'POST',
    body: JSON.stringify({ name: canvasName, startWidgetId, startAnchor, endWidgetId, endAnchor }),
  })
  timer.end({ connectorId: res.data?.connector?.id })
  return res.data
}

/** Remove a connector. */
export async function removeConnector(canvasName, connectorId) {
  const timer = perf.start('connector.remove')
  const res = await apiFetch('/connector', {
    method: 'DELETE',
    body: JSON.stringify({ name: canvasName, connectorId }),
  })
  timer.end()
  return res.data
}

/** List terminal sessions. */
export async function listTerminalSessions() {
  const res = await apiFetch('/../terminal/sessions')
  return res.data
}

/** Check if the dev server is reachable. */
export async function healthCheck() {
  try {
    const res = await fetch(`${baseUrl}/_storyboard/canvas/list`, { signal: AbortSignal.timeout(5000) })
    return res.ok
  } catch {
    return false
  }
}
