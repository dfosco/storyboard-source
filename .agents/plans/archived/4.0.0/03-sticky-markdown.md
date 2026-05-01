# Slice 02 — Sticky Markdown Toggle (`t02`)

## Goal

Allow sticky notes to switch between plain-text edit mode and markdown render mode.

## Scope

- Add sticky-level render mode flag.
- Keep plain-text editing as baseline.
- Use existing markdown rendering infrastructure where possible.

## Key files

- `packages/react/src/canvas/widgets/StickyNote.jsx`
- `packages/react/src/canvas/widgets/MarkdownBlock.jsx`
- widget control wiring (`widgetConfig` / widget chrome actions)

## Implementation checklist

- [ ] Add sticky markdown mode property.
- [ ] Add UI toggle in widget controls.
- [ ] Ensure mode switching does not lose raw text.
- [ ] Keep null/empty rendering safe.

## Acceptance criteria

- User can switch sticky between raw text and markdown rendering.
- Toggling is reversible without data loss.

## Verification

### Automated
- [ ] Toggle persistence tests
- [ ] Text-to-markdown-to-text roundtrip tests
- [ ] Empty/null markdown rendering tests

### Agent-browser
- [ ] Create sticky, enter markdown, toggle on/off, verify rendering/editing behavior

### Manual
- [ ] Sticky editing UX remains stable when mode changes
