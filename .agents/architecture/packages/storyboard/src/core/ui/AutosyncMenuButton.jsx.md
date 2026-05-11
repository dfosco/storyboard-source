# `packages/storyboard/src/core/ui/AutosyncMenuButton.jsx`

<!--
source: packages/storyboard/src/core/ui/AutosyncMenuButton.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Provides the dev-only autosync menu for choosing a target branch and enabling background sync for canvas or prototype changes. It is the toolbar face of the autosync HTTP API under `/_storyboard/autosync`.

The menu owns polling, branch protection checks, scope toggles, and lightweight status display, while delegating branch-selection UI to BranchSelect.

## Composition

```jsx
import './AutosyncMenuButton.css';
import { useState, useEffect, useRef, useCallback } from 'react'
import { TriggerButton } from '../lib/components/ui/trigger-button/index.js'
import * as DropdownMenu from '../lib/components/ui/dropdown-menu/index.js'
import Icon from './Icon.jsx'
import BranchSelect from './BranchSelect.jsx'

export default function AutosyncMenuButton({ config = {}, basePath = '/', tabindex = -1 }) {
  const apiBase = (basePath === '/' ? '' : basePath.replace(/\/$/, '')) + '/_storyboard/autosync'

  const [menuOpen, setMenuOpen] = useState(false)
  const [branches, setBranches] = useState([])
  const [_currentBranch, setCurrentBranch] = useState('')
  void _currentBranch
  const [selectedBranch, setSelectedBranch] = useState('')
  const [enabledScopes, setEnabledScopes] = useState({ canvas: false, prototype: false })
  const [lastSyncTime, setLastSyncTime] = useState(null)
  const [lastError, setLastError] = useState(null)
  const [lastErrorByScope, setLastErrorByScope] = useState({ canvas: null, prototype: null })
  const [syncing, setSyncing] = useState(false)
  const [syncingScope, setSyncingScope] = useState(null)
  const [loading, setLoading] = useState(false)

  const pollRef = useRef(null)
  const enabledScopesRef = useRef(enabledScopes)
  enabledScopesRef.current = enabledScopes

  function isProtectedBranch(name) {
    const normalized = String(name || '').toLowerCase()
    return normalized === 'main' || normalized === 'master'
  }

  function hasEnabled(scopes) {
    return scopes?.canvas || scopes?.prototype
  }

  const applyStatus = useCallback((data) => {
    const incomingScopes = data.enabledScopes
    let newScopes
    if (incomingScopes && typeof incomingScopes === 'object') {
      newScopes = { canvas: incomingScopes.canvas === true, prototype: incomingScopes.prototype === true }
    } else {
      newScopes = {
        canvas: data.enabled === true && data.scope === 'canvas',
        prototype: data.enabled === true && data.scope === 'prototype',
      }
    }
    setEnabledScopes(newScopes)
```

The file exports a single default React component and keeps its behavior local to a focused UI concern: a trigger, menu, grouped control, or panel shell element.

## Dependencies

- [`packages/storyboard/src/core/ui/AutosyncMenuButton.css`](../../../../../../../packages/storyboard/src/core/ui/AutosyncMenuButton.css) provides part of this component's behavior.
- `react` is imported directly by this component.
- [`packages/storyboard/src/core/lib/components/ui/trigger-button/index.js`](../../../../../../../packages/storyboard/src/core/lib/components/ui/trigger-button/index.js) provides part of this component's behavior.
- [`packages/storyboard/src/core/lib/components/ui/dropdown-menu/index.js`](../../../../../../../packages/storyboard/src/core/lib/components/ui/dropdown-menu/index.js) provides part of this component's behavior.
- [`packages/storyboard/src/core/ui/Icon.jsx`](./Icon.jsx.md) provides part of this component's behavior.
- [`packages/storyboard/src/core/ui/BranchSelect.jsx`](./BranchSelect.jsx.md) provides part of this component's behavior.

## Dependents

- No direct imports found outside this file.

## Notes

- These runtime UI files are adapters: they convert config, store state, or document events into visible toolbar and panel controls.
