import { createServer } from 'node:net'
import { DEVSERVER_PORT_MAX, DEVSERVER_PORT_MIN } from '../server/constants.js'
import { Port } from '../schema/index.js'

/**
 * PortPool — leases TCP ports from the runtime's reserved range.
 *
 * The runtime is the sole authority for port allocation. Vite child processes
 * never pick their own port; they're told which port to bind to. This is the
 * structural fix for hypothesis H4 (independent per-repo port registries with
 * no cross-repo awareness): leases live in this single in-memory pool, and
 * collisions are impossible because the pool refuses to hand out a port
 * that's already leased.
 */

export class PortExhaustedError extends Error {
  constructor() {
    super(`No free ports in range ${DEVSERVER_PORT_MIN}-${DEVSERVER_PORT_MAX}`)
    this.name = 'PortExhaustedError'
  }
}

export class PortPool {
  private readonly leased = new Set<number>()

  async acquire(): Promise<Port> {
    for (let p = DEVSERVER_PORT_MIN; p <= DEVSERVER_PORT_MAX; p++) {
      if (this.leased.has(p)) continue
      if (await isPortFree(p)) {
        this.leased.add(p)
        return Port.parse(p)
      }
    }
    throw new PortExhaustedError()
  }

  release(port: Port | number): void {
    this.leased.delete(Number(port))
  }

  isLeased(port: Port | number): boolean {
    return this.leased.has(Number(port))
  }

  size(): number {
    return this.leased.size
  }
}

function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = createServer()
    probe.once('error', () => resolve(false))
    probe.once('listening', () => {
      probe.close(() => resolve(true))
    })
    probe.listen(port, '127.0.0.1')
  })
}
