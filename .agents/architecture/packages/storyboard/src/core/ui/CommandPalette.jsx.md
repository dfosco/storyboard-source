# `packages/storyboard/src/core/ui/CommandPalette.jsx`

<!--
source: packages/storyboard/src/core/ui/CommandPalette.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

This file is actually a trigger button that dispatches `storyboard:toggle-palette`. It acts as a compatibility wrapper for the React command palette mounted elsewhere.

Its purpose is to let tool configs reference a palette-opening component without importing the heavy palette implementation into the toolbar shell.

## Composition

```jsx
/**
 * CommandPaletteTrigger — toolbar trigger button for the command palette.
 * Dispatches a custom event to open the React-based command palette.
 * The actual palette UI is rendered in React (src/components/CommandPalette).
 */

import { useCallback } from 'react'
import { TriggerButton } from '../lib/components/ui/trigger-button/index.js'
import Icon from './Icon.jsx'

export default function CommandPalette({
  tabindex,
  icon = 'iconoir/key-command',
  iconMeta = {},
  oninterceptclick,
}) {
  const openPalette = useCallback(() => {
    if (oninterceptclick) {
      oninterceptclick()
      return
    }
    document.dispatchEvent(new CustomEvent('storyboard:toggle-palette'))
  }, [oninterceptclick])

  return (
    <TriggerButton
      className="text-2xl"
      aria-label="Command Menu"
      tabIndex={tabindex}
      onClick={openPalette}
    >
      <Icon name={icon} size={16} {...iconMeta} />
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
