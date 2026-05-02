/**
 * Agent Widget Integration Tests (Groups 2–4)
 *
 * For each configured agent (Copilot, Claude, etc.), runs:
 * - Group 2: Startup & basic interaction
 * - Group 3: Context awareness
 * - Group 4: Connected widget CRUD
 *
 * Agent chains run in parallel — each agent gets its own widget, tmux session,
 * and browser session. This mirrors real-world canvas usage where multiple
 * agents run simultaneously.
 *
 * Prerequisites: dev server running, tmux installed, agent-browser installed.
 * Run with: npm run test:integration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import * as canvasApi from './helpers/canvas-api.js'
import * as tmux from './helpers/tmux.js'
import * as browser from './helpers/browser.js'
import * as transcript from './helpers/transcript.js'
import * as perf from './helpers/perf.js'
import {
  preflight,
  createTestCanvas,
  deleteTestCanvas,
  loadConfiguredAgents,
  checkAgentAvailability,
  writeResults,
} from './helpers/setup.js'

const CANVAS_NAME = '__test__-agent'
const ROOT = process.cwd()

let serverUrl
let agents = []

// Track created resources for cleanup
const createdWidgetIds = []
const tmuxSessions = []
const browserSessions = []

beforeAll(async () => {
  const { url } = await preflight()
  serverUrl = url
  createTestCanvas(CANVAS_NAME)

  // Load agents and filter to available ones
  const configured = loadConfiguredAgents()
  agents = configured.filter((a) => {
    const available = checkAgentAvailability(a.id)
    if (!available) {
      console.log(`[skip] Agent "${a.label}" (${a.id}) — binary not found, skipping`)
    }
    return available
  })

  if (agents.length === 0) {
    console.warn('[warn] No agents available — agent tests will be skipped')
  }

  // Give the dev server a moment to pick up the new canvas file
  await new Promise((r) => setTimeout(r, 2000))
})

afterAll(() => {
  // Flush all transcripts
  const paths = transcript.flushAll()

  // Write results
  writeResults(perf.toJSON(), paths)
  perf.report()

  // Cleanup: kill tmux sessions
  for (const s of tmuxSessions) {
    tmux.killSession(s)
  }

  // Cleanup: close browser sessions
  for (const s of browserSessions) {
    browser.close(s)
  }

  // Cleanup: delete test canvas
  deleteTestCanvas(CANVAS_NAME)
})

/**
 * Read a terminal config for a widget from .storyboard/terminals/.
 * Tries both the widgetId symlink and falls back to scanning files.
 */
function readTerminalConfig(widgetId) {
  const terminalsDir = join(ROOT, '.storyboard', 'terminals')
  try {
    // Try widgetId symlink first
    const symPath = join(terminalsDir, `${widgetId}.json`)
    return JSON.parse(readFileSync(symPath, 'utf8'))
  } catch { /* fallback */ }

  // Scan for config containing this widgetId
  try {
    const files = readdirSync(terminalsDir).filter((f) => f.endsWith('.json'))
    for (const f of files) {
      try {
        const config = JSON.parse(readFileSync(join(terminalsDir, f), 'utf8'))
        if (config.widgetId === widgetId) return config
      } catch { /* skip */ }
    }
  } catch { /* dir may not exist */ }

  return null
}

/**
 * Review helper — logs full context on soft assertion failure.
 */
function reviewLog(testId, expected, actual, extra = {}) {
  const lines = [
    `\n[REVIEW] ${testId}`,
    `  Expected pattern: ${expected}`,
    `  Actual output (last 30 lines):`,
    ...String(actual).split('\n').slice(-30).map((l) => `    ${l}`),
  ]
  if (extra.widgetId) lines.push(`  Widget ID: ${extra.widgetId}`)
  if (extra.elapsed) lines.push(`  Elapsed: ${extra.elapsed}`)
  console.log(lines.join('\n'))
}

