import { initCommentsConfig, getCommentsConfig, isCommentsEnabled } from './config.js'

describe('initCommentsConfig', () => {
  beforeEach(() => {
    // Reset config state
    initCommentsConfig(null)
  })

  it('initializes config from valid rawConfig', () => {
    initCommentsConfig({
      comments: {
        repo: { owner: 'dfosco', name: 'storyboard' },
        discussions: { category: 'Comments' },
      },
    })
    const config = getCommentsConfig()
    expect(config).toEqual({
      repo: { owner: 'dfosco', name: 'storyboard' },
      discussions: { category: 'Comments' },
    })
  })

  it('uses default category when not provided', () => {
    initCommentsConfig({
      comments: {
        repo: { owner: 'owner', name: 'repo' },
      },
    })
    const config = getCommentsConfig()
    expect(config.discussions.category).toBe('Storyboard Comments')
  })

  it('sets config to null when rawConfig is null', () => {
    initCommentsConfig(null)
    expect(getCommentsConfig()).toBeNull()
  })

  it('sets config to null when rawConfig has no comments key', () => {
    initCommentsConfig({ other: 'stuff' })
    expect(getCommentsConfig()).toBeNull()
  })

  it('handles missing repo fields gracefully', () => {
    initCommentsConfig({ comments: {} })
    const config = getCommentsConfig()
    expect(config.repo.owner).toBe('')
    expect(config.repo.name).toBe('')
  })
})

describe('isCommentsEnabled', () => {
  beforeEach(() => {
    initCommentsConfig(null)
  })

  it('returns false when config is null', () => {
    expect(isCommentsEnabled()).toBe(false)
  })

  it('returns false when owner is empty', () => {
    initCommentsConfig({ comments: { repo: { owner: '', name: 'repo' } } })
    expect(isCommentsEnabled()).toBe(false)
  })

  it('returns false when name is empty', () => {
    initCommentsConfig({ comments: { repo: { owner: 'owner', name: '' } } })
    expect(isCommentsEnabled()).toBe(false)
  })

  it('returns true when both owner and name are set', () => {
    initCommentsConfig({
      comments: { repo: { owner: 'dfosco', name: 'storyboard' } },
    })
    expect(isCommentsEnabled()).toBe(true)
  })
})
