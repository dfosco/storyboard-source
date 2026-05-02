/**
 * Resolve the effective canvas theme from the core theme store.
 * Respects the canvas-specific theme sync toggle.
 */
import { getTheme, getThemeSyncTargets } from '../../../core/index.js'

function resolveSystem() {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light'
}

export function resolveCanvasTheme() {
  const sync = getThemeSyncTargets()
  if (!sync.canvas) return 'light'
  const theme = getTheme()
  return theme === 'system' ? resolveSystem() : theme
}

/**
 * Subscribe to canvas theme changes for embed widget snapshot switching.
 *
 * Reads `data-sb-canvas-theme` from the nearest ancestor set by CanvasPage.
 * With canvas sync ON (the default), this attribute follows the global theme.
 * Uses MutationObserver for immediate reaction + event backup.
 */
export function subscribeCanvasTheme({ anchorRef, onTheme }) {
  if (typeof onTheme !== 'function') return () => {}

  let observed = null
  let observer = null

  function readAndEmit() {
    const el = anchorRef?.current?.closest?.('[data-sb-canvas-theme]') || null
    if (el !== observed) {
      if (observer) observer.disconnect()
      observer = null
      observed = el
      if (el && typeof MutationObserver !== 'undefined') {
        observer = new MutationObserver(readAndEmit)
        observer.observe(el, { attributes: true, attributeFilter: ['data-sb-canvas-theme'] })
      }
    }
    onTheme(el?.getAttribute('data-sb-canvas-theme') || 'light')
  }

  readAndEmit()
  document.addEventListener('storyboard:theme:changed', readAndEmit)

  return () => {
    document.removeEventListener('storyboard:theme:changed', readAndEmit)
    if (observer) observer.disconnect()
  }
}

/**
 * Per-theme embed chrome CSS custom properties sourced from @primer/primitives.
 */
const EMBED_CHROME_VARS = {
  light: {
    '--bgColor-default': '#ffffff',
    '--bgColor-muted': '#f6f8fa',
    '--bgColor-neutral-muted': '#818b981f',
    '--fgColor-default': '#1f2328',
    '--fgColor-muted': '#59636e',
    '--fgColor-onEmphasis': '#ffffff',
    '--borderColor-default': '#d1d9e0',
    '--borderColor-muted': '#d1d9e0b3',
    '--bgColor-accent-emphasis': '#0969da',
    '--trigger-bg': '#f6f8fa',
    '--trigger-bg-hover': '#eaeef2',
    '--trigger-border': '#d1d9e0',
  },
  light_colorblind: {
    '--bgColor-default': '#ffffff',
    '--bgColor-muted': '#f6f8fa',
    '--bgColor-neutral-muted': '#818b981f',
    '--fgColor-default': '#1f2328',
    '--fgColor-muted': '#59636e',
    '--fgColor-onEmphasis': '#ffffff',
    '--borderColor-default': '#d1d9e0',
    '--borderColor-muted': '#d1d9e0b3',
    '--bgColor-accent-emphasis': '#0969da',
    '--trigger-bg': '#f6f8fa',
    '--trigger-bg-hover': '#eaeef2',
    '--trigger-border': '#d1d9e0',
  },
  dark: {
    '--bgColor-default': '#0d1117',
    '--bgColor-muted': '#151b23',
    '--bgColor-neutral-muted': '#656c7633',
    '--fgColor-default': '#f0f6fc',
    '--fgColor-muted': '#9198a1',
    '--fgColor-onEmphasis': '#ffffff',
    '--borderColor-default': '#3d444d',
    '--borderColor-muted': '#3d444db3',
    '--bgColor-accent-emphasis': '#1f6feb',
    '--trigger-bg': '#151b23',
    '--trigger-bg-hover': '#212830',
    '--trigger-border': '#3d444d',
  },
  dark_dimmed: {
    '--bgColor-default': '#212830',
    '--bgColor-muted': '#262c36',
    '--bgColor-neutral-muted': '#656c7633',
    '--fgColor-default': '#d1d7e0',
    '--fgColor-muted': '#9198a1',
    '--fgColor-onEmphasis': '#f0f6fc',
    '--borderColor-default': '#3d444d',
    '--borderColor-muted': '#3d444db3',
    '--bgColor-accent-emphasis': '#316dca',
    '--trigger-bg': '#262c36',
    '--trigger-bg-hover': '#2d333b',
    '--trigger-border': '#3d444d',
  },
  dark_colorblind: {
    '--bgColor-default': '#0d1117',
    '--bgColor-muted': '#151b23',
    '--bgColor-neutral-muted': '#656c7633',
    '--fgColor-default': '#f0f6fc',
    '--fgColor-muted': '#9198a1',
    '--fgColor-onEmphasis': '#ffffff',
    '--borderColor-default': '#3d444d',
    '--borderColor-muted': '#3d444db3',
    '--bgColor-accent-emphasis': '#1f6feb',
    '--trigger-bg': '#151b23',
    '--trigger-bg-hover': '#212830',
    '--trigger-border': '#3d444d',
  },
  dark_high_contrast: {
    '--bgColor-default': '#010409',
    '--bgColor-muted': '#151b23',
    '--bgColor-neutral-muted': '#212830',
    '--fgColor-default': '#ffffff',
    '--fgColor-muted': '#b7bdc8',
    '--fgColor-onEmphasis': '#ffffff',
    '--borderColor-default': '#b7bdc8',
    '--borderColor-muted': '#b7bdc8',
    '--bgColor-accent-emphasis': '#194fb1',
    '--trigger-bg': '#151b23',
    '--trigger-bg-hover': '#212830',
    '--trigger-border': '#b7bdc8',
  },
}

export function getEmbedChromeVars(theme) {
  const value = String(theme || 'light')
  return EMBED_CHROME_VARS[value] || EMBED_CHROME_VARS.light
}
