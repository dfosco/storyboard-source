import { renderHook } from '@testing-library/react'
import { useSceneData, useSceneLoading } from './useSceneData.js'
import { seedTestData, createWrapper, TEST_SCENES } from '../test-utils.js'

const sceneData = TEST_SCENES.default

beforeEach(() => {
  seedTestData()
})

describe('useSceneData', () => {
  it('returns entire scene object when no path given', () => {
    const { result } = renderHook(() => useSceneData(), {
      wrapper: createWrapper(sceneData),
    })
    expect(result.current).toEqual(sceneData)
  })

  it('returns nested value by dot-notation path', () => {
    const { result } = renderHook(() => useSceneData('user.name'), {
      wrapper: createWrapper(sceneData),
    })
    expect(result.current).toBe('Jane')
  })

  it('returns deep nested value', () => {
    const { result } = renderHook(() => useSceneData('user.profile.bio'), {
      wrapper: createWrapper(sceneData),
    })
    expect(result.current).toBe('Dev')
  })

  it('returns array by path', () => {
    const { result } = renderHook(() => useSceneData('projects'), {
      wrapper: createWrapper(sceneData),
    })
    expect(result.current).toEqual([
      { id: 1, name: 'alpha' },
      { id: 2, name: 'beta' },
    ])
  })

  it('returns array element by index path', () => {
    const { result } = renderHook(() => useSceneData('projects.0'), {
      wrapper: createWrapper(sceneData),
    })
    expect(result.current).toEqual({ id: 1, name: 'alpha' })
  })

  it('returns empty object and warns for missing path', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { result } = renderHook(() => useSceneData('nonexistent.path'), {
      wrapper: createWrapper(sceneData),
    })
    expect(result.current).toEqual({})
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('nonexistent.path')
    )
    spy.mockRestore()
  })

  it('throws when used outside StoryboardProvider', () => {
    expect(() => {
      renderHook(() => useSceneData())
    }).toThrow('useSceneData must be used within a <StoryboardProvider>')
  })

  it('returns hash override value when param matches path', () => {
    window.location.hash = '#user.name=Alice'
    const { result } = renderHook(() => useSceneData('user.name'), {
      wrapper: createWrapper(sceneData),
    })
    expect(result.current).toBe('Alice')
  })

  it('applies child overrides to arrays', () => {
    window.location.hash = '#projects.0.name=gamma'
    const { result } = renderHook(() => useSceneData('projects'), {
      wrapper: createWrapper(sceneData),
    })
    expect(result.current[0].name).toBe('gamma')
    expect(result.current[1].name).toBe('beta')
  })

  it('returns full scene with all overrides applied when no path', () => {
    window.location.hash = '#user.name=Alice'
    const { result } = renderHook(() => useSceneData(), {
      wrapper: createWrapper(sceneData),
    })
    expect(result.current.user.name).toBe('Alice')
    expect(result.current.settings.theme).toBe('dark')
  })
})

describe('useSceneLoading', () => {
  it('returns false when not loading', () => {
    const { result } = renderHook(() => useSceneLoading(), {
      wrapper: createWrapper(sceneData),
    })
    expect(result.current).toBe(false)
  })

  it('throws when used outside StoryboardProvider', () => {
    expect(() => {
      renderHook(() => useSceneLoading())
    }).toThrow('useSceneLoading must be used within a <StoryboardProvider>')
  })
})
