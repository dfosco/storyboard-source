/**
 * Session transcript recording for integration tests.
 *
 * Wraps tmux interactions to produce a full stdin/stdout log per session.
 * Transcripts are written to test-results/transcripts/ on every run.
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const transcripts = new Map()

const TRANSCRIPTS_DIR = join(process.cwd(), 'test-results', 'transcripts')

function ensureDir() {
  mkdirSync(TRANSCRIPTS_DIR, { recursive: true })
}

function elapsed(startTime) {
  const ms = Date.now() - startTime
  const secs = Math.floor(ms / 1000)
  const mins = Math.floor(secs / 60)
  const s = secs % 60
  const tenths = Math.floor((ms % 1000) / 100)
  if (mins > 0) return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}.${tenths}`
  return `${String(s).padStart(2, '0')}.${tenths}`
}

/** Initialize a transcript for a session. */
export function createTranscript(sessionName, metadata = {}) {
  const transcript = {
    sessionName,
    metadata,
    startTime: Date.now(),
    lines: [],
  }
  transcript.lines.push(`=== Session: ${sessionName} ===`)
  transcript.lines.push(`Started: ${new Date().toISOString()}`)
  if (metadata.widgetId) transcript.lines.push(`Widget ID: ${metadata.widgetId}`)
  if (metadata.canvasName) transcript.lines.push(`Canvas: ${metadata.canvasName}`)
  if (metadata.agentId) transcript.lines.push(`Agent: ${metadata.agentId}`)
  transcript.lines.push('')
  transcripts.set(sessionName, transcript)
  return transcript
}

/** Log a test section header. */
export function logSection(sessionName, testId) {
  const t = transcripts.get(sessionName)
  if (!t) return
  t.lines.push(`--- [${testId}] ---`)
}

/** Log stdin (input sent via sendKeys). */
export function logStdin(sessionName, input, _testId = '') {
  void _testId
  const t = transcripts.get(sessionName)
  if (!t) return
  const ts = elapsed(t.startTime)
  const prefix = `[${ts}] [stdin] `
  // Split multi-line input
  const lines = String(input).split('\n')
  for (const line of lines) {
    t.lines.push(`${prefix}${line}`)
  }
}

/** Log stdout (captured pane output). Only logs the diff from previous capture. */
export function logStdout(sessionName, fullOutput, _testId = '') {
  void _testId
  const t = transcripts.get(sessionName)
  if (!t) return
  const ts = elapsed(t.startTime)
  const prefix = `[${ts}] [stdout] `

  // Compute diff from last stdout
  const prevLen = t._lastStdoutLen || 0
  const lines = String(fullOutput).split('\n')
  const newLines = lines.slice(prevLen)
  t._lastStdoutLen = lines.length

  for (const line of newLines) {
    // Skip empty trailing lines
    if (line.trim() === '' && newLines.indexOf(line) === newLines.length - 1) continue
    t.lines.push(`${prefix}${line}`)
  }
}

/** Log a non-IO event (session start, resize, etc.). */
export function logEvent(sessionName, event, _testId = '') {
  void _testId
  const t = transcripts.get(sessionName)
  if (!t) return
  const ts = elapsed(t.startTime)
  t.lines.push(`[${ts}] [event] ${event}`)
}

/** Get the in-memory transcript text. */
export function getTranscript(sessionName) {
  const t = transcripts.get(sessionName)
  if (!t) return ''
  return t.lines.join('\n')
}

/** Flush a single transcript to disk. */
export function flush(sessionName) {
  const t = transcripts.get(sessionName)
  if (!t) return null

  const totalMs = Date.now() - t.startTime
  t.lines.push('')
  t.lines.push(`=== Session ended: ${new Date().toISOString()} (total: ${(totalMs / 1000).toFixed(1)}s) ===`)

  ensureDir()
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const filename = `${sessionName}-${ts}.log`
  const filepath = join(TRANSCRIPTS_DIR, filename)
  writeFileSync(filepath, t.lines.join('\n') + '\n')
  console.log(`[transcript] Written: ${filepath}`)
  return filepath
}

/** Flush all open transcripts. Call in afterAll. */
export function flushAll() {
  const paths = []
  for (const sessionName of transcripts.keys()) {
    const p = flush(sessionName)
    if (p) paths.push(p)
  }
  transcripts.clear()
  return paths
}
