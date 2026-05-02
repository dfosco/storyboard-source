import { renderHook, act } from '@testing-library/react'
import useUndoRedo from './useUndoRedo.js'

describe('useUndoRedo', () => {
  it('starts with canUndo and canRedo as false', () => {
    const { result } = renderHook(() => useUndoRedo())
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
  })

  it('can undo after a snapshot', () => {
    const { result } = renderHook(() => useUndoRedo())
    const widgets = [{ id: '1', type: 'sticky-note', props: { text: 'a' }, position: { x: 0, y: 0 } }]

    act(() => result.current.snapshot(widgets, 'add'))

    expect(result.current.canUndo).toBe(true)
    expect(result.current.canRedo).toBe(false)
  })

  it('undo returns the previous state and enables redo', () => {
    const { result } = renderHook(() => useUndoRedo())
    const before = [{ id: '1', props: { text: 'a' } }]
    const after = [{ id: '1', props: { text: 'b' } }]

    act(() => result.current.snapshot(before, 'edit', '1'))

    let restored
    act(() => { restored = result.current.undo(after) })

    expect(restored).toEqual(before)
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(true)
  })

  it('redo returns the next state', () => {
    const { result } = renderHook(() => useUndoRedo())
    const before = [{ id: '1', props: { text: 'a' } }]
    const after = [{ id: '1', props: { text: 'b' } }]

    act(() => result.current.snapshot(before, 'edit', '1'))
    act(() => { result.current.undo(after) })

    let redone
    act(() => { redone = result.current.redo(before) })

    expect(redone).toEqual(after)
    expect(result.current.canUndo).toBe(true)
    expect(result.current.canRedo).toBe(false)
  })

  it('new mutation after undo clears the redo chain', () => {
    const { result } = renderHook(() => useUndoRedo())
    const s0 = [{ id: '1' }]
    const s1 = [{ id: '1' }, { id: '2' }]
    const s2 = [{ id: '1' }, { id: '3' }] // eslint-disable-line no-unused-vars

    act(() => result.current.snapshot(s0, 'add'))
    act(() => result.current.undo(s1))
    expect(result.current.canRedo).toBe(true)

    // New mutation breaks redo
    act(() => result.current.snapshot(s0, 'add'))
    expect(result.current.canRedo).toBe(false)
    expect(result.current.canUndo).toBe(true)
  })

  it('supports multi-step undo-redo-undo chains', () => {
    const { result } = renderHook(() => useUndoRedo())
    const s0 = [{ id: '1' }]
    const s1 = [{ id: '1' }, { id: '2' }]
    const s2 = [{ id: '1' }, { id: '2' }, { id: '3' }]
    const s3 = [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }]

    // Build history: s0 → s1 → s2 → s3
    act(() => result.current.snapshot(s0, 'add'))
    act(() => result.current.snapshot(s1, 'add'))
    act(() => result.current.snapshot(s2, 'add'))

    // present = s3, past = [s0, s1, s2]
    // Undo to s2
    let r
    act(() => { r = result.current.undo(s3) })
    expect(r).toEqual(s2)

    // Undo to s1
    act(() => { r = result.current.undo(s2) })
    expect(r).toEqual(s1)

    // Redo to s2
    act(() => { r = result.current.redo(s1) })
    expect(r).toEqual(s2)

    // Redo to s3
    act(() => { r = result.current.redo(s2) })
    expect(r).toEqual(s3)

    // Undo to s2 again
    act(() => { r = result.current.undo(s3) })
    expect(r).toEqual(s2)

    // Undo to s1
    act(() => { r = result.current.undo(s2) })
    expect(r).toEqual(s1)

    // Undo to s0
    act(() => { r = result.current.undo(s1) })
    expect(r).toEqual(s0)

    // Can't undo further
    expect(result.current.canUndo).toBe(false)
    act(() => { r = result.current.undo(s0) })
    expect(r).toBeNull()
  })

  it('coalesces edits to the same widget within timeout', () => {
    const { result } = renderHook(() => useUndoRedo())
    const s0 = [{ id: '1', props: { text: '' } }]

    // First edit — creates snapshot
    act(() => result.current.snapshot(s0, 'edit', '1'))
    expect(result.current.canUndo).toBe(true)

    // Second edit to same widget within 2s — coalesced, no new snapshot
    act(() => result.current.snapshot(s0, 'edit', '1'))
    // Still only one entry in past
    let r
    act(() => { r = result.current.undo([{ id: '1', props: { text: 'abc' } }]) })
    expect(r).toEqual(s0)
    // No more undo after that
    expect(result.current.canUndo).toBe(false)
  })

  it('does NOT coalesce edits to different widgets', () => {
    const { result } = renderHook(() => useUndoRedo())
    const s0 = [{ id: '1' }, { id: '2' }]
    const s1 = [{ id: '1', props: { text: 'a' } }, { id: '2' }]

    act(() => result.current.snapshot(s0, 'edit', '1'))
    act(() => result.current.snapshot(s1, 'edit', '2'))

    // Two entries in past
    expect(result.current.canUndo).toBe(true)
    act(() => { result.current.undo([]) })
    expect(result.current.canUndo).toBe(true)
    act(() => { result.current.undo([]) })
    expect(result.current.canUndo).toBe(false)
  })

  it('does NOT coalesce edit after a different action type', () => {
    const { result } = renderHook(() => useUndoRedo())
    const s0 = [{ id: '1' }]
    const s1 = [{ id: '1' }, { id: '2' }]

    act(() => result.current.snapshot(s0, 'edit', '1'))
    act(() => result.current.snapshot(s1, 'add'))
    act(() => result.current.snapshot(s1, 'edit', '1'))

    // Three entries in past (edit + add + edit — not coalesced because add broke the sequence)
    act(() => { result.current.undo([]) })
    act(() => { result.current.undo([]) })
    act(() => { result.current.undo([]) })
    expect(result.current.canUndo).toBe(false)
  })

  it('reset clears all history', () => {
    const { result } = renderHook(() => useUndoRedo())
    act(() => result.current.snapshot([{ id: '1' }], 'add'))
    act(() => result.current.snapshot([{ id: '1' }, { id: '2' }], 'add'))
    expect(result.current.canUndo).toBe(true)

    act(() => result.current.reset())
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
  })

  it('undo returns null when history is empty', () => {
    const { result } = renderHook(() => useUndoRedo())
    let r
    act(() => { r = result.current.undo([]) })
    expect(r).toBeNull()
  })

  it('redo returns null when future is empty', () => {
    const { result } = renderHook(() => useUndoRedo())
    let r
    act(() => { r = result.current.redo([]) })
    expect(r).toBeNull()
  })

  it('snapshots are deep clones (mutations do not leak)', () => {
    const { result } = renderHook(() => useUndoRedo())
    const widgets = [{ id: '1', props: { text: 'original' } }]

    act(() => result.current.snapshot(widgets, 'add'))

    // Mutate the original array
    widgets[0].props.text = 'mutated'

    let restored
    act(() => { restored = result.current.undo(widgets) })
    expect(restored[0].props.text).toBe('original')
  })

  it('caps history at 100 entries', () => {
    const { result } = renderHook(() => useUndoRedo())

    for (let i = 0; i < 110; i++) {
      act(() => result.current.snapshot([{ id: String(i) }], 'add'))
    }

    // Should be capped at 100 — undo 100 times, then can't undo further
    let count = 0
    let r = true
    while (r !== null) {
      act(() => { r = result.current.undo([]) })
      if (r !== null) count++
    }
    expect(count).toBe(100)
  })

  it('snapshots null widgets as empty array (first widget on new canvas)', () => {
    const { result } = renderHook(() => useUndoRedo())
    act(() => result.current.snapshot(null, 'add'))
    expect(result.current.canUndo).toBe(true)

    let restored
    act(() => { restored = result.current.undo([{ id: '1' }]) })
    expect(restored).toEqual([])
  })
})
