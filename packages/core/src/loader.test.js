import { init, loadScene, listScenes, sceneExists, loadRecord, findRecord, deepMerge } from './loader.js'

const makeIndex = () => ({
  scenes: {
    default: {
      title: 'Default Scene',
      user: { $ref: 'jane-doe' },
    },
    Dashboard: {
      $global: ['navigation'],
      heading: 'Dashboard',
      nav: 'scene-wins',
    },
    empty: {},
    'with-nested-ref': {
      team: {
        lead: { $ref: 'jane-doe' },
      },
    },
    'circular-a': {
      thing: { $ref: 'circular-obj-a' },
    },
  },
  objects: {
    'jane-doe': {
      name: 'Jane Doe',
      role: 'admin',
    },
    navigation: {
      nav: 'global-nav',
      links: ['home', 'about'],
    },
    'circular-obj-a': {
      nested: { $ref: 'circular-obj-b' },
    },
    'circular-obj-b': {
      nested: { $ref: 'circular-obj-a' },
    },
  },
  records: {
    posts: [
      { id: 'post-1', title: 'First Post' },
      { id: 'post-2', title: 'Second Post' },
    ],
    'bad-record': { notAnArray: true },
  },
})

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  init(makeIndex())
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('init', () => {
  it('throws on null', () => {
    expect(() => init(null)).toThrow()
  })

  it('throws on undefined', () => {
    expect(() => init(undefined)).toThrow()
  })

  it('throws on non-object', () => {
    expect(() => init('string')).toThrow()
  })

  it('stores data so loadScene works', () => {
    init(makeIndex())
    const scene = loadScene('default')
    expect(scene.title).toBe('Default Scene')
  })

  it('handles missing properties gracefully', () => {
    init({})
    expect(sceneExists('anything')).toBe(false)
  })
})

describe('loadScene', () => {
  it('loads scene by name', () => {
    const scene = loadScene('empty')
    expect(scene).toEqual({})
  })

  it('resolves $ref to objects', () => {
    const scene = loadScene('default')
    expect(scene.user).toEqual({ name: 'Jane Doe', role: 'admin' })
  })

  it('resolves nested $ref', () => {
    const scene = loadScene('with-nested-ref')
    expect(scene.team.lead).toEqual({ name: 'Jane Doe', role: 'admin' })
  })

  it('resolves $global and merges into root, scene wins conflicts', () => {
    const scene = loadScene('Dashboard')
    expect(scene.links).toEqual(['home', 'about'])
    expect(scene.heading).toBe('Dashboard')
    // scene value should win over global value
    expect(scene.nav).toBe('scene-wins')
  })

  it('throws for missing scene', () => {
    expect(() => loadScene('nonexistent')).toThrow()
  })

  it('case-insensitive lookup', () => {
    const scene = loadScene('dashboard')
    expect(scene.heading).toBe('Dashboard')
  })

  it('returns deep clone (mutations do not affect index)', () => {
    const scene1 = loadScene('empty')
    scene1.injected = true
    const scene2 = loadScene('empty')
    expect(scene2.injected).toBeUndefined()
  })

  it('default param loads "default" scene', () => {
    const scene = loadScene()
    expect(scene.title).toBe('Default Scene')
  })

  it('detects circular $ref and throws', () => {
    expect(() => loadScene('circular-a')).toThrow(/circular/i)
  })
})

describe('sceneExists', () => {
  it('returns true for existing scene', () => {
    expect(sceneExists('default')).toBe(true)
  })

  it('returns false for missing scene', () => {
    expect(sceneExists('nope')).toBe(false)
  })

  it('is case-insensitive', () => {
    expect(sceneExists('dashboard')).toBe(true)
    expect(sceneExists('DASHBOARD')).toBe(true)
  })
})

describe('listScenes', () => {
  it('returns all scene names', () => {
    const names = listScenes()
    expect(names).toContain('default')
    expect(names).toContain('Dashboard')
    expect(names).toContain('empty')
  })

  it('returns an array', () => {
    expect(Array.isArray(listScenes())).toBe(true)
  })

  it('returns empty array when no scenes registered', () => {
    init({ scenes: {}, objects: {}, records: {} })
    expect(listScenes()).toEqual([])
  })
})

describe('loadRecord', () => {
  it('loads record array by name', () => {
    const records = loadRecord('posts')
    expect(records).toHaveLength(2)
    expect(records[0].id).toBe('post-1')
  })

  it('throws for missing record', () => {
    expect(() => loadRecord('nonexistent')).toThrow()
  })

  it('throws for non-array record', () => {
    expect(() => loadRecord('bad-record')).toThrow(/array/i)
  })

  it('returns deep clone', () => {
    const records1 = loadRecord('posts')
    records1[0].title = 'Modified'
    const records2 = loadRecord('posts')
    expect(records2[0].title).toBe('First Post')
  })
})

describe('findRecord', () => {
  it('finds entry by id', () => {
    const entry = findRecord('posts', 'post-2')
    expect(entry).toEqual({ id: 'post-2', title: 'Second Post' })
  })

  it('returns null for missing id', () => {
    const entry = findRecord('posts', 'nonexistent')
    expect(entry).toBeNull()
  })

  it('throws for missing record', () => {
    expect(() => findRecord('nonexistent', 'any')).toThrow()
  })
})

describe('deepMerge', () => {
  it('merges nested objects', () => {
    const target = { a: { b: 1, c: 2 } }
    const source = { a: { d: 3 } }
    const result = deepMerge(target, source)
    expect(result).toEqual({ a: { b: 1, c: 2, d: 3 } })
  })

  it('source wins conflicts', () => {
    const target = { a: 1 }
    const source = { a: 2 }
    expect(deepMerge(target, source)).toEqual({ a: 2 })
  })

  it('arrays are replaced not concatenated', () => {
    const target = { items: [1, 2, 3] }
    const source = { items: [4, 5] }
    expect(deepMerge(target, source)).toEqual({ items: [4, 5] })
  })

  it('handles null/undefined values', () => {
    const target = { a: 1, b: 2 }
    const source = { a: null, c: undefined }
    const result = deepMerge(target, source)
    expect(result.a).toBeNull()
    expect(result.c).toBeUndefined()
  })
})
