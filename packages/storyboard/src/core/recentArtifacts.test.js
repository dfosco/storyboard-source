import { describe, it, expect, beforeEach } from 'vitest'
import { trackRecent, getRecent, clearRecent } from './recentArtifacts.js'

describe('recentArtifacts', () => {
  beforeEach(() => {
    clearRecent()
  })

  it('returns empty array when nothing tracked', () => {
    expect(getRecent()).toEqual([])
  })

  it('tracks a single entry', () => {
    trackRecent('prototype', 'my-proto', 'My Proto')
    const items = getRecent()
    expect(items).toHaveLength(1)
    expect(items[0]).toEqual({ type: 'prototype', key: 'my-proto', label: 'My Proto' })
  })

  it('puts newest entry first', () => {
    trackRecent('prototype', 'a', 'A')
    trackRecent('prototype', 'b', 'B')
    const items = getRecent()
    expect(items[0].key).toBe('b')
    expect(items[1].key).toBe('a')
  })

  it('deduplicates by type+key and moves to top', () => {
    trackRecent('prototype', 'a', 'A')
    trackRecent('prototype', 'b', 'B')
    trackRecent('prototype', 'a', 'A updated')
    const items = getRecent()
    expect(items).toHaveLength(2)
    expect(items[0]).toEqual({ type: 'prototype', key: 'a', label: 'A updated' })
    expect(items[1].key).toBe('b')
  })

  it('allows same key with different types', () => {
    trackRecent('prototype', 'foo', 'Foo Proto')
    trackRecent('canvas', 'foo', 'Foo Canvas')
    const items = getRecent()
    expect(items).toHaveLength(2)
  })

  it('limits to 10 items', () => {
    for (let i = 0; i < 15; i++) {
      trackRecent('prototype', `p${i}`, `Proto ${i}`)
    }
    expect(getRecent()).toHaveLength(10)
    // newest should be first
    expect(getRecent()[0].key).toBe('p14')
  })

  it('clears all entries', () => {
    trackRecent('prototype', 'a', 'A')
    trackRecent('canvas', 'b', 'B')
    clearRecent()
    expect(getRecent()).toEqual([])
  })

  it('ignores entries with missing type or key', () => {
    trackRecent('', 'a', 'A')
    trackRecent('prototype', '', 'B')
    expect(getRecent()).toEqual([])
  })

  it('falls back to key as label if label is empty', () => {
    trackRecent('prototype', 'my-proto', '')
    expect(getRecent()[0].label).toBe('my-proto')
  })
})
