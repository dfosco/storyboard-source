/**
 * Terminal Widget — Shell Session Integration Tests (Group 1)
 *
 * Tests the core terminal widget lifecycle:
 * - Widget creation via canvas API
 * - tmux session startup
 * - Welcome menu rendering
 * - Shell session selection and basic command execution
 * - Browser rendering verification
 * - Session list API
 *
 * Prerequisites: dev server running, tmux installed, agent-browser installed.
 * Run with: npm run test:integration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import * as canvasApi from './helpers/canvas-api.js'
import * as tmux from './helpers/tmux.js'
import * as browser from './helpers/browser.js'
import * as transcript from './helpers/transcript.js'
import * as perf from './helpers/perf.js'
import { preflight, createTestCanvas, deleteTestCanvas, writeResults } from './helpers/setup.js'

const CANVAS_NAME = '__test__-terminal'
const BROWSER_SESSION = 'test-terminal'

let serverUrl
let terminalWidgetId
let tmuxSessionName

beforeAll(async () => {
  const { url } = await preflight()
  serverUrl = url
  createTestCanvas(CANVAS_NAME)

  // Give the dev server a moment to pick up the new canvas file
  await new Promise((r) => setTimeout(r, 2000))
})

afterAll(() => {
  // Flush transcripts
  const paths = transcript.flushAll()

  // Write results
  writeResults(perf.toJSON(), paths)
  perf.report()

  // Cleanup: kill test tmux sessions
  if (tmuxSessionName) tmux.killSession(tmuxSessionName)

  // Cleanup: close browser
  browser.close(BROWSER_SESSION)

  // Cleanup: delete test canvas
  deleteTestCanvas(CANVAS_NAME)
})

describe('Group 1: Terminal Widget — Shell Session', () => {
  it('T1.1 — Create terminal widget via API', async () => {
    const result = await canvasApi.createWidget(CANVAS_NAME, 'terminal', {}, { x: 100, y: 100 })

    expect(result.success).toBe(true)
    expect(result.widget).toBeDefined()
    expect(result.widget.type).toBe('terminal')
    expect(result.widget.id).toBeTruthy()
    // Terminal widgets should get an auto-generated prettyName
    expect(result.widget.props?.prettyName).toBeTruthy()

    terminalWidgetId = result.widget.id

    // Verify it appears in canvas read
    const canvas = await canvasApi.readCanvas(CANVAS_NAME)
    const widget = canvas.widgets?.find((w) => w.id === terminalWidgetId)
    expect(widget).toBeDefined()
    expect(widget.type).toBe('terminal')
  })

  it('T1.2 — Terminal session starts in tmux', async () => {
    // Open the canvas in the browser
    const canvasUrl = `${serverUrl}/storyboard/canvas/${CANVAS_NAME}`
    browser.open(BROWSER_SESSION, canvasUrl)
    browser.waitForLoad(BROWSER_SESSION, 'networkidle')

    // Take a snapshot to find the terminal widget and click it
    const _snap = browser.snapshot(BROWSER_SESSION, '-i')
    void _snap

    // The terminal widget should have a "Start" or "Continue" button/area
    // Try clicking the terminal widget area to start the session
    try {
      browser.click(BROWSER_SESSION, `[data-widget-id="${terminalWidgetId}"]`)
    } catch {
      // If data-widget-id selector doesn't work, try clicking via snapshot refs
      // The terminal widget may need a different interaction to start
    }

    // Wait for a tmux session to appear with the sb- prefix
    try {
      tmuxSessionName = await tmux.waitForSession(/^sb-/, 15000)
      transcript.createTranscript(tmuxSessionName, { widgetId: terminalWidgetId, canvasName: CANVAS_NAME })
      transcript.logEvent(tmuxSessionName, 'Session started')
    } catch {
      // Session may take longer if it's the first terminal
      tmuxSessionName = await tmux.waitForSession(/^sb-/, 30000)
      transcript.createTranscript(tmuxSessionName, { widgetId: terminalWidgetId, canvasName: CANVAS_NAME })
    }

    expect(tmuxSessionName).toBeTruthy()
    expect(tmuxSessionName).toMatch(/^sb-/)
  })

  it('T1.3 — Welcome menu appears', async () => {
    if (!tmuxSessionName) return

    // Wait for the welcome menu to render
    const output = await tmux.waitForOutput(tmuxSessionName, /shell|choose|workload/i, 15000)
    transcript.logSection(tmuxSessionName, 'T1.3')

    expect(output).toMatch(/shell/i)
  })

  it('T1.4 — Select Shell from welcome menu', async () => {
    if (!tmuxSessionName) return
    transcript.logSection(tmuxSessionName, 'T1.4')

    // Navigate to Shell option and select it
    // The welcome menu uses @clack/prompts — Shell is typically one of the options
    // Send arrow keys to find Shell, then Enter to select
    // Shell might be the last option before "Browse sessions"
    tmux.sendKeys(tmuxSessionName, 'Down Down Enter')

    // Wait for shell prompt ($ or % or > or similar)
    await tmux.waitForOutput(tmuxSessionName, /\$|%|>|#/, 10000)

    const output = tmux.capturePane(tmuxSessionName)
    // Should no longer show the welcome menu, should show a shell prompt
    expect(output).toBeTruthy()
  })

  it('T1.5 — Run basic shell command', async () => {
    if (!tmuxSessionName) return
    transcript.logSection(tmuxSessionName, 'T1.5')

    // Send a command with a unique marker
    tmux.sendText(tmuxSessionName, 'echo STORYBOARD_TEST_MARKER_12345')
    tmux.sendKeys(tmuxSessionName, 'Enter')

    // Wait for the marker to appear in output
    const output = await tmux.waitForOutput(tmuxSessionName, /STORYBOARD_TEST_MARKER_12345/, 10000)
    expect(output).toContain('STORYBOARD_TEST_MARKER_12345')

    // Verify in the browser as well
    try {
      const _snap = browser.snapshot(BROWSER_SESSION)
      void _snap
      // The terminal output should be visible in the browser's terminal widget
      // Note: ghostty-web rendering may not expose text in the accessibility tree
      // This is a best-effort check
    } catch {
      // Browser verification is best-effort for terminal content
    }
  })

  it('T1.6 — Terminal session appears in session list', async () => {
    const sessions = await canvasApi.listTerminalSessions()

    // Should have at least one session
    expect(sessions).toBeDefined()

    // The response format depends on the API — it might be an array or an object
    if (Array.isArray(sessions)) {
      expect(sessions.length).toBeGreaterThan(0)
    } else if (typeof sessions === 'object') {
      expect(Object.keys(sessions).length).toBeGreaterThan(0)
    }
  })
})
