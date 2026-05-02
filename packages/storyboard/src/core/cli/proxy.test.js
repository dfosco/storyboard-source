import { describe, it, expect } from 'vitest'
import { findStaleRouteIndices } from './proxy.js'

describe('findStaleRouteIndices', () => {
  it('identifies stale non-@id routes matching the same host', () => {
    const routes = [
      { match: [{ host: ['storyboard.localhost'] }], terminal: true }, // index 0: stale
      { '@id': 'storyboard', match: [{ host: ['storyboard.localhost'] }] }, // index 1: ours
    ]
    const indices = findStaleRouteIndices(routes, 'storyboard', 'storyboard.localhost')
    expect(indices).toEqual([0])
  })

  it('preserves routes with a different @id for the same host', () => {
    const routes = [
      { '@id': 'other-app', match: [{ host: ['storyboard.localhost'] }] },
      { '@id': 'storyboard', match: [{ host: ['storyboard.localhost'] }] },
    ]
    const indices = findStaleRouteIndices(routes, 'storyboard', 'storyboard.localhost')
    expect(indices).toEqual([])
  })

  it('returns multiple stale indices in descending order', () => {
    const routes = [
      { match: [{ host: ['storyboard.localhost'] }] }, // index 0: stale
      { '@id': 'storyboard-core', match: [{ host: ['storyboard-core.localhost'] }] }, // index 1: different host
      { '@id': 'storyboard', match: [{ host: ['storyboard.localhost'] }] }, // index 2: ours
      { match: [{ host: ['storyboard.localhost'] }] }, // index 3: stale
    ]
    const indices = findStaleRouteIndices(routes, 'storyboard', 'storyboard.localhost')
    expect(indices).toEqual([3, 0]) // descending for safe deletion
  })

  it('ignores routes for a different host', () => {
    const routes = [
      { match: [{ host: ['other.localhost'] }] },
      { '@id': 'storyboard', match: [{ host: ['storyboard.localhost'] }] },
    ]
    const indices = findStaleRouteIndices(routes, 'storyboard', 'storyboard.localhost')
    expect(indices).toEqual([])
  })

  it('handles routes with no match field', () => {
    const routes = [
      { handle: [{ handler: 'reverse_proxy' }] }, // no match
      { '@id': 'storyboard', match: [{ host: ['storyboard.localhost'] }] },
    ]
    const indices = findStaleRouteIndices(routes, 'storyboard', 'storyboard.localhost')
    expect(indices).toEqual([])
  })

  it('returns empty array when no stale routes exist', () => {
    const routes = [
      { '@id': 'storyboard', match: [{ host: ['storyboard.localhost'] }] },
    ]
    const indices = findStaleRouteIndices(routes, 'storyboard', 'storyboard.localhost')
    expect(indices).toEqual([])
  })

  it('handles empty routes array', () => {
    expect(findStaleRouteIndices([], 'storyboard', 'storyboard.localhost')).toEqual([])
  })
})
