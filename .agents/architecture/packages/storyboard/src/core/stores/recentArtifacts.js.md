# `packages/storyboard/src/core/stores/recentArtifacts.js`

<!--

source: packages/storyboard/src/core/stores/recentArtifacts.js

category: storyboard

importance: medium

-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`recentArtifacts.js` persists a small, route-agnostic MRU list for the command palette. Instead of storing navigation URLs, it stores artifact identity and lets higher layers derive the correct route later for the current branch and base path.

## Composition

```js
const STORAGE_KEY = 'storyboard:recent-artifacts'
const MAX_ITEMS = 10

/**
 * @typedef {{ type: string, key: string, label: string }} RecentEntry
 */

/**
 * Track a recently visited artifact.
 * Pushes to the top, deduplicates by type+key, trims to MAX_ITEMS.
 *
 * @param {string} type  — 'prototype' | 'canvas' | 'story' | 'flow'
 * @param {string} key   — unique identifier (e.g. dirName, canvas id, story name)
 * @param {string} label — display label
 */
export function trackRecent(type, key, label) {
  if (!type || !key) return
  const entries = _read()
  const deduped = entries.filter(e => !(e.type === type && e.key === key))
  deduped.unshift({ type, key, label: label || key })
  _write(deduped.slice(0, MAX_ITEMS))
}

/**
 * Get the list of recently visited artifacts, newest first.
 * @returns {RecentEntry[]}
 */
export function getRecent() {
  return _read()
}

/**
 * Clear all recent artifacts. Useful for testing.
 */
export function clearRecent() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

function _read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function _write(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch { /* quota exceeded or unavailable */ }
}
```

## Dependencies

- None — this module is framework-agnostic and self-contained.

## Dependents

- [`packages/storyboard/src/core/index.js`](../index.js.md)

- [`packages/storyboard/src/core/stores/paletteProviders.js`](paletteProviders.js.md)

- [`packages/storyboard/src/core/stores/paletteProviders.test.js`](paletteProviders.test.js.md)

- [`packages/storyboard/src/core/stores/recentArtifacts.test.js`](recentArtifacts.test.js.md)

## Notes

- Entries are deduplicated by `(type, key)`, not by label, so relabeling an artifact updates the top entry cleanly.

- Storage failures are swallowed intentionally to keep palette navigation functional in restricted browser environments.
