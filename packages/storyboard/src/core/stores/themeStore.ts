/**
 * Theme Store — manages the active color scheme for the entire app.
 *
 * Reads/writes `sb-color-scheme` in localStorage, sets Primer CSS attributes
 * (`data-color-mode`, `data-light-theme`, `data-dark-theme`) and the internal
 * `data-sb-theme` attribute on `<html>`, and dispatches a
 * `storyboard:theme:changed` custom event so that non-store consumers
 * (React ThemeProvider, etc.) can react.
 *
 * Supports a "system" value that follows the OS preference via
 * `prefers-color-scheme`, updating automatically when the user changes
 * their system theme.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

function _dispatchEvent(theme: ThemeValue, resolved: string): void {
  if (typeof document === 'undefined') return
  const prototypeTheme = _syncTargets.prototype ? theme : 'light'
  const prototypeResolved = _syncTargets.prototype ? resolved : 'light'
  const toolbarResolved = _syncTargets.toolbar ? resolved : 'light'
  const codeResolved = _syncTargets.codeBoxes ? resolved : 'light'
  const canvasResolved = _syncTargets.canvas ? resolved : 'light'

  document.dispatchEvent(
    new CustomEvent('storyboard:theme:changed', {
      detail: {
        theme,
        resolved,
        prototypeTheme,
        prototypeResolved,
        toolbarResolved,
        codeResolved,
        canvasResolved,
      },
    }),
  )
}

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
