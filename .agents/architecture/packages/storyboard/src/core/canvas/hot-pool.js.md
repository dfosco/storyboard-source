# `packages/storyboard/src/core/canvas/hot-pool.js`

<!--
source: packages/storyboard/src/core/canvas/hot-pool.js
category: storyboard
importance: high
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/core/canvas/hot-pool.js`](./hot-pool.js.md) is the pre-warming system for canvas terminals and agents. Instead of starting tmux, shells, and agent CLIs only when a widget is opened, it maintains typed pools of already-warm sessions so prompt widgets, bare terminals, and configured agents can attach with near-zero startup latency.

The module also acts as a resource governor. It separates shell pools from agent pools, tracks pressure and cooldown windows, health-checks warm sessions, and scales between a baseline size and a surge size. That makes it a core part of the canvas runtime rather than a simple optimization: it shapes how much tmux capacity is reserved, how quickly agents become interactive, and how the terminal server avoids repeated cold boots.

## Composition

The central abstraction is `HotPool`, which owns a ready queue, an acquired map, configuration, and optional agent startup metadata:

```js
export class HotPool {
  #queue = []
  #acquired = new Map()
  #root = ''
  #poolId = 'terminal'
  #poolSize = DEFAULT_POOL_SIZE
  #maxPoolSize = DEFAULT_MAX_POOL_SIZE
```

Construction merges pool-specific config with shared defaults and stores optional `agentConfig` plus a `wsSend` hook for browser devlogs:

```js
constructor({ root, poolId = 'terminal', config = {}, agentConfig = null, wsSend = null }) {
  this.#root = root
  this.#poolId = poolId
  this.#poolSize = Math.max(0, config.pool_size ?? DEFAULT_POOL_SIZE)
  this.#maxPoolSize = Math.max(this.#poolSize, config.max_pool_size ?? DEFAULT_MAX_POOL_SIZE)
```

Startup checks prerequisites, fills the queue to the current target, and arms a periodic health timer:

```js
async start() {
  if (!this.#enabled || this.#poolSize === 0) return
  this.#prereqsAvailable = await this.#checkPrereqs()
  if (!this.#prereqsAvailable) return
  await this.#fill()
  this.#healthTimer = setInterval(() => this.#healthCheck(), HEALTH_CHECK_INTERVAL_MS)
}
```

Acquisition is the pressure trigger. When the last ready session is taken, the pool flips into surge mode and begins backfilling toward `max_pool_size`:

```js
acquire() {
  const idx = this.#queue.findIndex(s => s.state === 'ready')
  const session = this.#queue.splice(idx, 1)[0]
  session.state = 'acquired'
  if (readyCount === 0 && !this.#pressured) {
    this.#pressured = true
    this.#resetCooldown()
  }
  this.#fill().catch(() => {})
  return session
}
```

Backfilling and warm-session creation are handled by `#fill()` and `#spawnWarmSession()`. Each session is created as a headless tmux session, then optionally warmed into a real agent process:

```js
async #spawnWarmSession() {
  const id = `${this.#poolId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const tmuxName = `sb-pool-${id}`
  execSync(`tmux -f /dev/null new-session -d -s "${tmuxName}" -c "${this.#root}"`, { stdio: 'ignore' })
```

```js
if (this.#agentConfig?.startupCommand) {
  const agentReady = await this.#warmAgent(tmuxName, id)
  if (!agentReady) {
    execSync(`tmux kill-session -t "${tmuxName}" 2>/dev/null`, { stdio: 'ignore' })
    return null
  }
}
```

`#warmAgent()` supports three readiness strategies: a hook-created readiness file, pane scanning for a configured readiness string, or a fixed fallback delay. It can also send a `postStartup` command after readiness:

```js
if (readinessFile) {
  const settings = {
    hooks: {
      SessionStart: [{ type: 'command', command: `touch ${JSON.stringify(signalFilePath)}` }],
    },
  }
  finalCommand = `${startupCommand} --settings ${JSON.stringify(settingsFilePath)}`
}
```

Health checks remove dead sessions and trigger refill. For agent pools, the module treats a pane that has fallen back to `zsh`/`bash`/`sh`/`fish` as unhealthy because the agent CLI has exited.

At the top level, `HotPoolManager` creates one pool for `terminal`, one for `prompt`, and one per configured canvas agent. It starts shell pools immediately and staggers agent-pool startup to avoid CPU and PTY spikes:

```js
export class HotPoolManager {
  #pools = new Map()

  constructor({ root, config = {}, agentsConfig = {}, wsSend = null }) {
    this.#pools.set('terminal', new HotPool({ root, poolId: 'terminal', config: mergeConfig('terminal'), wsSend }))
    this.#pools.set('prompt', new HotPool({ root, poolId: 'prompt', config: mergeConfig('prompt'), wsSend }))
```

```js
const shellPools = poolEntries.filter(([, p]) => !p.isAgentPool)
const agentPools = poolEntries.filter(([, p]) => p.isAgentPool)
await Promise.all(shellPools.map(([, pool]) => pool.start().catch(...)))
for (let i = 0; i < agentPools.length; i++) {
  if (i > 0) await new Promise(r => setTimeout(r, STAGGER_DELAY_MS))
  pool.start().catch(...)
}
```

## Dependencies

- Node `child_process`, `fs`, and `path` for tmux orchestration and readiness files.
- `../logger/devLogger.js` for terminal and browser-facing dev diagnostics.

## Dependents

Derived by import search:

- `packages/storyboard/src/core/vite/server-plugin.js` — constructs and wires the hot-pool manager into the dev server.

## Notes

This module intentionally treats a readiness timeout as non-fatal for agent pools. A partially warmed session that got stuck behind an update prompt is still often better than a completely cold launch, so the pool prefers degraded readiness over discarding useful warm state.
