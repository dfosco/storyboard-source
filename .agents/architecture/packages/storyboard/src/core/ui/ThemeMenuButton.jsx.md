# `packages/storyboard/src/core/ui/ThemeMenuButton.jsx`

<!--
source: packages/storyboard/src/core/ui/ThemeMenuButton.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Theme picker and theme-sync settings menu for the toolbar. It exposes theme selection plus target-specific sync toggles for canvas, prototype, tools, and code boxes.

The file bridges simple theme choice with multi-target propagation managed by theme-store state.

## Composition

```jsx
import { useState, useEffect } from 'react'
import { TriggerButton } from '../lib/components/ui/trigger-button/index.js'
import * as DropdownMenu from '../lib/components/ui/dropdown-menu/index.js'
import Icon from './Icon.jsx'
import { themeState, setTheme, getTheme, THEMES, themeSyncState, getThemeSyncTargets, setThemeSyncTarget } from '../index.js'

export default function ThemeMenuButton({ config = {}, data: _data, localOnly: _localOnly, tabindex = -1 }) {
  void _data
  void _localOnly
  const [menuOpen, setMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [canvasActive, setCanvasActive] = useState(false)
  const [theme, setThemeState] = useState(getTheme)
  const [syncState, setSyncState] = useState(getThemeSyncTargets)

  useEffect(() => {
    const unsub = themeState.subscribe(s => setThemeState(s.theme))
    return unsub
  }, [])

  useEffect(() => {
    const unsub = themeSyncState.subscribe(s => setSyncState({ ...s }))
    return unsub
  }, [])

  useEffect(() => {
    function handleCanvasMounted() { setCanvasActive(true) }
    function handleCanvasUnmounted() { setCanvasActive(false) }
    function handleOpenSettings() {
      setMenuOpen(true)
      setSettingsOpen(true)
    }
    document.addEventListener('storyboard:canvas:mounted', handleCanvasMounted)
    document.addEventListener('storyboard:canvas:unmounted', handleCanvasUnmounted)
    document.addEventListener('storyboard:open-theme-settings', handleOpenSettings)

    const state = window.__storyboardCanvasBridgeState
    const active = state?.active === true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanvasActive(active)
    if (!active) {
      document.dispatchEvent(new CustomEvent('storyboard:canvas:status-request'))
    }

    return () => {
      document.removeEventListener('storyboard:canvas:mounted', handleCanvasMounted)
      document.removeEventListener('storyboard:canvas:unmounted', handleCanvasUnmounted)
      document.removeEventListener('storyboard:open-theme-settings', handleOpenSettings)
```

The file exports a single default React component and keeps its behavior local to a focused UI concern: a trigger, menu, grouped control, or panel shell element.

## Dependencies

- `react` is imported directly by this component.
- [`packages/storyboard/src/core/lib/components/ui/trigger-button/index.js`](../../../../../../../packages/storyboard/src/core/lib/components/ui/trigger-button/index.js) provides part of this component's behavior.
- [`packages/storyboard/src/core/lib/components/ui/dropdown-menu/index.js`](../../../../../../../packages/storyboard/src/core/lib/components/ui/dropdown-menu/index.js) provides part of this component's behavior.
- [`packages/storyboard/src/core/ui/Icon.jsx`](./Icon.jsx.md) provides part of this component's behavior.
- [`packages/storyboard/src/core/index.js`](../../../../../../../packages/storyboard/src/core/index.js) provides part of this component's behavior.

## Dependents

- No direct imports found outside this file.

## Notes

- These runtime UI files are adapters: they convert config, store state, or document events into visible toolbar and panel controls.
