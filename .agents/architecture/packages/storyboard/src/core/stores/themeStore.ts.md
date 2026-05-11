# `packages/storyboard/src/core/stores/themeStore.ts`

<!--

source: packages/storyboard/src/core/stores/themeStore.ts

category: storyboard

importance: medium

-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

`themeStore.ts` is the global theme singleton for Storyboard. It persists the chosen scheme, reflects it into Primer-compatible DOM attributes, broadcasts a `storyboard:theme:changed` event for non-store consumers, and tracks which UI surfaces should follow the global theme versus stay light.

Unlike the simpler config caches in this folder, this store is both persistent and eventful: it reacts to system theme changes, replays its current state to subscribers, and maintains a second readable store for sync-target preferences used by prototypes, toolbar chrome, code blocks, and canvas surfaces.

## Composition

```ts
export type ThemeValue =
  | 'system'
  | 'light'
  | 'light_colorblind'
  | 'dark'
  | 'dark_colorblind'
  | 'dark_high_contrast'
  | 'dark_dimmed'

export interface ThemeOption {
  name: string
  value: ThemeValue
}

export interface ThemeState {
  /** The stored theme value (may be "system") */
  theme: ThemeValue
  /** The resolved CSS theme value (never "system") */
  resolved: string
}

type Subscriber<T> = (value: T) => void
type Unsubscriber = () => void

interface Readable<T> {
  subscribe(run: Subscriber<T>): Unsubscriber
}

interface Writable<T> extends Readable<T> {
  set(value: T): void
}

function writable<T>(initial: T): Writable<T> {
  let value = initial
  const subs = new Set<Subscriber<T>>()
  return {
    set(v: T) {
      value = v
      subs.forEach((fn) => fn(value))
    },
    subscribe(run: Subscriber<T>): Unsubscriber {
      subs.add(run)
      run(value)
      return () => { subs.delete(run) }
    },
  }
}
```

```ts
const STORAGE_KEY = 'sb-color-scheme'

export const THEMES: ThemeOption[] = [
  { name: 'System', value: 'system' },
  { name: 'Light', value: 'light' },
  { name: 'Light colorblind', value: 'light_colorblind' },
  { name: 'Dark', value: 'dark' },
  { name: 'Dark colorblind', value: 'dark_colorblind' },
  { name: 'Dark high contrast', value: 'dark_high_contrast' },
  { name: 'Dark Dimmed', value: 'dark_dimmed' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSystemTheme(): string {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(value: ThemeValue): string {
  return value === 'system' ? getSystemTheme() : value
}

function readStoredTheme(): ThemeValue {
  if (typeof localStorage === 'undefined') return 'system'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return 'system'
  // Legacy values (pre-system support) are plain scheme names
  if (stored === 'system') return 'system'
  return stored as ThemeValue
}

function snapshot(theme: ThemeValue): ThemeState {
  return { theme, resolved: resolveTheme(theme) }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

let _current: ThemeValue = readStoredTheme()
const _store = writable<ThemeState>(snapshot(_current))

function _applyToDOM(theme: ThemeValue, resolved: string): void {
  if (typeof document === 'undefined') return
  const el = document.documentElement

  // Per-target resolved themes
  const prototypeTheme = _syncTargets.prototype ? resolved : 'light'
  const toolbarTheme = _syncTargets.toolbar ? resolved : 'light'
  const codeTheme = _syncTargets.codeBoxes ? resolved : 'light'
  const canvasTheme = _syncTargets.canvas ? resolved : 'light'

  // Internal attributes
  el.setAttribute('data-sb-theme', prototypeTheme)
  el.setAttribute('data-sb-code-theme', codeTheme)

  // Toolbar theme — follows global theme when synced, stays light otherwise
  el.setAttribute('data-sb-toolbar-theme', toolbarTheme)
  el.setAttribute('data-sb-canvas-theme', canvasTheme)

  // Primer CSS attributes — these drive @primer/react ThemeProvider and
  // Primer CSS custom-property layers without needing React state updates.
  if (theme === 'system' && _syncTargets.prototype) {
    el.setAttribute('data-color-mode', 'auto')
    el.setAttribute('data-light-theme', 'light')
    el.setAttribute('data-dark-theme', 'dark')
  } else if (prototypeTheme.startsWith('dark')) {
    el.setAttribute('data-color-mode', 'dark')
    el.setAttribute('data-dark-theme', prototypeTheme)
    el.setAttribute('data-light-theme', 'light')
  } else {
    el.setAttribute('data-color-mode', 'light')
    el.setAttribute('data-light-theme', prototypeTheme)
    el.setAttribute('data-dark-theme', 'dark')
  }
}
```

