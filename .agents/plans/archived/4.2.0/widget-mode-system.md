# Declarative Widget Mode System

## Rationale

Widgets currently have no consistent mode definition. Each widget handles focus, keyboard, and interaction modes ad-hoc, leading to:

- **Focus trapping** — terminal widgets trap focus and prevent canvas-level keyboard shortcuts (e.g. `Delete` to remove selected widgets). There's no clean escape path.
- **Inconsistent mode entry** — markdown enters edit mode in prod/read-only but can't persist changes. Prototypes enter interact mode on click without clear exit.
- **No mode awareness at canvas level** — the canvas doesn't know which mode a widget is in, so it can't enforce consistent behavior across selection, deletion, drag, and keyboard shortcuts.
- **Missing coverage** — newer widgets (terminal, story, codepen-embed, connectors) have no mode definition at all.

## Confirmed product direction

- Modes are declarative in `widgets.config.json` with IDs used directly in runtime.
- No per-widget `*mode.js` files.
- Default mode IDs: `view`, `edit`, `interact`.
  - `view` — widget is passive, canvas has full keyboard/mouse control
  - `edit` — widget is editable (text input, content modification)
  - `interact` — widget captures input (iframes, embeds, terminals). Escape returns to view.

- Mode availability is controlled by `prod: true|false`.
  - `edit` defaults to `prod: false` unless explicitly flipped.
  - non-edit modes default to `prod: true`.
- `?prodMode` must mirror production restrictions.
- Full mode state-machine API (not a narrow Escape hook only).

## Goal

Replace ad-hoc per-widget mode state with a shared declarative mode system that enforces read-only/prod restrictions, unifies Escape behavior, and gives the canvas awareness of widget modes for consistent keyboard/selection handling.

## Known issues this solves

1. **Terminal focus trapping** — terminal widgets in `interact` mode capture all keyboard input. When selected (single or multi-select), pressing `Delete` goes to the terminal instead of deleting the widget. The mode system will let the canvas know a widget is in `interact` mode and handle Escape → `view` transitions before routing keyboard shortcuts.

2. **No Escape path from terminals** — once you click into a terminal, there's no way to return focus to the canvas without clicking outside. The mode system will enforce `Escape` → exit `interact` → return to `view` mode.

3. **Markdown/sticky edit in read-only** — these widgets enter edit UI in prod/read-only but can't persist. Mode system gates `edit` mode entry.

4. **Connector interaction** — connectors have no mode definition and their selection/editing behavior is ad-hoc.

## Scope

### Declarative config contract
- Add per-widget `modes` declarations in `packages/core/widgets.config.json`.
- Extend loader/runtime accessors in `packages/react/src/canvas/widgets/widgetConfig.js`.

### Shared mode engine
- Introduce shared mode API:
  - `mode` — current mode ID
  - `canEnter(modeId)` — check if mode entry is allowed (respects prod/read-only)
  - `enter(modeId, reason?)` — enter a mode (e.g. click, double-click, keyboard)
  - `exit(to = 'view', reason?)` — exit to target mode
  - `toggle(modeId)` — toggle between view and the specified mode
- Centralize Escape handling through the mode engine.
- Emit mode change events so the canvas can react (e.g. suppress delete key when a widget is in `interact` mode).

### Runtime policy plumbing
- Pass read-only/prod/prodMode policy from `CanvasPage` into widgets.
- Enforce mode-entry restrictions in widget runtime (not only toolbar visibility).
- Canvas-level keyboard handler checks active widget mode before routing shortcuts.

### Widget coverage matrix

| Widget | Modes | Entry trigger | Exit trigger | Notes |
|--------|-------|---------------|--------------|-------|
| `sticky-note` | `view/edit` | double-click → edit | blur/Escape → view | Text editing |
| `markdown` | `view/edit` | double-click → edit | blur/Escape → view | Markdown editing |
| `prototype` | `view/edit/interact` | click → interact | Escape → view | iframe capture |
| `figma-embed` | `view/interact` | click → interact | Escape → view | iframe capture |
| `codepen-embed` | `view/interact` | click → interact | Escape → view | iframe capture |
| `story` | `view/interact` | click → interact | Escape → view | iframe capture |
| `component` | `view/interact` | click → interact | Escape → view | iframe capture |
| `terminal` | `view/interact` | click → interact | Escape → view | **Keyboard capture. Canvas must suppress Delete/Backspace/arrow keys in interact mode.** |
| `link-preview` | `view` | — | — | No interactive mode |
| `image` | `view` | — | — | No interactive mode |
| `connector` | `view/edit` | click → select, double-click → edit | click-outside/Escape → view | Control point editing |

### Mode transition rules

