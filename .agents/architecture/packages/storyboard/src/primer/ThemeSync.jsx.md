# `packages/storyboard/src/primer/ThemeSync.jsx`
<!--
source: packages/storyboard/src/primer/ThemeSync.jsx
category: storyboard
importance: medium
-->
> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

An invisible React component that bridges the storyboard-core toolbar theme switcher (Svelte-based CoreUIBar) with Primer's `ThemeProvider` context. Listens to `storyboard:theme:changed` custom DOM events and translates theme values into Primer's `setColorMode`/`setDayScheme`/`setNightScheme` API. Also reads `localStorage` on mount to initialise the correct scheme before the CoreUIBar has loaded.

This component lives in `src/primer/` because it is Primer-specific — it requires `useTheme()` from `@primer/react` and is only needed in apps using Primer as their design system.

## Composition

```jsx
export default function ThemeSync() {
  const { setColorMode, setDayScheme, setNightScheme } = useTheme()

  // Initialize from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sb-color-scheme')
    const syncTargets = readSyncTargets()  // reads 'sb-theme-sync' localStorage key
    const prototypeTheme = syncTargets.prototype ? saved : 'light'
    applyToPrimer(setColorMode, setDayScheme, setNightScheme, prototypeTheme)
  }, [])

  // Listen for theme changes from CoreUIBar
  useEffect(() => {
    function handleThemeChanged(e) {
      const { prototypeTheme } = e.detail || {}
      applyToPrimer(setColorMode, setDayScheme, setNightScheme, prototypeTheme)
    }
    document.addEventListener('storyboard:theme:changed', handleThemeChanged)
    return () => document.removeEventListener('storyboard:theme:changed', handleThemeChanged)
  }, [setColorMode, setDayScheme, setNightScheme])

  return null
}
```

Theme mapping: `'system'`/null → `setColorMode('auto')`, any named theme → `setColorMode('day')` + `setDayScheme(theme)` + `setNightScheme(theme)`.

The "Apply theme to" settings (`sb-theme-sync` localStorage key) can disable prototype theme sync — when `syncTargets.prototype` is false, the prototype is forced to `light` regardless of the selected theme.

## Dependencies

- `@primer/react` — `useTheme` (must be called inside `<ThemeProvider>`)

## Dependents

- Consumer `_app.jsx` or prototype layout components that use Primer — mount `<ThemeSync />` inside `<ThemeProvider>` to enable theme sync
- `packages/storyboard/src/primer/index.js` — may re-export this component

## Notes

- This is the only file in `src/primer/` — it's isolated here so the main storyboard package has no hard dependency on `@primer/react`.
- The `storyboard:theme:changed` event is dispatched by the core theme store (`packages/storyboard/src/core/stores/themeStore.js`) when the user switches themes via the CoreUIBar.
