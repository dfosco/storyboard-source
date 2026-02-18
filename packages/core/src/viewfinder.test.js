import { init } from './loader.js'
import { hash, resolveSceneRoute } from './viewfinder.js'

const makeIndex = () => ({
  scenes: {
    default: { title: 'Default Scene' },
    Dashboard: { heading: 'Dashboard' },
    'custom-route': { route: 'Overview', title: 'Custom' },
    'absolute-route': { route: '/Forms', title: 'Absolute' },
    'no-route': { title: 'No route key' },
  },
  objects: {},
  records: {},
})

beforeEach(() => {
  init(makeIndex())
})

describe('hash', () => {
  it('returns a number', () => {
    expect(typeof hash('test')).toBe('number')
  })

  it('is deterministic', () => {
    expect(hash('hello')).toBe(hash('hello'))
  })

  it('produces different values for different strings', () => {
    expect(hash('foo')).not.toBe(hash('bar'))
  })

  it('returns non-negative values', () => {
    expect(hash('abc')).toBeGreaterThanOrEqual(0)
    expect(hash('')).toBeGreaterThanOrEqual(0)
    expect(hash('a very long string with lots of characters')).toBeGreaterThanOrEqual(0)
  })
})

describe('resolveSceneRoute', () => {
  const routes = ['Dashboard', 'Overview', 'Forms', 'Repositories']

  it('matches scene name to route (exact case)', () => {
    expect(resolveSceneRoute('Dashboard', routes)).toBe('/Dashboard?scene=Dashboard')
  })

  it('matches scene name to route (case-insensitive)', () => {
    expect(resolveSceneRoute('dashboard', routes)).toBe('/Dashboard?scene=dashboard')
  })

  it('uses route key from scene data when no route matches', () => {
    expect(resolveSceneRoute('custom-route', routes)).toBe('/Overview?scene=custom-route')
  })

  it('handles absolute route key (with leading slash)', () => {
    expect(resolveSceneRoute('absolute-route', routes)).toBe('/Forms?scene=absolute-route')
  })

  it('falls back to root when no match and no route key', () => {
    expect(resolveSceneRoute('no-route', routes)).toBe('/?scene=no-route')
  })

  it('falls back to root for default scene', () => {
    expect(resolveSceneRoute('default', routes)).toBe('/?scene=default')
  })

  it('falls back to root when scene does not exist', () => {
    expect(resolveSceneRoute('nonexistent', routes)).toBe('/?scene=nonexistent')
  })

  it('works with empty routes array', () => {
    expect(resolveSceneRoute('Dashboard', [])).toBe('/?scene=Dashboard')
  })

  it('works with no routes argument', () => {
    expect(resolveSceneRoute('custom-route')).toBe('/Overview?scene=custom-route')
  })

  it('encodes special characters in scene name', () => {
    init({
      scenes: { 'has spaces': { title: 'Spaces' } },
      objects: {},
      records: {},
    })
    expect(resolveSceneRoute('has spaces', [])).toBe('/?scene=has%20spaces')
  })
})
