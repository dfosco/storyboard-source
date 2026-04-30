import { createContext, useContext, useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'

/**
 * WebGL Context Pool — manages live WebGL slots for terminal widgets.
 *
 * Browsers cap WebGL contexts at ~8-16. This pool ensures only a subset
 * of terminal widgets hold live ghostty-web renderers at any time.
 * Offscreen terminals release their context and show a frozen snapshot.
 *
 * Architecture:
 * - Lease-based: widgets register and receive live/frozen status
 * - Priority: PINNED > VISIBLE > NEAR_VIEWPORT > OFFSCREEN
 * - Hysteresis: 3s grace before evicting recently-visible terminals
 * - Generation tokens prevent stale async opens after eviction
 */

// Priority levels (higher = more important to keep live)
export const Priority = {
  OFFSCREEN: 0,
  NEAR_VIEWPORT: 1,
  VISIBLE: 2,
  PINNED: 3, // expanded, focused, or actively interacting
}

const DEFAULT_MAX_LIVE = 6
const HYSTERESIS_MS = 3000

// ── Pool Engine (framework-agnostic) ─────────────────────────────────

class ContextPool {
  constructor(maxLive = DEFAULT_MAX_LIVE) {
    this._maxLive = maxLive
    /** @type {Map<string, { priority: number, generation: number, live: boolean, lastVisible: number }>} */
    this._slots = new Map()
    this._listeners = new Set()
    this._hysteresisTimers = new Map()
    // Monotonic version counter — bumped on every state change so
    // useSyncExternalStore detects updates via a new snapshot value.
    this._version = 0
  }

  /** Subscribe to pool state changes. Returns unsubscribe fn. */
  subscribe(listener) {
    this._listeners.add(listener)
    return () => this._listeners.delete(listener)
  }

  _notify() {
    this._version++
    for (const fn of this._listeners) fn()
  }

  /** Register a widget. Returns its initial generation. */
  register(widgetId) {
    if (this._slots.has(widgetId)) return this._slots.get(widgetId).generation
    this._slots.set(widgetId, {
      priority: Priority.OFFSCREEN,
      generation: 0,
      live: false,
      lastVisible: 0,
    })
    this._recompute()
    return 0
  }

  /** Unregister a widget (on unmount). */
  unregister(widgetId) {
    this._slots.delete(widgetId)
    const timer = this._hysteresisTimers.get(widgetId)
    if (timer) { clearTimeout(timer); this._hysteresisTimers.delete(widgetId) }
    this._recompute()
  }

  /** Update a widget's priority. Triggers recomputation. */
  setPriority(widgetId, priority) {
    const slot = this._slots.get(widgetId)
    if (!slot) return
    const prev = slot.priority
    slot.priority = priority

    // Track when widget was last visible/pinned for hysteresis
    if (priority >= Priority.VISIBLE) {
      slot.lastVisible = Date.now()
    }

    // Immediate recompute when priority increases or widget is pinned
    if (priority > prev || priority === Priority.PINNED) {
      this._recompute()
      return
    }

    // When priority drops (e.g. scrolled offscreen), use hysteresis
    if (priority < prev && prev >= Priority.VISIBLE) {
      const existing = this._hysteresisTimers.get(widgetId)
      if (existing) clearTimeout(existing)
      this._hysteresisTimers.set(widgetId, setTimeout(() => {
        this._hysteresisTimers.delete(widgetId)
        this._recompute()
      }, HYSTERESIS_MS))
      return
    }

    this._recompute()
  }

  /** Get current state for a widget. */
  getSlot(widgetId) {
    return this._slots.get(widgetId) || null
  }

  /**
   * Recompute which widgets should be live.
   * Sorts by priority (desc), then by lastVisible (desc).
   * Top N get live status; rest are frozen.
   */
  _recompute() {
    const entries = [...this._slots.entries()]

    // Sort: pinned first, then by priority desc, then by recency
    entries.sort(([, a], [, b]) => {
      if (a.priority !== b.priority) return b.priority - a.priority
      return b.lastVisible - a.lastVisible
    })

    let liveCount = 0
    const changes = []

    for (const [id, slot] of entries) {
      // Pinned terminals always get a slot (they bypass the cap)
      const shouldBeLive = slot.priority === Priority.PINNED || liveCount < this._maxLive
      if (shouldBeLive) liveCount++

      if (slot.live !== shouldBeLive) {
        changes.push({ id, slot, shouldBeLive })
      }
    }

    if (changes.length === 0) return

    for (const { slot, shouldBeLive } of changes) {
      slot.live = shouldBeLive
      if (!shouldBeLive) {
        // Bump generation so stale async opens abort
        slot.generation++
      }
    }

    this._notify()
  }
}

// ── React Context ────────────────────────────────────────────────────

const WebGLPoolContext = createContext(null)

/**
 * Provider that creates and owns the context pool.
 * Place this around the canvas widget tree in CanvasPage.
 *
 * @param {{ maxLive?: number, children: React.ReactNode }} props
 */
export function WebGLContextPoolProvider({ maxLive = DEFAULT_MAX_LIVE, children }) {
  // useMemo is correct here: the pool is a stable singleton for this provider's lifetime.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pool = useMemo(() => new ContextPool(maxLive), [])
  return (
    <WebGLPoolContext.Provider value={pool}>
      {children}
    </WebGLPoolContext.Provider>
  )
}

/**
 * Hook that manages a terminal widget's WebGL slot lifecycle.
 *
 * Returns:
 * - `isLive`: whether this widget should create a live ghostty terminal
 * - `generation`: counter that increments on each live→frozen transition;
 *   use as an effect dep to detect when to re-create the terminal
 * - `setPriority(p)`: update this widget's priority
 *
 * @param {string} widgetId
 * @returns {{ isLive: boolean, generation: number, setPriority: (p: number) => void }}
 */
export function useWebGLSlot(widgetId) {
  const pool = useContext(WebGLPoolContext)

  // Register on mount, unregister on unmount
  useEffect(() => {
    if (!pool) return
    pool.register(widgetId)
    return () => pool.unregister(widgetId)
  }, [pool, widgetId])

  // Subscribe to pool state for reactivity.
  // getSnapshot returns the pool's version counter — a primitive that changes
  // on every state mutation, satisfying useSyncExternalStore's identity check.
  const subscribe = useCallback(
    (cb) => pool ? pool.subscribe(cb) : () => {},
    [pool],
  )
  const getSnapshot = useCallback(() => {
    if (!pool) return -1
    return pool._version
  }, [pool])

  // This triggers re-render whenever the pool version changes
  useSyncExternalStore(subscribe, getSnapshot)

  // Read the actual slot state (after subscription ensures freshness)
  const slot = pool?.getSlot(widgetId)

  const setPriority = useCallback(
    (p) => pool?.setPriority(widgetId, p),
    [pool, widgetId],
  )

  // When there's no pool provider (e.g. standalone usage), always be live
  if (!pool || !slot) {
    return { isLive: true, generation: 0, setPriority: () => {} }
  }

  return {
    isLive: slot.live,
    generation: slot.generation,
    setPriority,
  }
}

/**
 * Hook for CanvasPage to batch-update visibility for all terminal widgets.
 * Call this with the current viewport rect and widget positions.
 *
 * @returns {(viewportRect: {x:number,y:number,w:number,h:number}, widgets: Array<{id:string,type:string,position:{x:number,y:number},props?:object}>, selectedIds: Set<string>, expandedId: string|null) => void}
 */
export function usePoolVisibilityUpdater() {
  const pool = useContext(WebGLPoolContext)

  return useCallback((viewportRect, widgets, selectedIds, expandedId) => {
    if (!pool) return

    const NEAR_MARGIN = 400 // canvas-space pixels for "near viewport" zone

    const terminalTypes = new Set(['terminal', 'agent', 'prompt'])

    for (const w of widgets) {
      if (!terminalTypes.has(w.type)) continue

      // Determine priority
      if (w.id === expandedId) {
        pool.setPriority(w.id, Priority.PINNED)
        continue
      }

      if (selectedIds?.has(w.id)) {
        pool.setPriority(w.id, Priority.PINNED)
        continue
      }

      const wx = w.position?.x ?? 0
      const wy = w.position?.y ?? 0
      const ww = w.props?.width ?? 800
      const wh = w.props?.height ?? 450

      // Check overlap with viewport
      const visible = rectsOverlap(
        viewportRect.x, viewportRect.y, viewportRect.w, viewportRect.h,
        wx, wy, ww, wh,
      )

      if (visible) {
        pool.setPriority(w.id, Priority.VISIBLE)
        continue
      }

      // Check overlap with expanded viewport (near margin)
      const near = rectsOverlap(
        viewportRect.x - NEAR_MARGIN,
        viewportRect.y - NEAR_MARGIN,
        viewportRect.w + NEAR_MARGIN * 2,
        viewportRect.h + NEAR_MARGIN * 2,
        wx, wy, ww, wh,
      )

      pool.setPriority(w.id, near ? Priority.NEAR_VIEWPORT : Priority.OFFSCREEN)
    }
  }, [pool])
}

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
}
