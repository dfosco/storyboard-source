# Command Palette Keyboard Navigation — Debugging Guide

## Problem

Arrow key navigation in the command palette doesn't work. Pressing ArrowDown scrolls the list instead of moving selection between items. Enter doesn't select items.

## What was tried and why it failed

### Attempt 1: Restore rAF focus fix (commit b5b98795)

**Hypothesis:** The search input wasn't getting focus, so keyboard events went to the scrollable container.

**Fix:** `requestAnimationFrame` → `getElementById('command-palette-search-input').focus()`

**Result:** Input gets focus, but arrow keys still don't move selection. The problem is event routing, not focus.

### Attempt 2: Document-level capture keyboard handler

**Hypothesis:** react-cmdk's `onKeyDown` on a wrapper div doesn't receive events from the headlessui Portal under React 19. Bypass it entirely with `document.addEventListener('keydown', handler, true)`.

**Fix:** Added `selectedIndex` state, document capture listener for ArrowDown/ArrowUp/Enter, passed `selected`/`onChangeSelected` to `<CommandPalette>`.

**Result:** Still didn't work. The capture listener fires, but react-cmdk's internal `SelectContext` and DOM-based `handleChangeSelected`/`handleSelect` have their own state that conflicts with external control.

### Why custom fixes keep failing

react-cmdk manages keyboard state through:
1. Internal `selected` state (integer index)
2. `document.querySelectorAll('.command-palette-list-item')` for DOM counting
3. `onKeyDown` on a wrapper div outside the headlessui Portal
4. `SelectContext` providing `selected` to `ListItem` for highlight CSS

Even when `selected`/`onChangeSelected` props are passed to override the internal state, the `handleSelect` (Enter key) function still queries the DOM directly and uses its own `selected` variable. The keyboard handler on the wrapper div is also still active and can conflict.

**The library wasn't designed for its keyboard handling to be replaced externally.**

## Current state (reset)

All custom keyboard/focus fixes have been removed. The file is restored to the state before any of my changes (commit `df4fee1b^`). This gives you the native react-cmdk experience.

## Recommended next steps

1. **Test native react-cmdk** — verify whether keyboard nav works out of the box in this reset state. If it does, the bug is in one of my fixes. If it doesn't, the bug predates my changes.

2. **If native doesn't work** — the root cause is likely React 19 + `@headlessui/react@1.7.19` incompatibility. Headless UI 1.7.x doesn't support React 19 (`peerDependencies: react "^16 || ^17 || ^18"`). The fix is to either:
   - **Replace `react-cmdk`** with [`cmdk`](https://github.com/pacocoursey/cmdk) by Pacocoursey/Vercel (React 19 native, actively maintained, no headless UI dependency)
   - **Upgrade `@headlessui/react`** to 2.x (supports React 19) — but this requires `react-cmdk` to also support it

3. **If native works** — the bug was introduced by my changes and the reset fixes it.
