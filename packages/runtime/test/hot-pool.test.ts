import { describe, expect, it, vi } from 'vitest'
import { HotPool } from '../src/pool/index.js'
import { PortPool } from '../src/devserver/port-pool.js'
import { Port } from '../src/schema/index.js'

/**
 * Stub PortPool that hands out monotonically increasing ports without
 * actually probing the OS. Lets us test HotPool semantics in isolation
 * from `net.createServer` flakiness.
 */
function makeStubPool(opts: { startAt?: number; max?: number } = {}) {
  let next = opts.startAt ?? 1240
  const max = opts.max ?? 1245
  const released: number[] = []
  const acquired: number[] = []
  const stub = {
    async acquire() {
      if (next > max) throw new Error('exhausted')
      const p = Port.parse(next++)
      acquired.push(Number(p))
      return p
    },
    release(p: Port | number) {
      released.push(Number(p))
    },
    isLeased() { return false },
    size() { return acquired.length - released.length },
  } as unknown as PortPool
  return { stub, released, acquired }
}

async function tick(ms = 0) { return new Promise(r => setTimeout(r, ms)) }

describe('HotPool', () => {
  it('warms up to warmTarget in the background', async () => {
    const { stub, acquired } = makeStubPool()
    const pool = new HotPool({ ports: stub, warmTarget: 2 })
    pool.warmInBackground()
    await tick(5)
    expect(pool.status().warm).toBe(2)
    expect(acquired).toEqual([1240, 1241])
  })

  it('first acquire is O(1) (returns warm port immediately)', async () => {
    const { stub } = makeStubPool()
    const pool = new HotPool({ ports: stub, warmTarget: 1 })
    pool.warmInBackground()
    await tick(5)
    const p = await pool.acquirePort()
    expect(Number(p)).toBe(1240) // got the pre-warmed port (1240), not a freshly probed one
  })

  it('refills after acquire', async () => {
    const { stub } = makeStubPool()
    const pool = new HotPool({ ports: stub, warmTarget: 2 })
    pool.warmInBackground()
    await tick(5)
    expect(pool.status().warm).toBe(2)

    await pool.acquirePort()
    await tick(5)
    expect(pool.status().warm).toBe(2) // refilled in the background
    expect(pool.status().bound).toBe(1)
  })

  it('falls back to synchronous acquire when warm ring is empty', async () => {
    const { stub } = makeStubPool()
    const pool = new HotPool({ ports: stub, warmTarget: 1 })
    // Don't warm — call acquire on a cold pool.
    const p = await pool.acquirePort()
    expect(typeof p).toBe('number')
    expect(pool.status().bound).toBe(1)
  })

  it('release decrements bound count and triggers refill', async () => {
    const { stub, released } = makeStubPool()
    const pool = new HotPool({ ports: stub, warmTarget: 1 })
    pool.warmInBackground()
    await tick(5)
    const p = await pool.acquirePort()
    expect(pool.status().bound).toBe(1)
    pool.release(p)
    expect(pool.status().bound).toBe(0)
    expect(released).toEqual([Number(p)])
  })

  it('drain returns warm ports to the underlying pool', async () => {
    const { stub, released } = makeStubPool()
    const pool = new HotPool({ ports: stub, warmTarget: 3 })
    pool.warmInBackground()
    await tick(5)
    expect(pool.status().warm).toBe(3)
    pool.drain()
    expect(pool.status().warm).toBe(0)
    expect(released.sort()).toEqual([1240, 1241, 1242])
  })

  it('caps capacity at max(warmTarget, opts.capacity)', () => {
    const { stub } = makeStubPool()
    const pool = new HotPool({ ports: stub, warmTarget: 5, capacity: 2 })
    expect(pool.capacity).toBe(5) // warmTarget wins over the lower cap
  })

  it('survives port-pool exhaustion without throwing during refill', async () => {
    const { stub } = makeStubPool({ startAt: 1240, max: 1241 })
    const pool = new HotPool({ ports: stub, warmTarget: 5 })
    pool.warmInBackground()
    await tick(20)
    // Two warm successfully, then exhaustion stops the loop quietly.
    expect(pool.status().warm).toBe(2)
  })
})

describe('HotPool integrated with real PortPool', () => {
  it('acquires real OS-level ports', async () => {
    const real = new PortPool()
    const pool = new HotPool({ ports: real, warmTarget: 1 })
    pool.warmInBackground()
    await tick(50)
    const p = await pool.acquirePort()
    expect(Number(p)).toBeGreaterThanOrEqual(1240)
    expect(Number(p)).toBeLessThanOrEqual(1399)
    pool.release(p)
  })
})