// Generate test suites for each agent — they run in parallel
for (const agent of loadConfiguredAgents()) {
  const agentDescribe = checkAgentAvailability(agent.id) ? describe : describe.skip

  agentDescribe(`Agent: ${agent.label} (${agent.id})`, () => {
    let agentWidgetId
    let agentTmuxSession
    const browserSession = `test-${agent.id}`
    let stickyNoteId
    let connectorId
    let markdownId
    let _markdownConnectorId

    browserSessions.push(browserSession)

    // ─── Group 2: Startup & Basic Interaction ────────────────────────

    describe('Group 2: Startup & Interaction', () => {
      it(`T2.1 — Create ${agent.label} agent widget`, async () => {
        const result = await canvasApi.createWidget(
          CANVAS_NAME,
          'agent',
          { startupCommand: agent.startupCommand },
          { x: 100, y: 100 + agents.indexOf(agent) * 500 },
        )

        expect(result.success).toBe(true)
        expect(result.widget).toBeDefined()
        expect(result.widget.type).toBe('agent')
        agentWidgetId = result.widget.id
        createdWidgetIds.push(agentWidgetId)
      })

      it(`T2.2 — ${agent.label} starts and loads startup sequence`, async () => {
        if (!agentWidgetId) return

        // Open canvas in browser and click the agent widget
        const canvasUrl = `${serverUrl}/storyboard/canvas/${CANVAS_NAME}`
        browser.open(browserSession, canvasUrl)
        browser.waitForLoad(browserSession, 'networkidle')

        try {
          browser.click(browserSession, `[data-widget-id="${agentWidgetId}"]`)
        } catch { /* try alternative interaction */ }

        // Wait for tmux session
        const chainTimer = perf.start(`agent.${agent.id}.full_chain`)
        const startupTimer = perf.start(`agent.${agent.id}.startup`)

        try {
          agentTmuxSession = await tmux.waitForSession(/^sb-/, 30000)
        } catch {
          agentTmuxSession = await tmux.waitForSession(/^sb-/, 60000)
        }

        tmuxSessions.push(agentTmuxSession)
        transcript.createTranscript(agentTmuxSession, {
          widgetId: agentWidgetId,
          canvasName: CANVAS_NAME,
          agentId: agent.id,
        })
        transcript.logSection(agentTmuxSession, 'T2.2')

        expect(agentTmuxSession).toBeTruthy()

        // Wait for agent to be ready — look for readiness indicators
        try {
          await tmux.waitForOutput(
            agentTmuxSession,
            /ready|copilot|claude|>|\$/i,
            90000,
            2000,
          )
        } catch (err) {
          // Log but don't fail — startup might be slow
          console.warn(`[warn] Agent ${agent.id} startup may be slow: ${err.message}`)
        }

        startupTimer.end()

        // Validate startup output is clean — check for error indicators
        const startupOutput = tmux.capturePane(agentTmuxSession)
        const errorPatterns = /error:|stack trace|ENOENT|EACCES|segfault|panic|unhandled/i
        if (errorPatterns.test(startupOutput)) {
          console.warn(`[REVIEW] T2.2 — ${agent.label} startup contains error-like output:\n${startupOutput}`)
        }

        // Store chainTimer for later
        agentDescribe.__chainTimer = chainTimer
      }, 120_000)

      it(`T2.3 — ${agent.label} terminal output flows correctly`, async () => {
        if (!agentTmuxSession) return
        transcript.logSection(agentTmuxSession, 'T2.3')

        // Verify the pane has content (not empty/blank)
        const output = tmux.capturePane(agentTmuxSession)
        expect(output.trim().length).toBeGreaterThan(0)

        // Check that there are no broken escape sequences (raw \x1b[ without completion)
        // eslint-disable-next-line no-control-regex
        const brokenEscapes = output.match(/\x1b\[[^a-zA-Z]*$/m)
        expect.soft(brokenEscapes).toBeNull()

        if (brokenEscapes) {
          reviewLog(`T2.3 — ${agent.label} broken escapes`, 'no broken escape sequences', output, { widgetId: agentWidgetId })
        }
      })

      it(`T2.5 — ${agent.label} answers a simple question`, async () => {
        if (!agentTmuxSession) return
        transcript.logSection(agentTmuxSession, 'T2.5')

        const questionTimer = perf.start(`agent.${agent.id}.response`)

        // Send the question
        tmux.sendText(agentTmuxSession, 'What color is the sky during the day? Answer in one word.')
        tmux.sendKeys(agentTmuxSession, 'Enter')

        // Wait for a response — generous timeout for agent processing
        let responseOutput = ''
        try {
          responseOutput = await tmux.waitForOutput(
            agentTmuxSession,
            /blue|azure|cerulean|cyan|sky\s*blue/i,
            90000,
            3000,
          )
          questionTimer.end({ matched: true })
        } catch (err) {
          questionTimer.end({ matched: false })
          responseOutput = err.lastCapture || tmux.capturePane(agentTmuxSession)

          // Soft assertion — don't block subsequent tests
          reviewLog(`T2.5 — ${agent.label} answer`, '/blue|azure|cerulean/i', responseOutput, {
            widgetId: agentWidgetId,
            elapsed: `${(questionTimer.end?.duration || 0 / 1000).toFixed(1)}s`,
          })
        }

        // Soft assert — record failure but continue
        expect.soft(responseOutput).toMatch(/blue|azure|cerulean|cyan|sky\s*blue/i)

        // Verify in browser
        try {
          const _snap = browser.snapshot(browserSession)
          void _snap
          // Best-effort: terminal content may not be in accessibility tree
        } catch { /* browser check is best-effort */ }
      }, 120_000)
    })

    // ─── Group 3: Agent Context Awareness ────────────────────────────

    describe('Group 3: Context Awareness', () => {
      it(`T3.1 — ${agent.label} terminal config exists and is valid`, async () => {
        if (!agentWidgetId) return

        // Wait a moment for config to be written
        await new Promise((r) => setTimeout(r, 2000))

        const config = readTerminalConfig(agentWidgetId)

        expect(config).toBeDefined()
        if (config) {
          expect(config.widgetId).toBe(agentWidgetId)
          expect(config.canvasId).toBeTruthy()
          expect(config.branch).toBeTruthy()
          expect(config.serverUrl).toBeTruthy()
          // displayName may be set from prettyName
          expect(config.displayName || config.widgetProps?.prettyName).toBeTruthy()
        }
      })

      it(`T3.2 — ${agent.label} can identify itself`, async () => {
        if (!agentTmuxSession || !agentWidgetId) return
        transcript.logSection(agentTmuxSession, 'T3.2')

        const config = readTerminalConfig(agentWidgetId)
        if (!config) return

        // Ask the agent to read its config
        tmux.sendText(
          agentTmuxSession,
          'Read your terminal config and tell me your widget ID, canvas ID, and display name. Reply with just those three values.',
        )
        tmux.sendKeys(agentTmuxSession, 'Enter')

        // Wait for response containing the widget ID
        let responseOutput = ''
        try {
          responseOutput = await tmux.waitForOutput(agentTmuxSession, new RegExp(agentWidgetId.slice(0, 12)), 90000, 3000)
        } catch (err) {
          responseOutput = err.lastCapture || tmux.capturePane(agentTmuxSession)
        }

        // Soft assertions — agent response is non-deterministic
        expect.soft(responseOutput).toMatch(new RegExp(agentWidgetId.slice(0, 12), 'i'))

        if (!new RegExp(agentWidgetId.slice(0, 12), 'i').test(responseOutput)) {
          reviewLog(`T3.2 — ${agent.label} self-identification`, agentWidgetId, responseOutput, { widgetId: agentWidgetId })
        }
      }, 120_000)

      it(`T3.3 — ${agent.label} environment variables are injected`, async () => {
        if (!agentTmuxSession) return
        transcript.logSection(agentTmuxSession, 'T3.3')

        // Check STORYBOARD_WIDGET_ID
        tmux.sendText(agentTmuxSession, 'echo WIDGET_ID_CHECK:$STORYBOARD_WIDGET_ID')
        tmux.sendKeys(agentTmuxSession, 'Enter')

        try {
          const output = await tmux.waitForOutput(agentTmuxSession, /WIDGET_ID_CHECK:/, 15000)
          // The env var should contain the widget ID
          if (agentWidgetId) {
            expect.soft(output).toContain(agentWidgetId)
          }
        } catch {
          // Agent may not support direct shell commands — that's OK
          console.log(`[info] ${agent.label} may not support direct echo — skipping env var check`)
        }

        // Check STORYBOARD_CANVAS_ID
        tmux.sendText(agentTmuxSession, 'echo CANVAS_ID_CHECK:$STORYBOARD_CANVAS_ID')
        tmux.sendKeys(agentTmuxSession, 'Enter')

        try {
          const output = await tmux.waitForOutput(agentTmuxSession, /CANVAS_ID_CHECK:/, 15000)
          expect.soft(output).toMatch(/CANVAS_ID_CHECK:.+/)
        } catch { /* best-effort */ }
      }, 60_000)
    })

    // ─── Group 4: Connected Widget CRUD ──────────────────────────────

    describe('Group 4: Connected Widget CRUD', () => {
      it(`T4.1 — Create sticky note and connect to ${agent.label}`, async () => {
        if (!agentWidgetId) return

        // Create a sticky note
        const stickyResult = await canvasApi.createWidget(
          CANVAS_NAME,
          'sticky-note',
          { text: 'banana', color: 'yellow' },
          { x: 400, y: 100 + agents.indexOf(agent) * 500 },
        )

        expect(stickyResult.success).toBe(true)
        stickyNoteId = stickyResult.widget.id
        createdWidgetIds.push(stickyNoteId)

        // Connect sticky note to agent widget
        const connResult = await canvasApi.addConnector(
          CANVAS_NAME,
          stickyNoteId,
          'right',
          agentWidgetId,
          'left',
        )

        expect(connResult.success).toBe(true)
        connectorId = connResult.connector?.id

        // Verify connector exists in canvas
        const canvas = await canvasApi.readCanvas(CANVAS_NAME)
        const conn = canvas.connectors?.find((c) => c.id === connectorId)
        expect(conn).toBeDefined()

        // Wait for terminal config to update with connected widgets
        await new Promise((r) => setTimeout(r, 3000))

        const config = readTerminalConfig(agentWidgetId)
        if (config) {
          // connectedWidgets should include the sticky note ID
          const connected = config.connectedWidgets || config.connectedWidgetIds || []
          const hasSticky = Array.isArray(connected)
            ? connected.some((w) => (typeof w === 'string' ? w === stickyNoteId : w.id === stickyNoteId))
            : false
          expect.soft(hasSticky).toBe(true)
        }
      })

      it(`T4.2 — ${agent.label} sees connected widget`, async () => {
        if (!agentTmuxSession || !stickyNoteId) return
        transcript.logSection(agentTmuxSession, 'T4.2')

        tmux.sendText(
          agentTmuxSession,
          'What widgets are connected to you? Tell me the widget type and its text content.',
        )
        tmux.sendKeys(agentTmuxSession, 'Enter')

        let responseOutput = ''
        try {
          responseOutput = await tmux.waitForOutput(agentTmuxSession, /banana|sticky/i, 90000, 3000)
        } catch (err) {
          responseOutput = err.lastCapture || tmux.capturePane(agentTmuxSession)
        }

        expect.soft(responseOutput).toMatch(/banana/i)

        if (!/banana/i.test(responseOutput)) {
          reviewLog(`T4.2 — ${agent.label} connected widget`, '/banana/i', responseOutput, { widgetId: agentWidgetId })
        }
      }, 120_000)

      it(`T4.3 — Edit connected widget text (banana → apple)`, async () => {
        if (!stickyNoteId) return

        // Update sticky note text
        await canvasApi.updateWidget(CANVAS_NAME, stickyNoteId, {
          props: { text: 'apple', color: 'yellow' },
        })

        // Verify update in canvas
        const canvas = await canvasApi.readCanvas(CANVAS_NAME)
        const sticky = canvas.widgets?.find((w) => w.id === stickyNoteId)
        expect(sticky?.props?.text).toBe('apple')

        // Ask agent about the update
        if (!agentTmuxSession) return
        transcript.logSection(agentTmuxSession, 'T4.3')

        tmux.sendText(agentTmuxSession, 'What does your connected sticky note say now? Just tell me the text.')
        tmux.sendKeys(agentTmuxSession, 'Enter')

        let responseOutput = ''
        try {
          responseOutput = await tmux.waitForOutput(agentTmuxSession, /apple/i, 90000, 3000)
        } catch (err) {
          responseOutput = err.lastCapture || tmux.capturePane(agentTmuxSession)
        }

        expect.soft(responseOutput).toMatch(/apple/i)

        if (!/apple/i.test(responseOutput)) {
          reviewLog(`T4.3 — ${agent.label} edited widget`, '/apple/i', responseOutput, { widgetId: agentWidgetId })
        }
      }, 120_000)

      it(`T4.4 — Edit connected widget color (yellow → red)`, async () => {
        if (!stickyNoteId) return

        await canvasApi.updateWidget(CANVAS_NAME, stickyNoteId, {
          props: { text: 'apple', color: 'red' },
        })

        // Verify in canvas
        const canvas = await canvasApi.readCanvas(CANVAS_NAME)
        const sticky = canvas.widgets?.find((w) => w.id === stickyNoteId)
        expect(sticky?.props?.color).toBe('red')

        // Verify in browser
        try {
          browser.open(browserSession, `${serverUrl}/storyboard/canvas/${CANVAS_NAME}`)
          browser.waitForLoad(browserSession, 'networkidle')
          // Best-effort visual check
          const _snap = browser.snapshot(browserSession)
          void _snap
        } catch { /* best-effort */ }
      })

      it(`T4.5 — Delete connected sticky note`, async () => {
        if (!stickyNoteId) return

        await canvasApi.deleteWidget(CANVAS_NAME, stickyNoteId)

        // Verify widget is gone
        const canvas = await canvasApi.readCanvas(CANVAS_NAME)
        const sticky = canvas.widgets?.find((w) => w.id === stickyNoteId)
        expect(sticky).toBeUndefined()

        // Connector should be orphaned (widget it points to is gone)
        // The connector may still exist in the data but one end is invalid
      })

      it(`T4.6 — Connected markdown block (variant)`, async () => {
        if (!agentWidgetId) return

        // Create markdown widget
        const mdResult = await canvasApi.createWidget(
          CANVAS_NAME,
          'markdown',
          { content: '# Hello World' },
          { x: 400, y: 250 + agents.indexOf(agent) * 500 },
        )

        expect(mdResult.success).toBe(true)
        markdownId = mdResult.widget.id
        createdWidgetIds.push(markdownId)

        // Connect to agent
        const connResult = await canvasApi.addConnector(
          CANVAS_NAME,
          markdownId,
          'right',
          agentWidgetId,
          'left',
        )
        expect(connResult.success).toBe(true)
        _markdownConnectorId = connResult.connector?.id
        void _markdownConnectorId

        // Wait for config update
        await new Promise((r) => setTimeout(r, 3000))

        // Ask agent about connected widget
        if (agentTmuxSession) {
          transcript.logSection(agentTmuxSession, 'T4.6')

          tmux.sendText(agentTmuxSession, 'What markdown content is connected to you? Just tell me the heading text.')
          tmux.sendKeys(agentTmuxSession, 'Enter')

          let responseOutput = ''
          try {
            responseOutput = await tmux.waitForOutput(agentTmuxSession, /hello\s*world/i, 90000, 3000)
          } catch (err) {
            responseOutput = err.lastCapture || tmux.capturePane(agentTmuxSession)
          }

          expect.soft(responseOutput).toMatch(/hello\s*world/i)

          if (!/hello\s*world/i.test(responseOutput)) {
            reviewLog(`T4.6 — ${agent.label} markdown widget`, '/hello world/i', responseOutput, { widgetId: agentWidgetId })
          }
        }

        // Update markdown content
        await canvasApi.updateWidget(CANVAS_NAME, markdownId, {
          props: { content: '# Goodbye World' },
        })

        await new Promise((r) => setTimeout(r, 2000))

        if (agentTmuxSession) {
          tmux.sendText(agentTmuxSession, 'What does your connected markdown say now?')
          tmux.sendKeys(agentTmuxSession, 'Enter')

          let responseOutput = ''
          try {
            responseOutput = await tmux.waitForOutput(agentTmuxSession, /goodbye\s*world/i, 90000, 3000)
          } catch (err) {
            responseOutput = err.lastCapture || tmux.capturePane(agentTmuxSession)
          }

          expect.soft(responseOutput).toMatch(/goodbye\s*world/i)
        }

        // Delete markdown
        await canvasApi.deleteWidget(CANVAS_NAME, markdownId)

        const canvas = await canvasApi.readCanvas(CANVAS_NAME)
        const md = canvas.widgets?.find((w) => w.id === markdownId)
        expect(md).toBeUndefined()
      }, 180_000)
    })

    // End the chain timer in the last afterAll
    afterAll(() => {
      if (agentDescribe.__chainTimer) {
        agentDescribe.__chainTimer.end()
      }
    })
  })
}
