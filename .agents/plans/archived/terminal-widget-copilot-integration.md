# Terminal Widget + Copilot CLI Canvas Integration

## Problem

Integrate a browser-based terminal into Storyboard canvases so users can trigger and steer Copilot CLI sessions directly from the canvas. This enables a workflow where canvas context (selected widgets, sticky notes, images) can feed into Copilot CLI prompts, and results can flow back as new canvas widgets.

## Feasibility Assessment

**ghostty-web** is a strong fit:
- xterm.js-compatible API, drop-in React integration
- ~400KB WASM bundle (acceptable for dev-only widget)
- Zero runtime dependencies
- Active maintenance (Coder uses it in Mux)

**Key constraint**: ghostty-web is a *frontend terminal emulator only*. It needs a WebSocket backend that spawns a PTY process. This means:
- **Dev-only is straightforward** — add a WebSocket PTY server to the Vite dev server plugin (`packages/core/src/vite/server-plugin.js`)
- **Prod would require a hosted backend** — out of scope for v1

## Approach

**Phase 1**: General-purpose terminal widget + Copilot CLI launcher (dev-only, shipped together)
**Phase 2**: Full canvas↔Copilot bidirectional integration (future)

## Architecture

```
┌─────────────────────────────────┐
│  Canvas (browser)               │
│  ┌───────────────────────────┐  │
│  │  TerminalWidget.jsx       │  │
│  │  ├─ ghostty-web Terminal  │  │
│  │  └─ WebSocket client      │  │
│  └───────────────────────────┘  │
└──────────────┬──────────────────┘
               │ ws://localhost:PORT/_storyboard/terminal/:sessionId
┌──────────────▼──────────────────┐
│  Vite Server Plugin             │
│  ├─ WebSocket upgrade handler   │
│  ├─ node-pty PTY spawn          │
│  └─ Session manager (per tab)   │
└─────────────────────────────────┘
```

## Todos

### Phase 1 — Terminal Widget (dev-only)

1. **pty-backend** — Add WebSocket PTY server to `packages/core/src/canvas/terminal-server.js`
   - Use `node-pty` to spawn shells
   - WebSocket upgrade on `/_storyboard/terminal/:sessionId`
   - Wire into `server-plugin.js` via Vite's `configureServer` hook
   - Session lifecycle: create on connect, destroy on disconnect
   - Resize support (SIGWINCH via cols/rows messages)

2. **widget-config** — Add `terminal` widget type to `widgets.config.json`
   - Props: `width`, `height`, `cwd` (optional working directory)
   - Features: clear, restart, copy-link, delete
   - Dev-only (no `prod: true` on features)

3. **widget-component** — Create `TerminalWidget.jsx` in `packages/react/src/canvas/widgets/`
   - Import ghostty-web (`init()` + `Terminal`)
   - Connect to WebSocket backend using widget ID as session ID
   - Handle resize via ResizeHandle (send cols/rows to backend)
   - Theme sync (use canvas theme for terminal colors)
   - Register in `widgetRegistry` (index.js)

4. **widget-styles** — Create `TerminalWidget.module.css`
   - Terminal container fills widget bounds
   - Focus/blur handling (canvas keyboard shortcuts vs terminal input)
   - Scrollbar styling to match canvas theme

5. **paste-rule** — Optional: add paste rule so pasting a shell command creates a terminal widget
   - Low priority, can skip for v1

### Phase 2 — Copilot CLI Integration

6. **copilot-launcher** — Add a "Run Copilot" toolbar action on the terminal widget
   - Sends `copilot` command to the terminal's PTY
   - Could pre-populate with context from selected widgets on the same canvas

7. **canvas-context-injection** — When launching Copilot from a terminal widget:
   - Read `.storyboard/.selectedwidgets.json` for current canvas state
   - Serialize relevant widget content (sticky note text, markdown, image descriptions)
   - Pass as initial prompt or piped stdin to `copilot`

8. **output-capture** — Monitor terminal output for structured markers
   - Copilot CLI could emit structured output (e.g., code blocks, file diffs)
   - Parse and offer "Add to canvas" actions for recognized output

### Phase 3 — Full Bidirectional Integration (future)

9. **canvas-copilot-bridge** — Purpose-built Copilot widget (not just a terminal)
   - Prompt input field with canvas context auto-attached
   - Streaming response display
   - One-click "create sticky from response" / "create markdown from response"

10. **multi-agent-canvas** — Multiple terminal widgets on one canvas
    - Each running its own Copilot session
    - Shared canvas context, independent sessions

## Dependencies & Risks

| Risk | Mitigation |
|------|-----------|
| `node-pty` requires native compilation | It's widely used (VS Code uses it). Add to `optionalDependencies` so install doesn't fail on unsupported platforms |
| ghostty-web WASM bundle size (~400KB) | Lazy-load only when a terminal widget is on the canvas. Dev-only so not in prod bundle |
| Keyboard focus conflicts (canvas shortcuts vs terminal input) | Terminal widget captures focus on click, releases on Escape or click-outside. Similar to how markdown edit mode works |
| Security: PTY gives full shell access | Dev-only, same trust model as the Vite dev server itself |
| ghostty-web maturity | xterm.js is a proven fallback if ghostty-web has issues. API is compatible so switching is trivial |

## Package Changes

- **New dependency**: `ghostty-web` (frontend, lazy-loaded)
- **New dependency**: `node-pty` (backend, optional, dev-only)
- **Modified**: `packages/core/src/vite/server-plugin.js` (WebSocket upgrade)
- **Modified**: `packages/core/widgets.config.json` (new widget type)
- **Modified**: `packages/react/src/canvas/widgets/index.js` (registry)
- **New files**: `terminal-server.js`, `TerminalWidget.jsx`, `TerminalWidget.module.css`

## Open Questions

1. **ghostty-web vs xterm.js**: ghostty-web is newer and shinier but xterm.js is battle-tested. Worth prototyping with ghostty-web first since the API is compatible — easy to swap.
2. **Session persistence**: Should terminal sessions survive page reload (reconnect to existing PTY)? Adds complexity but is very useful.
3. **Multi-tab**: Each browser tab gets its own PTY? Or shared sessions via session ID?
4. **CWD default**: Should the terminal widget default to the repo root, or the canvas directory?
