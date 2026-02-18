import { renderHook } from '@testing-library/react'
import { useScene } from './useScene.js'
import { seedTestData, createWrapper, TEST_SCENES } from '../test-utils.js'

const sceneData = TEST_SCENES.default

beforeEach(() => {
  seedTestData()
})

describe('useScene', () => {
  it('returns { sceneName, switchScene }', () => {
    const { result } = renderHook(() => useScene(), {
      wrapper: createWrapper(sceneData),
    })
    expect(result.current).toHaveProperty('sceneName')
    expect(result.current).toHaveProperty('switchScene')
  })

  it('sceneName matches the value from context', () => {
    const { result } = renderHook(() => useScene(), {
      wrapper: createWrapper(sceneData, 'other'),
    })
    expect(result.current.sceneName).toBe('other')
  })

  it('switchScene is a function', () => {
    const { result } = renderHook(() => useScene(), {
      wrapper: createWrapper(sceneData),
    })
    expect(typeof result.current.switchScene).toBe('function')
  })

  it('throws when used outside StoryboardProvider', () => {
    expect(() => {
      renderHook(() => useScene())
    }).toThrow('useScene must be used within a <StoryboardProvider>')
  })
})
