# `packages/storyboard/src/core/ui/CommentsMenuButton.jsx`

<!--
source: packages/storyboard/src/core/ui/CommentsMenuButton.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Toggles comment mode from the toolbar. It reflects comment-mode state live and gates activation on comment authentication.

This keeps the comment affordance in the shell while delegating session and auth UI to the comments subsystem.

## Composition

```jsx
import { useState, useEffect } from 'react'
import { TriggerButton } from '../lib/components/ui/trigger-button/index.js'
import Icon from './Icon.jsx'
import { isAuthenticated } from '../comments/auth.js'
import { isCommentModeActive, toggleCommentMode, subscribeToCommentMode } from '../comments/commentMode.js'
import { openAuthModal } from '../comments/ui/authModal.js'

export default function CommentsMenuButton({ config = {}, data: _data, localOnly: _localOnly, tabindex }) {
  void _data
  void _localOnly
  const [commentModeOn, setCommentModeOn] = useState(isCommentModeActive())

  useEffect(() => {
    const unsubscribe = subscribeToCommentMode((active) => {
      setCommentModeOn(active)
    })
    return unsubscribe
  }, [])

  async function handleClick() {
    if (!isAuthenticated()) {
      const user = await openAuthModal()
      if (user) toggleCommentMode()
      return
    }
    toggleCommentMode()
  }

  return (
    <TriggerButton
      active={commentModeOn}
      size="icon-xl"
      aria-label={config.ariaLabel || 'Comments'}
      tabIndex={tabindex}
      onClick={handleClick}
    >
      <Icon name={config.icon || 'primer/comment'} size={16} {...(config.meta || {})} />
    </TriggerButton>
  )
}
```

The file exports a single default React component and keeps its behavior local to a focused UI concern: a trigger, menu, grouped control, or panel shell element.

## Dependencies

- `react` is imported directly by this component.
- [`packages/storyboard/src/core/lib/components/ui/trigger-button/index.js`](../../../../../../../packages/storyboard/src/core/lib/components/ui/trigger-button/index.js) provides part of this component's behavior.
- [`packages/storyboard/src/core/ui/Icon.jsx`](./Icon.jsx.md) provides part of this component's behavior.
- [`packages/storyboard/src/core/comments/auth.js`](../../../../../../../packages/storyboard/src/core/comments/auth.js) provides part of this component's behavior.
- [`packages/storyboard/src/core/comments/commentMode.js`](../../../../../../../packages/storyboard/src/core/comments/commentMode.js) provides part of this component's behavior.
- [`packages/storyboard/src/core/comments/ui/authModal.js`](../../../../../../../packages/storyboard/src/core/comments/ui/authModal.js) provides part of this component's behavior.

## Dependents

- No direct imports found outside this file.

## Notes

- These runtime UI files are adapters: they convert config, store state, or document events into visible toolbar and panel controls.
