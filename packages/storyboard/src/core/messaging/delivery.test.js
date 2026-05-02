import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { initBus, resetBus, publish } from './bus.js'
import { JsonlAdapter } from './storage/jsonl-adapter.js'
import {
  initDeliveryBridge,
  bindWidget,
  unbindWidget,
  rebindWidget,
  terminalChannel,
  isBound,
  getBindings,
  resetDeliveryBridge,
} from './delivery.js'

// Mock child_process for tmux calls
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}))

describe('Delivery Bridge', () => {
  let tmpDir
  let adapter
  let execSyncMock

  beforeEach(async () => {
    resetDeliveryBridge()
    resetBus()
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'delivery-test-'))
    adapter = new JsonlAdapter({ root: tmpDir })
    await adapter.init()
    initBus(adapter)
    initDeliveryBridge({ root: tmpDir })

    // Get mock reference
    const cp = await import('node:child_process')
    execSyncMock = cp.execSync
    execSyncMock.mockReset()
  })

  afterEach(() => {
    resetDeliveryBridge()
    resetBus()
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  describe('terminalChannel', () => {
    it('formats channel name correctly', () => {
      expect(terminalChannel('main', 'canvas-1', 'widget-a')).toBe('terminal:main:canvas-1:widget-a')
    })
  })

  describe('bindWidget', () => {
    it('registers widget as bound', async () => {
      expect(isBound('w1')).toBe(false)

      await bindWidget({
        widgetId: 'w1',
        tmuxName: 'session:0.0',
        branch: 'main',
        canvasId: 'canvas-1',
      })

      expect(isBound('w1')).toBe(true)
    })

    it('returns channel name', async () => {
      const result = await bindWidget({
        widgetId: 'w2',
        tmuxName: 'session:0.0',
        branch: 'main',
        canvasId: 'canvas-1',
      })

      expect(result.channel).toBe('terminal:main:canvas-1:w2')
    })

    it('delivers live messages via tmux', async () => {
      await bindWidget({
        widgetId: 'w3',
        tmuxName: 'my-sess:0.0',
        branch: 'main',
        canvasId: 'c1',
      })

      // Publish a message to the widget's channel
      const channel = terminalChannel('main', 'c1', 'w3')
      await publish(channel, {
        type: 'message:request',
        senderId: 'other-agent',
        senderName: 'Bob',
        body: 'Hello w3!',
      })

      // Give async subscriber time to fire
      await new Promise(r => setTimeout(r, 50))

      expect(execSyncMock).toHaveBeenCalled()
      const firstCall = execSyncMock.mock.calls[0][0]
      expect(firstCall).toContain('tmux send-keys')
      expect(firstCall).toContain('my-sess:0.0')
    })

    it('does not deliver messages from self', async () => {
      await bindWidget({
        widgetId: 'w4',
        tmuxName: 'sess:0.0',
        branch: 'main',
        canvasId: 'c1',
      })

      const channel = terminalChannel('main', 'c1', 'w4')
      await publish(channel, {
        type: 'message:request',
        senderId: 'w4', // same as bound widget
        senderName: 'Self',
        body: 'Echo',
      })

      await new Promise(r => setTimeout(r, 50))
      expect(execSyncMock).not.toHaveBeenCalled()
    })

    it('only delivers message:request events', async () => {
      await bindWidget({
        widgetId: 'w5',
        tmuxName: 'sess:0.0',
        branch: 'main',
        canvasId: 'c1',
      })

      const channel = terminalChannel('main', 'c1', 'w5')
      await publish(channel, {
        type: 'message:delivered',
        senderId: 'other',
        senderName: 'Ack',
        body: 'delivered',
      })

      await new Promise(r => setTimeout(r, 50))
      expect(execSyncMock).not.toHaveBeenCalled()
    })

    it('unbinds previous binding on re-bind (hot-pool)', async () => {
      await bindWidget({
        widgetId: 'w6',
        tmuxName: 'sess-old:0.0',
        branch: 'main',
        canvasId: 'c1',
      })

      await bindWidget({
        widgetId: 'w6',
        tmuxName: 'sess-new:0.0',
        branch: 'main',
        canvasId: 'c1',
      })

      const binds = getBindings()
      expect(binds).toHaveLength(1)
      expect(binds[0].tmuxName).toBe('sess-new:0.0')
    })
  })

  describe('unbindWidget', () => {
    it('removes the binding', async () => {
      await bindWidget({
        widgetId: 'w7',
        tmuxName: 'sess:0.0',
        branch: 'main',
        canvasId: 'c1',
      })

      expect(isBound('w7')).toBe(true)
      unbindWidget('w7')
      expect(isBound('w7')).toBe(false)
    })

    it('is safe to call for unbound widget', () => {
      expect(() => unbindWidget('nonexistent')).not.toThrow()
    })
  })

  describe('rebindWidget', () => {
    it('updates tmux target without re-subscribing', async () => {
      await bindWidget({
        widgetId: 'w8',
        tmuxName: 'old-sess:0.0',
        branch: 'main',
        canvasId: 'c1',
      })

      rebindWidget('w8', 'new-sess:1.0')

      const binds = getBindings()
      expect(binds[0].tmuxName).toBe('new-sess:1.0')
    })
  })

  describe('durable cursors', () => {
    it('persists cursor to disk after delivery', async () => {
      await bindWidget({
        widgetId: 'cursor-test',
        tmuxName: 'sess:0.0',
        branch: 'main',
        canvasId: 'c1',
      })

      const channel = terminalChannel('main', 'c1', 'cursor-test')
      await publish(channel, {
        type: 'message:request',
        senderId: 'sender-x',
        senderName: 'Sender',
        body: 'Test message',
      })

      await new Promise(r => setTimeout(r, 100))

      const cursorFile = path.join(tmpDir, '.storyboard/messages/cursors/cursor-test.json')
      expect(fs.existsSync(cursorFile)).toBe(true)

      const cursorData = JSON.parse(fs.readFileSync(cursorFile, 'utf8'))
      expect(cursorData.lastDeliveredEventId).toBeDefined()
      expect(cursorData.updatedAt).toBeDefined()
    })

    it('backfills missed messages on bind', async () => {
      const channel = terminalChannel('main', 'c1', 'backfill-test')

      // Publish messages BEFORE binding
      await publish(channel, {
        type: 'message:request',
        senderId: 'sender-y',
        senderName: 'Y',
        body: 'Missed message 1',
      })
      await publish(channel, {
        type: 'message:request',
        senderId: 'sender-y',
        senderName: 'Y',
        body: 'Missed message 2',
      })

      // Now bind — should backfill
      await bindWidget({
        widgetId: 'backfill-test',
        tmuxName: 'sess:0.0',
        branch: 'main',
        canvasId: 'c1',
      })

      // Both messages should have been delivered
      expect(execSyncMock.mock.calls.length).toBeGreaterThanOrEqual(4) // 2 send-keys + 2 Enter
    })
  })

  describe('getBindings', () => {
    it('returns all current bindings', async () => {
      await bindWidget({ widgetId: 'b1', tmuxName: 's1:0.0', branch: 'main', canvasId: 'c1' })
      await bindWidget({ widgetId: 'b2', tmuxName: 's2:0.0', branch: 'main', canvasId: 'c1' })

      const binds = getBindings()
      expect(binds).toHaveLength(2)
      expect(binds.map(b => b.widgetId).sort()).toEqual(['b1', 'b2'])
    })
  })
})