`setTheme()` updates local storage, the readable store, the DOM, and the custom event in one place. The second half of the file manages sync targets and reapplies the DOM projection whenever one of those booleans changes.

```ts
/**
 * Return the current theme value (may be "system").
 */
export function getTheme(): ThemeValue {
  return _current
}

/**
 * Set the active theme. Updates localStorage, the DOM attribute,
 * and dispatches a change event.
 */
export function setTheme(value: ThemeValue): void {
  _current = value

  if (typeof localStorage !== 'undefined') {
    if (value === 'system') {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, value)
    }
  }

  const state = snapshot(value)
  _store.set(state)
  _applyToDOM(value, state.resolved)
  _dispatchEvent(value, state.resolved)
}

/**
 * Readable store for the current theme state.
 */
export const themeState: Readable<ThemeState> = { subscribe: _store.subscribe }

// ---------------------------------------------------------------------------
// OS preference listener
// ---------------------------------------------------------------------------

if (typeof window !== 'undefined') {
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      if (_current !== 'system') return
      const state = snapshot('system')
      _store.set(state)
      _applyToDOM('system', state.resolved)
      _dispatchEvent('system', state.resolved)
    })
}

// ---------------------------------------------------------------------------
// Theme sync targets
// ---------------------------------------------------------------------------

/** Which parts of the UI follow the global theme */
export interface ThemeSyncTargets {
  prototype: boolean
  toolbar: boolean
  codeBoxes: boolean
  canvas: boolean
}

const SYNC_STORAGE_KEY = 'sb-theme-sync'

const DEFAULT_SYNC: ThemeSyncTargets = {
  prototype: true,
  toolbar: false,
  codeBoxes: true,
  canvas: true,
}

function readStoredSync(): ThemeSyncTargets {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_SYNC }
  try {
    const raw = localStorage.getItem(SYNC_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SYNC }
    return { ...DEFAULT_SYNC, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_SYNC }
  }
}

let _syncTargets: ThemeSyncTargets = readStoredSync()
const _syncStore = writable<ThemeSyncTargets>(_syncTargets)

/**
 * Get the current theme sync targets.
 */
export function getThemeSyncTargets(): ThemeSyncTargets {
  return { ..._syncTargets }
}

/**
 * Set a theme sync target. Persists to localStorage.
 */
export function setThemeSyncTarget(target: keyof ThemeSyncTargets, value: boolean): void {
  _syncTargets = { ..._syncTargets, [target]: value }
  _syncStore.set(_syncTargets)

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(_syncTargets))
  }

  // Re-apply DOM attributes so toolbar/codebox can react
  const state = snapshot(_current)
  _applyToDOM(_current, state.resolved)
  _dispatchEvent(_current, state.resolved)
}

/**
 * Readable store for sync target state.
 */
export const themeSyncState: Readable<ThemeSyncTargets> = { subscribe: _syncStore.subscribe }

// ---------------------------------------------------------------------------
// Boot — apply the stored theme immediately on import
// ---------------------------------------------------------------------------

_applyToDOM(_current, resolveTheme(_current))
```

Sample subscription pattern:

```ts
const unsubscribe = themeState.subscribe((state) => {
  console.log(state.theme, state.resolved)
})

// later
unsubscribe()
```

## Dependencies

- None — this module is framework-agnostic and self-contained.

## Dependents

- [`packages/storyboard/src/core/index.js`](../index.js.md)

- [`packages/storyboard/src/core/mountStoryboardCore.js`](../mountStoryboardCore.js.md)

- [`packages/storyboard/src/core/ui/CoreUIBar.jsx`](../ui/CoreUIBar.jsx.md)

- [`packages/storyboard/src/internals/hooks/useThemeState.js`](../../internals/hooks/useThemeState.js.md)

## Notes

- When the stored theme is `system`, no value is written to `sb-color-scheme`; absence in local storage means 'follow OS'.

- The module applies the stored theme immediately on import to reduce flash-of-unstyled-theme at boot.
