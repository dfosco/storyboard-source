/**
 * ThemeSync — invisible React component that bridges the storyboard-core
 * toolbar theme switcher with Primer's ThemeProvider context.
 *
 * Listens for `storyboard:theme:changed` custom events dispatched by the
 * core theme store and calls setColorMode/setDayScheme/setNightScheme on
 * Primer's useTheme() hook accordingly.
 *
 * On mount it reads localStorage to initialize Primer to the correct
 * scheme before the Svelte CoreUIBar has loaded.
 *
 * When prototype sync is disabled (via "Apply theme to" settings), the
 * prototype is forced to light mode regardless of the selected theme.
 */

import { useEffect } from 'react'
import { useTheme } from '@primer/react'

const THEME_STORAGE_KEY = 'sb-color-scheme'
const THEME_SYNC_STORAGE_KEY = 'sb-theme-sync'

const DEFAULT_SYNC = {
  prototype: true,
  toolbar: false,
  codeBoxes: true,
}

function readSyncTargets() {
  try {
    const raw = localStorage.getItem(THEME_SYNC_STORAGE_KEY)
    if (!raw) return DEFAULT_SYNC
    return { ...DEFAULT_SYNC, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SYNC
  }
}

function applyToPrimer(setColorMode, setDayScheme, setNightScheme, themeValue) {
  if (themeValue === 'system' || !themeValue) {
    setColorMode('auto')
    setDayScheme('light')
    setNightScheme('dark')
  } else {
    setColorMode('day')
    setDayScheme(themeValue)
    setNightScheme(themeValue)
  }
}

export default function ThemeSync() {
  const { setColorMode, setDayScheme, setNightScheme } = useTheme()

  // Restore saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    const syncTargets = readSyncTargets()
    const prototypeTheme = syncTargets.prototype ? saved : 'light'
    applyToPrimer(setColorMode, setDayScheme, setNightScheme, prototypeTheme)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for theme changes from the Svelte CoreUIBar
  useEffect(() => {
    function handleThemeChanged(e) {
      const { prototypeTheme } = e.detail || {}
      if (typeof prototypeTheme !== 'string') return
      applyToPrimer(setColorMode, setDayScheme, setNightScheme, prototypeTheme)
    }
    document.addEventListener('storyboard:theme:changed', handleThemeChanged)
    return () => document.removeEventListener('storyboard:theme:changed', handleThemeChanged)
  }, [setColorMode, setDayScheme, setNightScheme])

  return null
}