```
view ──click──→ interact  (gated by overlay if configured)
view ──dblclick──→ edit
edit ──Escape/blur──→ view
interact ──double-Escape──→ view  (first Escape goes to widget, second within 500ms exits)
interact ──click-outside──→ view
```

### Interact gate overlay

Widgets that capture input in `interact` mode can optionally show a **"Click to interact"** overlay in `view` mode. This prevents accidental focus capture — the user must explicitly click the overlay to enter interact mode.

Configured per widget in `widgets.config.json`:

```json
{
  "terminal": {
    "modes": ["view", "interact"],
    "interactGate": true,
    "interactGateLabel": "Click to start terminal"
  },
  "prototype": {
    "modes": ["view", "edit", "interact"],
    "interactGate": true,
    "interactGateLabel": "Click to interact"
  },
  "image": {
    "modes": ["view"],
    "interactGate": false
  }
}
```

- `interactGate: true` — shows overlay in view mode. Click enters interact mode.
- `interactGate: false` (default) — no overlay.
- `interactGateLabel` — custom label text (default: `"Click to interact"`).

The overlay is rendered by the shared mode engine (not per-widget). It reuses the existing `embedOverlay.module.css` styles (`interactOverlay` + `interactHint`). Widgets that already use this pattern (prototype, figma, codepen, story, component) will be migrated to the declarative config. Terminal gets the same overlay.

**Canvas keyboard routing:**
- `view` mode: all keyboard shortcuts active (Delete, Ctrl+C, arrows, etc.)
- `edit` mode: keyboard goes to widget, only Escape handled by canvas
- `interact` mode: ALL input goes to widget, only Escape handled by canvas

## Key files

- `packages/core/widgets.config.json`
- `packages/react/src/canvas/widgets/widgetConfig.js`
- `packages/react/src/canvas/CanvasPage.jsx`
- `packages/react/src/canvas/widgets/StickyNote.jsx`
- `packages/react/src/canvas/widgets/MarkdownBlock.jsx`
- `packages/react/src/canvas/widgets/ComponentWidget.jsx`
- `packages/react/src/canvas/widgets/StoryWidget.jsx`
- `packages/react/src/canvas/widgets/PrototypeEmbed.jsx`
- `packages/react/src/canvas/widgets/FigmaEmbed.jsx`
- `packages/react/src/canvas/widgets/CodePenEmbed.jsx`
- `packages/react/src/canvas/widgets/TerminalWidget.jsx`
- `packages/react/src/canvas/widgets/LinkPreview.jsx`
- `packages/react/src/canvas/widgets/ImageWidget.jsx`
- `packages/react/src/canvas/ConnectorRenderer.jsx` (or equivalent)

## Implementation checklist

- [ ] Add declarative `modes` contract + defaults to `widgets.config.json`.
- [ ] Add `interactGate` config — shared "Click to interact" overlay rendered by mode engine.
- [ ] Build shared mode state-machine runtime API (`useWidgetMode` hook).
- [ ] Integrate centralized Escape behavior into mode engine.
- [ ] Add canvas-level mode awareness (suppress keyboard shortcuts in edit/interact modes).
- [ ] Plumb read-only/prodMode parity into widget runtime.
- [ ] Migrate all widgets to use mode API (remove ad-hoc mode state and per-widget overlays).
- [ ] Terminal: add interact gate overlay + Escape → view transition.
- [ ] Connectors: define edit mode for control point manipulation.
- [ ] Preserve iframe click-outside fallback where Escape cannot bubble.

## Acceptance criteria

- Mode entry/exit behavior follows declared config for all widgets.
- Disallowed modes (e.g. `edit` in prod/prodMode by default) cannot be entered.
- Escape exits active non-view modes consistently across all widget types.
- No widget shows "fake edit mode" in read-only/prod contexts.
- Terminal widgets release focus on Escape — Delete key works on selected terminals in view mode.
- Canvas keyboard shortcuts are suppressed when any widget is in edit/interact mode.
- Connectors support mode-based editing.

## Verification

### Automated
- [ ] Mode state-machine tests (allowed/disallowed transitions, cleanup, Escape behavior)
- [ ] Prod/prodMode gating tests
- [ ] Widget integration tests for all widgets in coverage matrix
- [ ] Canvas keyboard routing tests (Delete suppressed in interact mode, active in view mode)

### Agent-browser
- [ ] Normal dev mode: validate allowed mode flows for each widget type
- [ ] `?prodMode`: validate blocked edit mode + allowed non-edit modes
- [ ] Escape behavior across all widgets (especially terminal)
- [ ] Multi-select + Delete with terminal in selection

### Manual
- [ ] Verify no misleading editable UI in prod/read-only
- [ ] Verify no regressions in canvas selection/drag/resize flows
- [ ] Verify terminal Escape exits interact mode cleanly
- [ ] Verify connector edit mode works
