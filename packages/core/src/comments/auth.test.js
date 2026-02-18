import { getToken, setToken, clearToken, getCachedUser, isAuthenticated } from './auth.js'

describe('auth token management', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when no token is stored', () => {
    expect(getToken()).toBeNull()
  })

  it('stores and retrieves a token', () => {
    setToken('ghp_test123')
    expect(getToken()).toBe('ghp_test123')
  })

  it('clears token and user', () => {
    setToken('ghp_test123')
    localStorage.setItem('sb-comments-user', JSON.stringify({ login: 'test' }))
    clearToken()
    expect(getToken()).toBeNull()
    expect(getCachedUser()).toBeNull()
  })
})

describe('getCachedUser', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when no user is cached', () => {
    expect(getCachedUser()).toBeNull()
  })

  it('returns cached user info', () => {
    const user = { login: 'dfosco', avatarUrl: 'https://example.com/avatar.png' }
    localStorage.setItem('sb-comments-user', JSON.stringify(user))
    expect(getCachedUser()).toEqual(user)
  })

  it('returns null on invalid JSON', () => {
    localStorage.setItem('sb-comments-user', 'not json')
    expect(getCachedUser()).toBeNull()
  })
})

describe('isAuthenticated', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns false when no token', () => {
    expect(isAuthenticated()).toBe(false)
  })

  it('returns true when token exists', () => {
    setToken('ghp_abc')
    expect(isAuthenticated()).toBe(true)
  })
})
