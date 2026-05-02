import { describe, it, expect } from 'vitest'
import { getConfig, getConfigDefaults, configDefaults, builtinPasteRules } from './configSchema.js'

describe('configSchema', () => {
  describe('getConfigDefaults', () => {
    it('returns a full defaults object', () => {
      const d = getConfigDefaults()
      expect(d.canvas).toBeDefined()
      expect(d.commandPalette).toBeDefined()
      expect(d.repository).toEqual({ owner: '', name: '' })
    })

    it('returns a fresh copy each time', () => {
      const a = getConfigDefaults()
      const b = getConfigDefaults()
      expect(a).not.toBe(b)
      expect(a).toEqual(b)
    })
  })

  describe('getConfig', () => {
    it('returns full defaults when called with empty object', () => {
      const c = getConfig({})
      expect(c.canvas.pasteRules).toEqual(builtinPasteRules)
      expect(c.canvas.github.embedBehavior).toBe('link-preview')
      expect(c.canvas.github.ghGuard).toBe('copy')
      expect(c.commandPalette.providers).toEqual(['prototypes', 'flows', 'canvases', 'pages'])
      expect(c.commandPalette.ranking).toBe('frecency')
      expect(c.customerMode.enabled).toBe(false)
      expect(c.customerMode.hideChrome).toBe(false)
      expect(c.customerMode.hideHomepage).toBe(false)
      expect(c.customerMode.protoHomepage).toBe('')
    })

    it('returns full defaults when called with undefined', () => {
      const c = getConfig()
      expect(c.canvas).toBeDefined()
      expect(c.commandPalette).toBeDefined()
    })

    it('merges user config over defaults', () => {
      const c = getConfig({
        repository: { owner: 'test', name: 'repo' },
        canvas: { github: { ghGuard: 'link' } },
      })
      expect(c.repository).toEqual({ owner: 'test', name: 'repo' })
      expect(c.canvas.github.ghGuard).toBe('link')
      // Other defaults preserved
      expect(c.canvas.github.embedBehavior).toBe('link-preview')
      expect(c.canvas.pasteRules).toEqual(builtinPasteRules)
    })

    it('replaces arrays instead of concatenating', () => {
      const customRules = [{ id: 'custom', match: 'https://example.com', widget: 'link-preview' }]
      const c = getConfig({ canvas: { pasteRules: customRules } })
      expect(c.canvas.pasteRules).toEqual(customRules)
      expect(c.canvas.pasteRules).not.toContainEqual(builtinPasteRules[0])
    })

    it('preserves existing keys not in defaults', () => {
      const c = getConfig({ devDomain: 'my-project', featureFlags: { 'show-banner': true } })
      expect(c.devDomain).toBe('my-project')
      expect(c.featureFlags['show-banner']).toBe(true)
    })

    it('does not mutate configDefaults', () => {
      const before = JSON.stringify(configDefaults)
      getConfig({ canvas: { github: { ghGuard: 'off' } } })
      expect(JSON.stringify(configDefaults)).toBe(before)
    })
  })
})
