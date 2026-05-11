# `packages/storyboard/src/core/ui/ActionMenuButton.jsx`

<!--
source: packages/storyboard/src/core/ui/ActionMenuButton.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Renders a dropdown trigger for command actions that expose children. It is the reusable menu surface for config entries whose handlers provide radio, toggle, or plain child actions through the command-action store.

It listens for `storyboard:open-tool-menu`, refreshes whenever command actions change, and maps child descriptors onto dropdown menu primitives.

## Composition

```jsx
import { useState, useEffect, useCallback } from 'react'
import { TriggerButton } from '../lib/components/ui/trigger-button/index.js'
import * as DropdownMenu from '../lib/components/ui/dropdown-menu/index.js'
import Icon from './Icon.jsx'
import { getActionChildren, subscribeToCommandActions } from '../index.js'

export default function ActionMenuButton({ config = {}, data: _data, localOnly: _localOnly, tabindex = -1 }) {
  void _data
  void _localOnly
  const [menuOpen, setMenuOpen] = useState(false)
  const [_actionsVersion, setActionsVersion] = useState(0)
  void _actionsVersion

  useEffect(() => {
    const unsub = subscribeToCommandActions(() => { setActionsVersion((v) => v + 1) })
    return unsub
  }, [])

  // Allow external callers (e.g. command palette) to open this menu
  useEffect(() => {
    const actionId = config.action
    if (!actionId) return
    function onTrigger(e) {
      if (e.detail?.action === actionId) setMenuOpen(true)
    }
    window.addEventListener('storyboard:open-tool-menu', onTrigger)
    return () => window.removeEventListener('storyboard:open-tool-menu', onTrigger)
  }, [config.action])

  const children = config.action ? getActionChildren(config.action) : []
  const hasRadio = children.some((c) => c.type === 'radio')
  const activeValue = children.find((c) => c.type === 'radio' && c.active)?.id || ''

  const handleOpenChange = useCallback((open) => {
    setMenuOpen(open)
    if (open) setActionsVersion((v) => v + 1)
  }, [])

  if (children.length === 0) return null

  return (
    <DropdownMenu.Root open={menuOpen} onOpenChange={handleOpenChange}>
      <DropdownMenu.Trigger>
          <TriggerButton
            active={menuOpen}
            size="icon-xl"
            aria-label={config.ariaLabel || config.label || 'Menu'}
            tabIndex={tabindex}
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
