# `packages/storyboard/src/core/ui/PwaInstallBanner.jsx`

<!--
source: packages/storyboard/src/core/ui/PwaInstallBanner.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Displays the mobile-only install prompt for the Storyboard PWA. It captures the browser's deferred install event, hides itself when inappropriate, and persists dismissals.

The banner sits outside the main toolbar interactions but lives in the same UI shell so mobile install affordance is always available from the runtime root.

## Composition

```jsx
/**
 * PwaInstallBanner — mobile-only "Add to Home Screen" prompt.
 *
 * Listens for the `beforeinstallprompt` event (Chrome/Edge) and shows a
 * dismissible banner. Never shows on desktop or when already installed.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import './PwaInstallBanner.css'
import { isMobile, isTouchDevice, subscribeToMobile } from '../utils/mobileViewport.js'

const DISMISS_KEY = 'sb-pwa-install-dismissed'

function isStandalone() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

function isDismissed() {
  try { return localStorage.getItem(DISMISS_KEY) === '1' } catch { return false }
}

const bannerStyle = {
  position: 'fixed',
  bottom: '5rem',
  left: '1rem',
  right: '1rem',
  zIndex: 10000,
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1rem',
  background: 'var(--bgColor-default, #0d1117)',
  color: 'var(--fgColor-default, #e6edf3)',
  border: '1px solid var(--borderColor-default, #30363d)',
  borderRadius: '0.75rem',
  fontFamily: '"Mona Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
  fontSize: '0.8125rem',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
}

const btnBase = {
  border: 'none',
  borderRadius: '0.375rem',
  padding: '0.375rem 0.75rem',
```

The file exports a single default React component and keeps its behavior local to a focused UI concern: a trigger, menu, grouped control, or panel shell element.

## Dependencies

- `react` is imported directly by this component.
- [`packages/storyboard/src/core/ui/PwaInstallBanner.css`](../../../../../../../packages/storyboard/src/core/ui/PwaInstallBanner.css) provides part of this component's behavior.
- [`packages/storyboard/src/core/utils/mobileViewport.js`](../../../../../../../packages/storyboard/src/core/utils/mobileViewport.js) provides part of this component's behavior.

## Dependents

- No direct imports found outside this file.

## Notes

- These runtime UI files are adapters: they convert config, store state, or document events into visible toolbar and panel controls.
