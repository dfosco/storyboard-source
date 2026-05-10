import { describe, it, expect } from 'vitest'
import {
  buildOrthogonalPolyline,
  polylineToRoundedPath,
  buildOrthogonalPath,
  buildConnectorPath,
} from './connectorGeometry.js'

describe('buildOrthogonalPolyline', () => {
  it('opposite anchors (right ↔ left) → Z shape splitting at midX', () => {
    const pts = buildOrthogonalPolyline(
      { x: 0, y: 0 }, 'right',
      { x: 200, y: 100 }, 'left',
    )
    expect(pts).toEqual([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 200, y: 100 },
    ])
  })

  it('opposite anchors (top ↔ bottom) → Z shape splitting at midY', () => {
    const pts = buildOrthogonalPolyline(
      { x: 0, y: 0 }, 'bottom',
      { x: 100, y: 200 }, 'top',
    )
    expect(pts).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 100 },
      { x: 100, y: 100 },
      { x: 100, y: 200 },
    ])
  })

  it('perpendicular anchors (right + top) → single L corner', () => {
    const pts = buildOrthogonalPolyline(
      { x: 0, y: 50 }, 'right',
      { x: 200, y: 0 }, 'top',
    )
    expect(pts).toEqual([
      { x: 0, y: 50 },
      { x: 200, y: 50 },
      { x: 200, y: 0 },
    ])
  })

  it('perpendicular anchors (bottom + left) → single L corner', () => {
    const pts = buildOrthogonalPolyline(
      { x: 50, y: 0 }, 'bottom',
      { x: 200, y: 100 }, 'left',
    )
    expect(pts).toEqual([
      { x: 50, y: 0 },
      { x: 50, y: 100 },
      { x: 200, y: 100 },
    ])
  })

  it('same-side anchors (both right) → step out + cross + step in', () => {
    const pts = buildOrthogonalPolyline(
      { x: 100, y: 0 }, 'right',
      { x: 50, y: 100 }, 'right',
    )
    // step out should clear the rightmost point
    expect(pts.length).toBe(4)
    expect(pts[0]).toEqual({ x: 100, y: 0 })
    expect(pts[3]).toEqual({ x: 50, y: 100 })
    expect(pts[1].x).toBeGreaterThan(100)
    expect(pts[1].y).toBe(0)
    expect(pts[2].x).toBe(pts[1].x)
    expect(pts[2].y).toBe(100)
  })

  it('same-side anchors (both left) → step out to the left', () => {
    const pts = buildOrthogonalPolyline(
      { x: 100, y: 0 }, 'left',
      { x: 200, y: 100 }, 'left',
    )
    expect(pts[1].x).toBeLessThan(100)
  })

  it('identical points → degenerate polyline still well-formed', () => {
    const pts = buildOrthogonalPolyline(
      { x: 50, y: 50 }, 'right',
      { x: 50, y: 50 }, 'left',
    )
    expect(pts[0]).toEqual({ x: 50, y: 50 })
    expect(pts[pts.length - 1]).toEqual({ x: 50, y: 50 })
  })
})

describe('polylineToRoundedPath', () => {
  it('emits move + line for two-point polyline', () => {
    const d = polylineToRoundedPath([{ x: 0, y: 0 }, { x: 100, y: 0 }])
    expect(d).toBe('M 0 0 L 100 0')
  })

  it('inserts quadratic fillets at interior corners', () => {
    const d = polylineToRoundedPath([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ], 12)
    expect(d).toMatch(/^M 0 0 L /)
    expect(d).toContain('Q 100 0')
    expect(d).toMatch(/L 100 100$/)
  })
})

describe('buildOrthogonalPath', () => {
  it('returns a non-empty SVG path string', () => {
    const d = buildOrthogonalPath({ x: 0, y: 0 }, 'right', { x: 200, y: 100 }, 'left')
    expect(d.startsWith('M ')).toBe(true)
    expect(d.length).toBeGreaterThan(10)
  })
})

describe('buildConnectorPath dispatcher', () => {
  it('routes orthogonal style to buildOrthogonalPath', () => {
    const d = buildConnectorPath('orthogonal', { x: 0, y: 0 }, 'right', { x: 200, y: 100 }, 'left')
    expect(d).toContain('Q')
  })

  it('routes fluid style to cubic Bézier path', () => {
    const d = buildConnectorPath('fluid', { x: 0, y: 0 }, 'right', { x: 200, y: 100 }, 'left')
    expect(d).toMatch(/^M 0 0 C /)
  })

  it('forwards freeEnd option in fluid mode', () => {
    const a = buildConnectorPath('fluid', { x: 0, y: 0 }, 'right', { x: 50, y: 50 }, 'left', { freeEnd: true })
    const b = buildConnectorPath('fluid', { x: 0, y: 0 }, 'right', { x: 50, y: 50 }, 'left', { freeEnd: false })
    expect(a).not.toBe(b)
  })
})
