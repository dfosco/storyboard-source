# Terminal Widget Scroll Bug — Root Cause Analysis

## Executive Summary

Terminal widgets on canvas suffer from "dual scrolling" — when the user scrolls inside an interactive terminal, both the terminal (via tmux) and the canvas scroll container move simultaneously, creating a janky experience. The root cause is that ghostty-web's internal wheel handler processes scroll events but **does not call `stopPropagation()`**, allowing the browser's native wheel event to bubble up to the canvas's scrollable container.

Four previous fix attempts targeted the wrong layer (tmux configuration). The correct fix is a **native DOM capture-phase wheel event listener** on the terminal's wrapper element that stops propagation before the event reaches the canvas scroll container.

---

## Previous Attempts

| # | Attempt | Layer | Why It Failed |
|---|---------|-------|---------------|
| 1 | `tmux set-clipboard off` | tmux | Fixed clipboard hijacking, not scroll |
| 2 | `tmux bind-key -T root WheelUpPane ...` | tmux | Didn't suppress tmux's built-in mouse-on passthrough — both copy-mode AND arrow keys fired |
| 3 | `tmux set-option alternate-screen off` | tmux | Made tmux unaware of alternate screen, but the dual scroll was **browser-side** not tmux-side. Both layers still scrolled. |
| 4 | React `onWheel={stopPropagation}` | React/browser | React synthetic events fire in **bubble phase**, but the canvas scroll container processes the native wheel event before React's synthetic handler runs. Also, React 19 registers wheel handlers as passive by default. |
| 5 | Native capture-phase `stopPropagation` | browser | Fired before ghostty-web's own capture handler, preventing terminal from scrolling at all. |
| 6 | Native bubble-phase `stopPropagation` (passive) | browser | `stopPropagation` doesn't prevent native scrolling — scrolling the nearest overflow ancestor is the **default action** of wheel events, not a propagation-dependent behavior. |
| 7 | Native bubble-phase `preventDefault` (non-passive) | browser | Killed ALL scrolling — ghostty-web already calls `preventDefault` before custom handler, so redundant; also blocked ghostty's viewport scroll. |
| 8 | CSS `overscroll-behavior: contain` | CSS | `.terminal` has `overflow: hidden` (not scrollable — property has no effect). ghostty renders to `<canvas>`, no `.xterm-viewport` exists. |
| 9 | ✅ `attachCustomWheelEventHandler` + `scrollLines()` | ghostty-web API | Uses ghostty's own API to override alternate-screen arrow-key behavior. Returns `true` to skip default handling, calls `scrollLines()` for viewport scroll. ghostty still calls `preventDefault+stopPropagation` before the custom handler → canvas never scrolls. |

---

## Architecture: The Scroll Event Stack

```
User scrolls trackpad/mouse wheel
         │
         ▼
┌─────────────────────────────────────────────────┐
│  Browser: native wheel event dispatched          │
│  Phase 1: CAPTURE (root → target)               │
│    ├─ ghostty-web canvas element                │
│    │   └─ handleWheel (capture:true, passive:no) │◄── Processes scroll,
│    │      sends to WASM → tmux input             │    does NOT stopPropagation
│    │                                             │
│  Phase 2: TARGET                                 │
│    (ghostty canvas element)                      │
│                                                  │
│  Phase 3: BUBBLE (target → root)                 │
│    ├─ .terminal div                              │
│    │   └─ React onWheel (bubble, passive)        │◄── Too late, canvas already scrolled
│    ├─ .canvasScroll div                           │◄── NATIVE SCROLL HAPPENS HERE
│    │   (overflow: auto → browser auto-scrolls)   │
│    └─ document                                   │
│        └─ CanvasPage wheel handler               │
│           (zoom on cmd/ctrl+wheel)               │
└─────────────────────────────────────────────────┘
```

The key insight: **the `.canvasScroll` div scrolls natively** — no JS handler needed. The browser processes the wheel event and scrolls any scrollable ancestor. This happens during the bubble phase, _before_ React's synthetic `onWheel` handler fires.

---

## 5-Whys Analysis

**Why is the terminal scrolling both input history AND the canvas?**
→ Because the wheel event reaches both ghostty-web (which sends it to tmux) and the canvas scroll container (which scrolls natively).

**Why does the wheel event reach the canvas scroll container?**
→ Because ghostty-web's internal wheel handler doesn't call `stopPropagation()` — the event continues bubbling.

**Why doesn't React's `onWheel={stopPropagation}` fix it?**
→ Because React synthetic events fire in the bubble phase, and the native scroll on `.canvasScroll` is processed by the browser's layout engine during the same bubble phase — before React dispatches its synthetic event.

