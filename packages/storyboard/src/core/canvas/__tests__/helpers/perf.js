/**
 * Performance timing and reporting for integration tests.
 *
 * Every timed operation records metric name, duration, and optional metadata.
 * After all tests, call report() for a summary table and toJSON() for file output.
 */

const metrics = []

const THRESHOLDS = {
  'widget.create': 1000,
  'widget.update': 1000,
  'widget.delete': 1000,
  'canvas.read': 1000,
  'connector.add': 1000,
  'connector.remove': 1000,
  'tmux.session.start': 5000,
  'tmux.welcome.render': 10000,
  'agent.startup': 60000,
  'agent.response': 45000,
  'agent.full_chain': 300000,
}

/** Start a timer. Returns { end() } that records the metric. */
export function start(name, meta = {}) {
  const t0 = performance.now()
  return {
    end(extraMeta = {}) {
      const duration = performance.now() - t0
      const entry = { name, duration, ...meta, ...extraMeta, timestamp: new Date().toISOString() }
      metrics.push(entry)

      // Check threshold — emit warning inline
      const thresholdKey = Object.keys(THRESHOLDS).find((k) => name.startsWith(k) || name === k)
      if (thresholdKey && duration > THRESHOLDS[thresholdKey]) {
        console.warn(`[SLOW] ${name}: ${(duration / 1000).toFixed(1)}s (threshold: ${(THRESHOLDS[thresholdKey] / 1000).toFixed(1)}s)`)
      }

      return entry
    },
  }
}

/** Manually record a metric. */
export function record(name, durationMs, meta = {}) {
  metrics.push({ name, duration: durationMs, ...meta, timestamp: new Date().toISOString() })
}

/** Get all recorded metrics. */
export function getMetrics() {
  return [...metrics]
}

/** Get metrics exceeding thresholds. */
export function getWarnings() {
  return metrics.filter((m) => {
    const key = Object.keys(THRESHOLDS).find((k) => m.name.startsWith(k) || m.name === k)
    return key && m.duration > THRESHOLDS[key]
  })
}

/** Print a summary table to console. */
export function report() {
  if (metrics.length === 0) {
    console.log('\n[perf] No metrics recorded.\n')
    return
  }

  // Group by metric name
  const groups = {}
  for (const m of metrics) {
    if (!groups[m.name]) groups[m.name] = []
    groups[m.name].push(m.duration)
  }

  console.log('\n┌─────────────────────────────────────────────────────────────────┐')
  console.log('│                    Performance Summary                          │')
  console.log('├───────────────────────────────┬───────┬───────┬───────┬─────────┤')
  console.log('│ Metric                        │  Min  │  Avg  │  Max  │ Warning │')
  console.log('├───────────────────────────────┼───────┼───────┼───────┼─────────┤')

  for (const [name, durations] of Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]))) {
    const min = Math.min(...durations)
    const max = Math.max(...durations)
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length
    const thresholdKey = Object.keys(THRESHOLDS).find((k) => name.startsWith(k) || name === k)
    const warn = thresholdKey && max > THRESHOLDS[thresholdKey] ? '  ⚠️' : '  ✓'
    const pad = (s, n) => s.slice(0, n).padEnd(n)
    const fmt = (ms) => {
      if (ms < 1000) return `${Math.round(ms)}ms`.padStart(5)
      return `${(ms / 1000).toFixed(1)}s`.padStart(5)
    }
    console.log(`│ ${pad(name, 29)} │ ${fmt(min)} │ ${fmt(avg)} │ ${fmt(max)} │ ${pad(warn, 7)} │`)
  }

  console.log('└───────────────────────────────┴───────┴───────┴───────┴─────────┘')

  const warnings = getWarnings()
  if (warnings.length > 0) {
    console.log(`\n⚠️  ${warnings.length} operation(s) exceeded performance thresholds.`)
  }
  console.log('')
}

/** Return JSON-serializable metrics for file output. */
export function toJSON() {
  return {
    timestamp: new Date().toISOString(),
    totalMetrics: metrics.length,
    metrics: metrics.map((m) => ({ ...m, duration: Math.round(m.duration) })),
    warnings: getWarnings().map((m) => ({ ...m, duration: Math.round(m.duration) })),
  }
}

/** Reset all metrics (for test isolation). */
export function reset() {
  metrics.length = 0
}
