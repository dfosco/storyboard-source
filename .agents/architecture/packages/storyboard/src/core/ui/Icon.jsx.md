# `packages/storyboard/src/core/ui/Icon.jsx`

<!--
source: packages/storyboard/src/core/ui/Icon.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

Shared icon renderer for the core UI shell. It unifies custom Storyboard glyphs, Primer octicons, Feather icons, and manually registered Iconoir assets behind one namespaced API.

Because tool config and UI components can all request icons by string name, this file is a key compatibility layer between declarative config and rendered chrome.

## Composition

```jsx
/**
 * Icon — renders icons from multiple sources using namespaced names.
 *
 *   primer/    → Primer Octicons (fill-based)
 *   feather/   → Feather Icons (stroke-based)
 *   iconoir/   → Iconoir (stroke-based, manually registered)
 *   (no prefix) → Custom (folder, prototype, canvas, component, etc.)
 *
 * Usage:
 *   <Icon name="primer/repo" />
 *   <Icon name="feather/flag" size={16} />
 *   <Icon name="iconoir/key-command" size={16} strokeWeight={2} />
 *   <Icon name="prototype" size={14} />
 *   <Icon name="feather/tablet" rotate={90} />
 *   <Icon name="primer/lock" offsetX={1} offsetY={-1} />
 *   <Icon name="feather/arrow-right" flipX />
 */

/* ─── Custom SVG paths (fill-based, no namespace prefix) ─── */

const customIcons = {
  'home': {
    viewBox: '0 0 16 16',
    path: 'M6.906.664a1.749 1.749 0 0 1 2.187 0l5.25 4.2c.415.332.657.835.657 1.367v7.019A1.75 1.75 0 0 1 13.25 15h-3.5a.75.75 0 0 1-.75-.75V9H7v5.25a.75.75 0 0 1-.75.75h-3.5A1.75 1.75 0 0 1 1 13.25V6.23c0-.531.242-1.034.657-1.366l5.25-4.2Zm1.25 1.171a.25.25 0 0 0-.312 0l-5.25 4.2a.25.25 0 0 0-.094.196v7.019c0 .138.112.25.25.25H5.5V8.25a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 .75.75v5.25h2.75a.25.25 0 0 0 .25-.25V6.23a.25.25 0 0 0-.094-.195Z',
  },
  'folder': {
    viewBox: '0 0 24 24',
    path: 'M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h5.175q.4 0 .763.15t.637.425L12 6h8q.825 0 1.413.588T22 8v10q0 .825-.587 1.413T20 20z',
  },
  'folder-open': {
    viewBox: '0 0 24 24',
    path: 'M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h5.175q.4 0 .763.15t.637.425L12 6h9q.425 0 .713.288T22 7t-.288.713T21 8H7.85q-1.55 0-2.7.975T4 11.45V18l1.975-6.575q.2-.65.738-1.037T7.9 10h12.9q1.025 0 1.613.813t.312 1.762l-1.8 6q-.2.65-.737 1.038T19 20z',
  },
  // CollageFrame icon (from PrototypeEmbed widget title bar)
  'prototype': {
    viewBox: '0 0 24 24',
    strokePaths: [
      'M19.4 20H4.6C4.26863 20 4 19.7314 4 19.4V4.6C4 4.26863 4.26863 4 4.6 4H19.4C19.7314 4 20 4.26863 20 4.6V19.4C20 19.7314 19.7314 20 19.4 20Z',
      'M11 12V4',
      'M4 12H20',
    ],
  },
  // Smiley face icon (from assets/icons/canvas.svg)
  'canvas': {
    viewBox: '0 0 28 23',
    strokeRect: { x: 1, y: 1, width: 26, height: 21, rx: 7 },
    fillPaths: [
      'M17.8421 12.9776V12.9788L17.8409 12.9812C18.2386 12.451 18.9901 12.3434 19.5204 12.7409C20.0506 13.1385 20.1582 13.8901 19.7606 14.4204L18.8008 13.7008C19.7416 14.4064 19.7606 14.4209 19.7606 14.4215L19.7583 14.4239C19.7573 14.4252 19.756 14.427 19.7548 14.4286C19.7524 14.4317 19.7499 14.436 19.7466 14.4403C19.7399 14.449 19.7311 14.4601 19.7208 14.4731C19.7001 14.4992 19.6715 14.5332 19.6364 14.5751C19.566 14.6589 19.4665 14.7734 19.3387 14.9067C19.0842 15.1723 18.712 15.5216 18.2312 15.8713C17.2736 16.5677 15.831 17.3011 14.0003 17.3011C12.1695 17.3011 10.727 16.5677 9.76938 15.8713C9.28854 15.5216 8.91634 15.1723 8.66184 14.9067C8.53409 14.7734 8.43453 14.6589 8.36415 14.5751C8.32905 14.5332 8.30044 14.4992 8.27977 14.4731C8.26946 14.4601 8.26066 14.449 8.25398 14.4403C8.25066 14.436 8.24819 14.4317 8.24578 14.4286C8.24457 14.427 8.24325 14.4252 8.24226 14.4239L8.23992 14.4215C8.24001 14.4209 8.25896 14.4064 9.19979 13.7008L8.23992 14.4204C7.8424 13.8901 7.94999 13.1385 8.48018 12.7409C9.01029 12.3435 9.76077 12.4513 10.1585 12.9812L10.1597 12.98L10.1585 12.9776H10.1573C10.1583 12.9789 10.1602 12.9801 10.162 12.9823C10.1691 12.9914 10.182 13.0091 10.2018 13.0327C10.2416 13.08 10.3064 13.1534 10.394 13.2449C10.5708 13.4293 10.8366 13.6804 11.1805 13.9305C11.873 14.4341 12.8308 14.9009 14.0003 14.9009C15.1698 14.9009 16.1276 14.4341 16.8201 13.9305C17.164 13.6804 17.4298 13.4293 17.6065 13.2449C17.6942 13.1534 17.759 13.08 17.7987 13.0327C17.8186 13.0091 17.8314 12.9914 17.8386 12.9823L17.8421 12.9776Z',
```

The file exports a single default React component and keeps its behavior local to a focused UI concern: a trigger, menu, grouped control, or panel shell element.

## Dependencies

- `@primer/octicons` is imported directly by this component.
- `feather-icons` is imported directly by this component.

## Dependents

- No direct imports found outside this file.

## Notes

- These runtime UI files are adapters: they convert config, store state, or document events into visible toolbar and panel controls.
