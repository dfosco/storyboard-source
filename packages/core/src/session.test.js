import { getParam, setParam, getAllParams, removeParam } from './session.js'

describe('getParam', () => {
  it('returns null when hash is empty', () => {
    window.location.hash = ''
    expect(getParam('key')).toBeNull()
  })

  it('returns value for existing param', () => {
    window.location.hash = 'foo=bar'
    expect(getParam('foo')).toBe('bar')
  })

  it('returns null for missing param', () => {
    window.location.hash = 'foo=bar'
    expect(getParam('missing')).toBeNull()
  })

  it('handles URL-encoded values', () => {
    window.location.hash = 'name=hello%20world'
    expect(getParam('name')).toBe('hello world')
  })
})

describe('setParam', () => {
  it('sets a new param in hash', () => {
    window.location.hash = ''
    setParam('key', 'value')
    expect(getParam('key')).toBe('value')
  })

  it('updates existing param', () => {
    window.location.hash = 'key=old'
    setParam('key', 'new')
    expect(getParam('key')).toBe('new')
  })

  it('preserves other params', () => {
    window.location.hash = 'a=1&b=2'
    setParam('c', '3')
    expect(getParam('a')).toBe('1')
    expect(getParam('b')).toBe('2')
    expect(getParam('c')).toBe('3')
  })

  it('converts value to string', () => {
    window.location.hash = ''
    setParam('num', 42)
    expect(getParam('num')).toBe('42')
  })
})

describe('getAllParams', () => {
  it('returns empty object for empty hash', () => {
    window.location.hash = ''
    expect(getAllParams()).toEqual({})
  })

  it('returns all params', () => {
    window.location.hash = 'a=1&b=2'
    expect(getAllParams()).toEqual({ a: '1', b: '2' })
  })

  it('handles multiple params', () => {
    window.location.hash = 'x=hello&y=world&z=test'
    const params = getAllParams()
    expect(Object.keys(params)).toHaveLength(3)
    expect(params).toEqual({ x: 'hello', y: 'world', z: 'test' })
  })
})

describe('removeParam', () => {
  it('removes existing param', () => {
    window.location.hash = 'a=1&b=2'
    removeParam('a')
    expect(getParam('a')).toBeNull()
  })

  it('preserves other params', () => {
    window.location.hash = 'a=1&b=2&c=3'
    removeParam('b')
    expect(getParam('a')).toBe('1')
    expect(getParam('c')).toBe('3')
  })

  it('no-ops for missing param', () => {
    window.location.hash = 'a=1'
    removeParam('nonexistent')
    expect(getParam('a')).toBe('1')
  })
})
