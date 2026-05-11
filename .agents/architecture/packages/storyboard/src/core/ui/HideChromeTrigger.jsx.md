# `packages/storyboard/src/core/ui/HideChromeTrigger.jsx`

<!--
source: packages/storyboard/src/core/ui/HideChromeTrigger.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Always-visible button for hiding or restoring Storyboard chrome. It mirrors document-level chrome classes and provides the toolbar affordance behind the hide shortcut.

The file deliberately separates regular hidden mode from completely hidden mode so the button only disappears in the stronger state.

## Composition

```jsx
/**
 * HideChromeTrigger — toolbar button that toggles toolbar/branch bar visibility.
 * Always visible (even in hide mode). Uses the lightbulb icon.
 * In hide mode: goes 50% opacity.
 * In completely-hidden mode: not rendered at all.
 */

import { useState, useEffect, useCallback } from 'react'
import { TriggerButton } from '../lib/components/ui/trigger-button/index.js'
import Icon from './Icon.jsx'

export default function HideChromeTrigger({ config = {}, tabindex }) {
  const [hidden, setHidden] = useState(
    () => document.documentElement.classList.contains('storyboard-chrome-hidden')
  )
  const [completelyHidden, setCompletelyHidden] = useState(
    () => document.documentElement.classList.contains('storyboard-chrome-completely-hidden')
  )

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setHidden(document.documentElement.classList.contains('storyboard-chrome-hidden'))
      setCompletelyHidden(document.documentElement.classList.contains('storyboard-chrome-completely-hidden'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const toggle = useCallback(() => {
    document.documentElement.classList.toggle('storyboard-chrome-hidden')
    document.documentElement.classList.remove('storyboard-chrome-completely-hidden')
  }, [])

  if (completelyHidden) return null

  return (
    <span style={{ opacity: hidden ? 0.5 : 1, transition: 'opacity 0.15s' }}>
      <TriggerButton
        aria-label={config.ariaLabel || 'Toggle toolbars'}
        size={config.size || 'icon-xl'}
        tabIndex={tabindex}
        onClick={toggle}
      >
        <Icon name={config.icon || 'primer/light-bulb'} size={16} {...(config.meta || {})} />
      </TriggerButton>
    </span>
  )
}
```

The file exports a single default React component and keeps its behavior local to a focused UI concern: a trigger, menu, grouped control, or panel shell element.

## Dependencies

- `react` is imported directly by this component.
- [`packages/storyboard/src/core/lib/components/ui/trigger-button/index.js`](../../../../../../../packages/storyboard/src/core/lib/components/ui/trigger-button/index.js) provides part of this component's behavior.
- [`packages/storyboard/src/core/ui/Icon.jsx`](./Icon.jsx.md) provides part of this component's behavior.

## Dependents

- No direct imports found outside this file.

## Notes

- These runtime UI files are adapters: they convert config, store state, or document events into visible toolbar and panel controls.
