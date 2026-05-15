import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  writeSessionCaptureSettings,
  withSettingsArg,
  buildResumeStartupCommand,
  watchSessionIdFile,
  captureFilePath,
  buildSessionCaptureHookCommand,
  readCapturedSessionId,
} from './agent-session.js'

let root
beforeEach(() => { root = mkdtempSync(join(tmpdir(), 'sb-agent-session-')) })
afterEach(() => { try { rmSync(root, { recursive: true, force: true }) } catch { /* empty */ } })

describe('agent-session', () => {
  describe('writeSessionCaptureSettings', () => {
    it('returns null when sessionIdEnv is missing', () => {
      const result = writeSessionCaptureSettings({ root, widgetKey: 'abc', agentCfg: {} })
      expect(result).toBeNull()
    })

    it('writes a SessionStart hook settings.json referencing the env var and capture file', () => {
      const result = writeSessionCaptureSettings({
        root,
        widgetKey: 'abc1234567890abc',
        agentCfg: { sessionIdEnv: 'COPILOT_AGENT_SESSION_ID' },
      })
      expect(result).not.toBeNull()
      expect(result.captureFile).toContain('abc1234567890abc.session-id')
      expect(result.settingsFile).toContain('abc1234567890abc.settings.json')
      const parsed = JSON.parse(readFileSync(result.settingsFile, 'utf8'))
      expect(parsed.hooks.SessionStart).toHaveLength(1)
      const hook = parsed.hooks.SessionStart[0]
      expect(hook.type).toBe('command')
      expect(hook.command).toContain('${COPILOT_AGENT_SESSION_ID}')
      expect(hook.command).toContain('session_id')
      expect(hook.command).toContain(result.captureFile)
    })

    it('clears any stale capture file from a previous run', () => {
      const widgetKey = 'staleabcd1234abcd'
      const cap = captureFilePath(root, widgetKey)
      writeFileSync(cap, 'old-session-id')
      writeSessionCaptureSettings({ root, widgetKey, agentCfg: { sessionIdEnv: 'X' } })
      expect(existsSync(cap)).toBe(false)
    })
  })

  describe('withSettingsArg', () => {
    it('appends quoted --settings to the command', () => {
      const out = withSettingsArg('copilot --agent terminal-agent', '/tmp/with space.json')
      expect(out).toBe('copilot --agent terminal-agent --settings "/tmp/with space.json"')
    })
    it('returns the original command if no settings file given', () => {
      expect(withSettingsArg('copilot', null)).toBe('copilot')
    })
  })

  describe('buildResumeStartupCommand', () => {
    it('wraps the command with sh -c fallback using --resume {id} by default', () => {
      const out = buildResumeStartupCommand({
        startupCommand: 'copilot --agent terminal-agent',
        sessionId: '0c63bf16',
        agentCfg: { sessionIdEnv: 'X' },
      })
      expect(out.startsWith("sh -c '")).toBe(true)
      expect(out).toContain('copilot --resume 0c63bf16 --agent terminal-agent')
      expect(out).toContain('|| copilot --agent terminal-agent')
    })

    it('honors a custom resumeArgsTemplate', () => {
      const out = buildResumeStartupCommand({
        startupCommand: 'mycli run',
        sessionId: 'abc',
        agentCfg: { resumeArgsTemplate: '--continue={id}' },
      })
      expect(out).toContain('mycli --continue=abc run')
    })

    it('returns the original command when sessionId is missing', () => {
      const out = buildResumeStartupCommand({
        startupCommand: 'copilot',
        sessionId: null,
        agentCfg: {},
      })
      expect(out).toBe('copilot')
    })
  })

  describe('watchSessionIdFile', () => {
    it('fires onCapture once the file appears with a non-empty value', async () => {
      const cap = captureFilePath(root, 'watchkey')
      let captured = null
      const stop = watchSessionIdFile(cap, (id) => { captured = id }, { pollMs: 30, timeoutMs: 5000 })
      await new Promise((r) => setTimeout(r, 60))
      writeFileSync(cap, '  session-xyz  \n')
      // Wait for poll
      await new Promise((r) => setTimeout(r, 200))
      expect(captured).toBe('session-xyz')
      stop()
    })
  })

  describe('captureSessionFromProcess', () => {
    it('removed: capture is hook-based, not process-based', () => {
      // Process-env capture proved unreliable for tmux-spawned processes
      // on macOS (sandboxed). The SessionStart hook attached via --settings
      // is now the sole capture mechanism — see hot-pool.js#warmAgent and
      // terminal-server.js cold path.
      expect(true).toBe(true)
    })
  })

  describe('buildSessionCaptureHookCommand + readCapturedSessionId', () => {
    it('produces a hook command that writes the env var into the capture file', () => {
      const cap = captureFilePath(root, 'cmdkey')
      const cmd = buildSessionCaptureHookCommand(cap, 'COPILOT_AGENT_SESSION_ID')
      expect(cmd).toContain('${COPILOT_AGENT_SESSION_ID}')
      expect(cmd).toContain(cap)
      // Falls back to JSON stdin parsing
      expect(cmd).toContain('session_id')
    })

    it('reads the captured id back when the file exists', () => {
      const cap = captureFilePath(root, 'readkey')
      writeFileSync(cap, '  abc-123\n')
      expect(readCapturedSessionId(cap)).toBe('abc-123')
    })

    it('returns null when the capture file is missing or empty', () => {
      const cap = captureFilePath(root, 'missingkey')
      expect(readCapturedSessionId(cap)).toBeNull()
      writeFileSync(cap, '')
      expect(readCapturedSessionId(cap)).toBeNull()
    })
  })
})
