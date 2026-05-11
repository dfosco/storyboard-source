# `packages/storyboard/src/core/ui/CommandPaletteTrigger.jsx`

<!--
source: packages/storyboard/src/core/ui/CommandPaletteTrigger.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Minimal command-toolbar trigger for opening the command palette. It is the canonical button surface for the palette tool on desktop toolbars.

Unlike the similarly named compatibility wrapper, this variant accepts toolbar config and always dispatches the palette toggle event directly.

## Composition

```jsx
/**
 * CommandPaletteTrigger — toolbar button that opens the ⌘K command palette.
 * Used as a tool component on the command-toolbar surface.
 */

import { useCallback } from 'react'
import { TriggerButton } from '../lib/components/ui/trigger-button/index.js'
import Icon from './Icon.jsx'

export default function CommandPaletteTrigger({ config = {}, tabindex }) {
  const openPalette = useCallback(() => {
    document.dispatchEvent(new CustomEvent('storyboard:toggle-palette'))
  }, [])

  return (
    <TriggerButton
      aria-label="Command palette"
      size={config.size || 'icon-xl'}
      tabIndex={tabindex}
      onClick={openPalette}
    >
      <Icon name={config.icon || 'iconoir/key-command'} size={16} {...(config.meta || {})} />
    </TriggerButton>
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
