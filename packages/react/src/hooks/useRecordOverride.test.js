import { renderHook, act } from '@testing-library/react'
import { seedTestData, createWrapper, TEST_SCENES } from '../../test-utils.js'
import { useRecordOverride } from './useRecordOverride.js'

beforeEach(() => {
  seedTestData()
})

const wrapper = createWrapper(TEST_SCENES.default)

describe('useRecordOverride', () => {
  it('returns [value, setValue, clearValue]', () => {
    const { result } = renderHook(
      () => useRecordOverride('posts', 'post-1', 'title'),
      { wrapper },
    )
    expect(result.current).toHaveLength(3)
    expect(typeof result.current[1]).toBe('function')
    expect(typeof result.current[2]).toBe('function')
  })

  it('builds correct override path (record.posts.post-1.title)', () => {
    const { result } = renderHook(
      () => useRecordOverride('posts', 'post-1', 'title'),
      { wrapper },
    )
    // scene data has record.posts.post-1.title = 'Original Title'
    expect(result.current[0]).toBe('Original Title')
  })

  it('returns undefined when path does not exist in scene data', () => {
    const { result } = renderHook(
      () => useRecordOverride('posts', 'post-99', 'title'),
      { wrapper },
    )
    expect(result.current[0]).toBeUndefined()
  })

  it('setValue writes to hash at the correct path', () => {
    const { result } = renderHook(
      () => useRecordOverride('posts', 'post-1', 'title'),
      { wrapper },
    )

    act(() => {
      result.current[1]('New Title')
    })

    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    expect(params.get('record.posts.post-1.title')).toBe('New Title')
  })
})