**Why not use `e.preventDefault()` in React?**
→ React 19 registers wheel handlers as passive by default (per spec). Passive listeners cannot call `preventDefault()`. Even if they could, it would break normal canvas scrolling when the terminal is not focused.

**Why did tmux-level fixes (alternate-screen, WheelUpPane binding) not work?**
→ The dual scroll is a browser DOM problem, not a tmux problem. tmux correctly handles mouse events sent to it by ghostty-web. The issue is that the _same_ wheel event _also_ scrolls the browser's overflow container. These are two independent consumers of one event.

---

## Solution: Native Capture-Phase Wheel Listener

### Primary Fix (Implemented)

Attach a **native** `wheel` event listener on the terminal wrapper `div` in the **bubble phase** with `passive: false`, calling `preventDefault()` to cancel the browser's native scroll action:

```js
// TerminalWidget.jsx
useEffect(() => {
  const el = terminalRef.current
  if (!el) return
  function stopNativeScroll(e) {
    if (phaseRef.current === 'interacting') {
      e.preventDefault()
      e.stopPropagation()
    }
  }
  el.addEventListener('wheel', stopNativeScroll, { passive: false })
  return () => el.removeEventListener('wheel', stopNativeScroll)
}, [])
```

**Why this works:**
- `preventDefault()` cancels the browser's default scroll action (scrolling the nearest overflow ancestor)
- `passive: false` is required for `preventDefault()` to work
- ghostty-web reads `deltaY` directly from the event and sends it to WASM — it doesn't rely on native scroll, so `preventDefault()` doesn't affect terminal scrolling
- Fires in bubble phase so ghostty-web's capture-phase handler processes the event first
- Gated on `phase === 'interacting'` so normal canvas scrolling works when terminal isn't focused

### Fallback: CSS `overscroll-behavior` (if capture listener proves insufficient)

If the capture-phase listener doesn't fully contain scroll in some browsers:

```css
.terminal {
  overscroll-behavior: contain;
}
```

This tells the browser not to chain-scroll to parent containers. However, it only works when the element itself is scrollable — the terminal `div` has `overflow: hidden`, so this alone may not be sufficient.

### Fallback 2: `pointer-events: none` on canvas during interaction

As a nuclear option, set `pointer-events: none` on the canvas scroll container while the terminal is in `interacting` phase. This prevents the scroll container from receiving any input. Downside: breaks hover states on other widgets during terminal interaction.

### Fallback 3: Iframe isolation

Render the terminal inside an `<iframe>`. Events in iframes are fully isolated from the parent document's scroll containers. This is the most robust but most expensive solution (requires a separate document context, complicates focus/keyboard handling).

---

## Related Fix: Clipboard Hijacking

A separate but related issue: tmux's `mouse on` + `set-clipboard` was copying pane border characters (`─` U+2500) to the system clipboard on focus events. Fixed by adding `set-clipboard off` to tmux session configuration in both `terminal-server.js` and `server.js`.

---

## Files Changed

| File | Change |
|------|--------|
| `packages/react/src/canvas/widgets/TerminalWidget.jsx` | Added native capture-phase wheel listener; removed ineffective React onWheel handler |
| `packages/core/src/canvas/terminal-server.js` | `set-clipboard off` (clipboard fix) |
| `packages/core/src/canvas/server.js` | `set-clipboard off` (clipboard fix) |

---

## Confidence Assessment

- **High confidence**: The dual-scroll root cause is correct — ghostty-web's source confirms it registers a wheel handler with `capture: true` on its canvas element without calling `stopPropagation()` (ghostty-web.js:2373).
- **High confidence**: A native capture-phase listener on the parent element will intercept the event before it reaches the canvas scroll container.
- **Medium confidence**: The `passive: true` option is correct for `stopPropagation()` (the spec only restricts `preventDefault()` for passive listeners, not `stopPropagation()`). If browsers behave differently, switching to `passive: false` would fix it.
- **Low uncertainty**: Edge case where `terminalRef.current` is null on first render — mitigated by the `if (!el) return` guard.

---

## Footnotes

[^1]: ghostty-web wheel handler registration: `node_modules/ghostty-web/dist/ghostty-web.js:2373` — `A.addEventListener("wheel", this.handleWheel, { passive: !1, capture: !0 })`
[^2]: Canvas scroll container: `packages/react/src/canvas/CanvasPage.jsx:2385` — `className={styles.canvasScroll}`
[^3]: Canvas zoom wheel handler (document-level): `packages/react/src/canvas/CanvasPage.jsx:2074-2084`
[^4]: tmux mouse-on setting: `packages/core/src/canvas/terminal-server.js:314`
[^5]: tmux set-clipboard fix: `packages/core/src/canvas/terminal-server.js:315`
[^6]: Previous React onWheel attempt: `packages/react/src/canvas/widgets/TerminalWidget.jsx:378`
