import { PortPool } from '../devserver/port-pool.js'
import { Port } from '../schema/index.js'

/**
 * HotPool — pre-allocates ports so `acquire()` doesn't pay the
 * OS-level free-port probe latency on every call.
 *
 * **What this is.** A ring of warm `Port` leases, refilled in the background.
 * The first N acquires after process start are O(1) instead of doing the
 * sequential probe-and-bind dance through 1240–1399.
 *
 * **What this is NOT.** A pool of pre-spawned Vite *processes*. Vite cannot
 * re-bind to a different project root without restart, so a "warm Vite"
 * would have to be killed and respawned on acquire — net negative. We
 * reserve ports only; process spawn still happens at acquire time.
 *
 * Configurable via the `HotPoolOptions`:
 *   warmTarget — how many ports to keep pre-allocated (default 1)
 *   capacity   — hard cap (default 4) — beyond this we stop warming
 */

export interface HotPoolOptions {
  ports?: PortPool
  warmTarget?: number
  capacity?: number
}

interface PoolEntry {
  port: Port
  warmedAt: number
}

export class HotPool {
  private readonly ports: PortPool
  readonly warmTarget: number
  readonly capacity: number
  private readonly warm: PoolEntry[] = []
  private warming = false

  /** Counts of devservers currently bound to ports issued by this pool. */
  private boundCount = 0

  constructor(opts: HotPoolOptions = {}) {
    this.ports = opts.ports ?? new PortPool()
    this.warmTarget = Math.max(0, opts.warmTarget ?? 1)
    this.capacity = Math.max(this.warmTarget, opts.capacity ?? 4)
  }

  /** Kick the background refill loop. Safe to call repeatedly. */
  warmInBackground(): void {
    if (this.warming) return
    this.warming = true
    void this.refill().finally(() => { this.warming = false })
  }

  /**
   * Hand out a warm port if available; otherwise allocate one synchronously.
   * Either way, kicks the background refill so the next caller is also fast.
   */
  async acquirePort(): Promise<Port> {
    let port: Port
    const head = this.warm.shift()
    if (head) {
      port = head.port
    } else {
      port = await this.ports.acquire()
    }
    this.boundCount += 1
    this.warmInBackground()
    return port
  }

  /** Return a port to the underlying PortPool. Decrements bound count. */
  release(port: Port): void {
    this.ports.release(port)
    if (this.boundCount > 0) this.boundCount -= 1
  }

  /** Snapshot for the /pool/status endpoint. */
  status(): { warm: number; bound: number; capacity: number } {
    return { warm: this.warm.length, bound: this.boundCount, capacity: this.capacity }
  }

  /** Return all warm ports to the pool (used on shutdown). */
  drain(): void {
    while (this.warm.length > 0) {
      const e = this.warm.shift()
      if (e) this.ports.release(e.port)
    }
  }

  private async refill(): Promise<void> {
    while (this.warm.length < this.warmTarget) {
      try {
        const port = await this.ports.acquire()
        this.warm.push({ port, warmedAt: Date.now() })
      } catch {
        // Port pool exhausted — stop warming, leave existing entries.
        return
      }
    }
  }
}
