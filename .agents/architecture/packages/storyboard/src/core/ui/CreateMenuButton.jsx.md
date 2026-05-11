# `packages/storyboard/src/core/ui/CreateMenuButton.jsx`

<!--
source: packages/storyboard/src/core/ui/CreateMenuButton.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Builds a generic create-menu dropdown from supplied feature overlays or an explicit action list. It is a reusable shell primitive for “open an overlay from a menu item” workflows.

The file maps route-aware menu actions to lazy panel overlays without knowing the business logic inside those overlays.

## Composition

```jsx
import { useState, useMemo } from 'react'
import { TriggerButton } from '../lib/components/ui/trigger-button/index.js'
import * as DropdownMenu from '../lib/components/ui/dropdown-menu/index.js'
import * as Panel from '../lib/components/ui/panel/index.js'
import Icon from './Icon.jsx'
import { isExcludedByRoute } from '../index.js'

export default function CreateMenuButton({ features: featuresProp = [], data, config = { label: 'Create' }, localOnly: _localOnly, tabindex }) {
  const features = featuresProp.length > 0 ? featuresProp : (data?.features || [])
  void _localOnly
  const menuWidth = config.menuWidth || null

  const [menuOpen, setMenuOpen] = useState(false)
  const [activeAction, setActiveAction] = useState(null)

  const featuresByName = useMemo(
    () => Object.fromEntries(features.map((f) => [f.name, f])),
    [features],
  )

  const resolvedActions = useMemo(() => {
    const actions = config.actions
    if (!Array.isArray(actions)) {
      return [
        { type: 'header', label: config.label, _key: 'header' },
        ...features.map((f) => ({ type: 'default', label: f.label, _feature: f, _key: f.overlayId })),
      ]
    }
    return actions
      .map((a, i) => {
        if (a.feature) {
          const feat = featuresByName[a.feature]
          if (!feat) return null
          return { ...a, _feature: feat, _key: a.id || `action-${i}` }
        }
        return { ...a, _key: a.id || `${a.type}-${i}` }
      })
      .filter(Boolean)
  }, [config, features, featuresByName])

  function showOverlay(action) {
    setActiveAction(action)
    setMenuOpen(false)
  }

  function closeOverlay() { setActiveAction(null) }

  const OverlayComponent = activeAction?._feature?.overlay
```

The file exports a single default React component and keeps its behavior local to a focused UI concern: a trigger, menu, grouped control, or panel shell element.

## Dependencies

- `react` is imported directly by this component.
- [`packages/storyboard/src/core/lib/components/ui/trigger-button/index.js`](../../../../../../../packages/storyboard/src/core/lib/components/ui/trigger-button/index.js) provides part of this component's behavior.
- [`packages/storyboard/src/core/lib/components/ui/dropdown-menu/index.js`](../../../../../../../packages/storyboard/src/core/lib/components/ui/dropdown-menu/index.js) provides part of this component's behavior.
- [`packages/storyboard/src/core/lib/components/ui/panel/index.js`](../../../../../../../packages/storyboard/src/core/lib/components/ui/panel/index.js) provides part of this component's behavior.
- [`packages/storyboard/src/core/ui/Icon.jsx`](./Icon.jsx.md) provides part of this component's behavior.
- [`packages/storyboard/src/core/index.js`](../../../../../../../packages/storyboard/src/core/index.js) provides part of this component's behavior.

## Dependents

- No direct imports found outside this file.

## Notes

- These runtime UI files are adapters: they convert config, store state, or document events into visible toolbar and panel controls.
