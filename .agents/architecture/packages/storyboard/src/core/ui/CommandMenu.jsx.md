# `packages/storyboard/src/core/ui/CommandMenu.jsx`

<!--
source: packages/storyboard/src/core/ui/CommandMenu.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Renders the main ⌘ dropdown menu from the command-action registry. It is the visible menu surface for actions that CoreUIBar seeds from toolbar config and runtime handlers.

The component understands default, toggle, link, submenu, header, separator, and footer action shapes, so the registry can stay declarative while the shell renders a rich dropdown tree.

## Composition

```jsx
/**
 * CommandMenu — ⌘ trigger + config-driven dropdown menu.
 * Renders actions from the command action registry by type:
 *   default  → DropdownMenu.Item
 *   toggle   → DropdownMenu.CheckboxItem
 *   submenu  → DropdownMenu.Sub with SubTrigger + SubContent
 */

import './CommandMenu.css';
import { useState, useEffect, useMemo, useCallback } from 'react'
import * as DropdownMenu from '../lib/components/ui/dropdown-menu/index.js'
import * as Panel from '../lib/components/ui/panel/index.js'
import { TriggerButton } from '../lib/components/ui/trigger-button/index.js'
import Icon from './Icon.jsx'
import { getActionsForMode, executeAction, getActionChildren, subscribeToCommandActions } from '../stores/commandActions.js'
import { getToolbarToolState, isToolbarToolLocalOnly, subscribeToToolbarToolStates } from '../stores/toolStateStore.js'
import { getCurrentMode, subscribeToMode } from '../modes/modes.js'

const localDotStyle = {
  display: 'inline-block',
  width: 4,
  height: 4,
  background: '#1a7f37',
  borderRadius: '50%',
  flexShrink: 0,
}

export default function CommandMenu({
  basePath = '/',
  open: controlledOpen,
  onOpenChange,
  tabindex,
  icon = 'iconoir/key-command',
  iconMeta = {},
  flowDialogOpen: controlledFlowDialogOpen,
  onFlowDialogOpenChange,
  flowName = 'default',
  flowJson = '',
  flowError = null,
  shortcuts = {},
}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = useCallback((v) => {
    const val = typeof v === 'function' ? v(open) : v
    if (onOpenChange) onOpenChange(val)
    else setInternalOpen(val)
  }, [onOpenChange, open])
```

The file exports a single default React component and keeps its behavior local to a focused UI concern: a trigger, menu, grouped control, or panel shell element.

## Dependencies

- [`packages/storyboard/src/core/ui/CommandMenu.css`](../../../../../../../packages/storyboard/src/core/ui/CommandMenu.css) provides part of this component's behavior.
- `react` is imported directly by this component.
- [`packages/storyboard/src/core/lib/components/ui/dropdown-menu/index.js`](../../../../../../../packages/storyboard/src/core/lib/components/ui/dropdown-menu/index.js) provides part of this component's behavior.
- [`packages/storyboard/src/core/lib/components/ui/panel/index.js`](../../../../../../../packages/storyboard/src/core/lib/components/ui/panel/index.js) provides part of this component's behavior.
- [`packages/storyboard/src/core/lib/components/ui/trigger-button/index.js`](../../../../../../../packages/storyboard/src/core/lib/components/ui/trigger-button/index.js) provides part of this component's behavior.
- [`packages/storyboard/src/core/ui/Icon.jsx`](./Icon.jsx.md) provides part of this component's behavior.
- [`packages/storyboard/src/core/stores/commandActions.js`](../../../../../../../packages/storyboard/src/core/stores/commandActions.js) provides part of this component's behavior.
- [`packages/storyboard/src/core/stores/toolStateStore.js`](../../../../../../../packages/storyboard/src/core/stores/toolStateStore.js) provides part of this component's behavior.
- [`packages/storyboard/src/core/modes/modes.js`](../../../../../../../packages/storyboard/src/core/modes/modes.js) provides part of this component's behavior.

## Dependents

- No direct imports found outside this file.

## Notes

- These runtime UI files are adapters: they convert config, store state, or document events into visible toolbar and panel controls.
