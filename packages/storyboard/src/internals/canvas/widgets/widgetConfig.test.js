import { describe, expect, it } from 'vitest'
import { isResizable, getFeatures, getWidgetMeta } from './widgetConfig.js'

describe('isResizable', () => {
  // Vitest runs in dev mode by default (import.meta.env.PROD = false)
  // In dev mode, all resize-enabled widgets are resizable
  it('returns true for resize-enabled widgets in dev mode', () => {
    expect(isResizable('sticky-note')).toBe(true)
    expect(isResizable('prototype')).toBe(true)
    expect(isResizable('figma-embed')).toBe(true)
    expect(isResizable('image')).toBe(true)
    expect(isResizable('component')).toBe(true)
  })

  it('returns false for link-preview (resize disabled)', () => {
    expect(isResizable('link-preview')).toBe(false)
  })

  it('returns true for markdown (resize enabled, dev only)', () => {
    expect(isResizable('markdown')).toBe(true)
  })

  it('returns false for unknown widget types', () => {
    expect(isResizable('nonexistent')).toBe(false)
  })
})

describe('getFeatures', () => {
  it('returns features array for known widget types', () => {
    const features = getFeatures('sticky-note')
    expect(Array.isArray(features)).toBe(true)
    expect(features.length).toBeGreaterThan(0)
  })

  it('returns empty array for unknown widget types', () => {
    expect(getFeatures('nonexistent')).toEqual([])
  })

  it('returns only prod features when isLocalDev is false', () => {
    const features = getFeatures('figma-embed', { isLocalDev: false })
    expect(features.length).toBeGreaterThan(0)
    expect(features.every(f => f.prod === true)).toBe(true)
  })

  it('returns all features when isLocalDev is true (default)', () => {
    const allFeatures = getFeatures('figma-embed')
    const prodFeatures = getFeatures('figma-embed', { isLocalDev: false })
    expect(allFeatures.length).toBeGreaterThan(prodFeatures.length)
  })

  it('includes menu-only prod features when isLocalDev is false', () => {
    const features = getFeatures('figma-embed', { isLocalDev: false })
    const menuFeature = features.find(f => f.menu)
    expect(menuFeature).toBeDefined()
    expect(menuFeature.prod).toBe(true)
  })
})

describe('getWidgetMeta', () => {
  it('returns label and icon for known types', () => {
    const meta = getWidgetMeta('sticky-note')
    expect(meta).toEqual({ label: 'Sticky Note', icon: '📝' })
  })

  it('returns null for unknown types', () => {
    expect(getWidgetMeta('nonexistent')).toBeNull()
  })
})
