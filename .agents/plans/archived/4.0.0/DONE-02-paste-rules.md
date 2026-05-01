# Slice 01 — Config-Controlled Paste Rules (`t01`)

## Goal

Move paste handling to a deterministic, config-driven router keyed by URL/content rules.

## Scope

- Extract paste decision logic from `CanvasPage.jsx` into a rule engine.
- Preserve current default behavior unless explicitly overridden by config.
- Support branch-prefixed base paths in same-origin detection.

## Key files

- `packages/react/src/canvas/CanvasPage.jsx`
- `packages/react/src/canvas/widgets/*` (creation paths)
- `storyboard.config.json`

## Implementation checklist

- [ ] Define ordered paste rules and precedence.
- [ ] Map defaults: image, Figma, same-origin prototype, markdown text, fallback URL.
- [ ] Add config override hooks per URL/content pattern.
- [ ] Keep null-safe clipboard handling.

## Acceptance criteria

- Paste outcomes are deterministic and config-controlled.
- Legacy behavior remains default with no config changes.

## Verification

### Automated
- [ ] Rule precedence tests
- [ ] Fallback parity tests against current behavior
- [ ] Branch base-path same-origin tests
- [ ] Invalid clipboard payload tests

### Agent-browser
- [ ] Paste URLs matching each rule and confirm widget type
- [ ] Paste unmatched URL and confirm fallback path

### Manual
- [ ] Existing image/Figma/prototype/URL flows still work by default
