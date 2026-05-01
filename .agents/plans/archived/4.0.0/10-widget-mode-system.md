# Slice 08 — Declarative Widget Mode API

## Rationale

- Escape-only handling is too narrow for 4.0.
- Current issue to address: widgets can enter mode UIs in prod/read-only contexts (example: markdown enters edit UI but does not truly edit/persist).

## Confirmed product direction

- Modes are declarative in `widgets.config.json` with IDs used directly in runtime.
- No per-widget `*mode.js` files.
- Default mode IDs: `view`, `edit`, `interact`, `expand`.
- Mode availability is controlled by `prod: true|false`.
  - `edit` defaults to `prod: false` unless explicitly flipped.
  - non-edit modes default to `prod: true`.
- `?prodMode` must mirror production restrictions.
- Full mode state-machine API (not a narrow Escape hook only).

## Goal

Replace ad-hoc per-widget mode state with a shared declarative mode system that enforces read-only/prod restrictions and unifies Escape behavior.

## Scope

### Declarative config contract
- Add per-widget `modes` declarations in `packages/core/widgets.config.json`.
- Extend loader/runtime accessors in `packages/react/src/canvas/widgets/widgetConfig.js`.

### Shared mode engine
- Introduce shared mode API:
  - `mode`
  - `canEnter(modeId)`
  - `enter(modeId, reason?)`
  - `exit(to = 'view', reason?)`
  - `toggle(modeId)`
- Centralize Escape handling through the mode engine.

### Runtime policy plumbing
- Pass read-only/prod/prodMode policy from `CanvasPage` into widgets.
- Enforce mode-entry restrictions in widget runtime (not only toolbar visibility).

### Widget migration (required now)
- `sticky-note`: `view/edit`
- `markdown`: `view/edit`
- `component`: `view/interact`
- `prototype`: `view/edit/interact/expand`
- `figma-embed`: `view/interact/expand`
- `link-preview`: `view`
- `image`: `view`

## Key files

- `packages/core/widgets.config.json`
- `packages/react/src/canvas/widgets/widgetConfig.js`
- `packages/react/src/canvas/CanvasPage.jsx`
- `packages/react/src/canvas/widgets/StickyNote.jsx`
- `packages/react/src/canvas/widgets/MarkdownBlock.jsx`
- `packages/react/src/canvas/widgets/ComponentWidget.jsx`
- `packages/react/src/canvas/widgets/PrototypeEmbed.jsx`
- `packages/react/src/canvas/widgets/FigmaEmbed.jsx`
- `packages/react/src/canvas/widgets/LinkPreview.jsx`
- `packages/react/src/canvas/widgets/ImageWidget.jsx`

## Implementation checklist

- [ ] Add declarative `modes` contract + defaults.
- [ ] Build shared mode state-machine runtime API.
- [ ] Integrate centralized Escape behavior into mode engine.
- [ ] Plumb read-only/prodMode parity into widget runtime.
- [ ] Migrate scoped widgets and remove conflicting inline mode handlers.
- [ ] Preserve iframe click-outside fallback where Escape cannot bubble.

## Acceptance criteria

- Mode entry/exit behavior follows declared config for all scoped widgets.
- Disallowed modes (e.g. `edit` in prod/prodMode by default) cannot be entered.
- Escape exits active non-view modes consistently.
- No widget shows “fake edit mode” in read-only/prod contexts.

## Verification

### Automated
- [ ] Mode state-machine tests (allowed/disallowed transitions, cleanup, Escape behavior)
- [ ] Prod/prodMode gating tests
- [ ] Widget integration tests for all scoped widgets

### Agent-browser
- [ ] Normal dev mode: validate allowed mode flows
- [ ] `?prodMode`: validate blocked edit mode + allowed non-edit modes
- [ ] Escape behavior across all migrated widgets

### Manual
- [ ] Verify no misleading editable UI in prod/read-only
- [ ] Verify no regressions in canvas selection/drag/resize flows
