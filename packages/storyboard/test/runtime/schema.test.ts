import { describe, expect, it } from 'vitest'
import {
  ALLOWED_TRANSITIONS,
  assertTransition,
  DevDomain,
  DevServerSlot,
  IllegalTransitionError,
  Port,
  WorktreeName,
  slotKey,
} from '../../src/runtime/schema/index.js'

describe('DevDomain', () => {
  it('rejects empty / uppercase / leading digit', () => {
    expect(DevDomain.safeParse('').success).toBe(false)
    expect(DevDomain.safeParse('Storyboard').success).toBe(false)
    expect(DevDomain.safeParse('1storyboard').success).toBe(false)
  })
  it('accepts kebab-case lower-alpha-leading', () => {
    expect(DevDomain.parse('storyboard-core')).toBe('storyboard-core')
  })
})

describe('WorktreeName', () => {
  it('allows version-style names', () => {
    expect(WorktreeName.parse('0.5.0--runtime')).toBe('0.5.0--runtime')
  })
  it('rejects slashes and spaces', () => {
    expect(WorktreeName.safeParse('foo/bar').success).toBe(false)
    expect(WorktreeName.safeParse('foo bar').success).toBe(false)
  })
})

describe('Port', () => {
  it('rejects out-of-range ports', () => {
    expect(Port.safeParse(0).success).toBe(false)
    expect(Port.safeParse(70000).success).toBe(false)
  })
  it('accepts 4321', () => {
    expect(Port.parse(4321)).toBe(4321)
  })
})

describe('slotKey', () => {
  it('formats as ${devDomain}::${worktree}', () => {
    const slot = DevServerSlot.parse({ devDomain: 'storyboard', worktree: '0.5.0' })
    expect(slotKey(slot)).toBe('storyboard::0.5.0')
  })
})

describe('FSM transitions', () => {
  it('lists exhaustive transitions per status', () => {
    expect(Object.keys(ALLOWED_TRANSITIONS).sort()).toEqual(
      ['ready', 'spawning', 'stopped'],
    )
  })
  it('allows spawning → ready → stopped', () => {
    expect(() => assertTransition('spawning', 'ready')).not.toThrow()
    expect(() => assertTransition('ready', 'stopped')).not.toThrow()
    expect(() => assertTransition('spawning', 'stopped')).not.toThrow()
  })
  it('throws IllegalTransitionError on bad transition', () => {
    expect(() => assertTransition('stopped', 'ready')).toThrowError(IllegalTransitionError)
    expect(() => assertTransition('ready', 'spawning')).toThrowError(IllegalTransitionError)
  })
})
