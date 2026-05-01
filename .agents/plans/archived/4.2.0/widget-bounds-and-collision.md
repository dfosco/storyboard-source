# Widget Bounds Metadata & Collision Simplification

## Problem

The `storyboard canvas read` CLI doesn't expose computed bounds (width, height, startX/endX, startY/endY), making it harder for agents and scripts to reason about widget positions. Collision detection in `collision.js` is more complex than needed.

## Approach

### Part 1: Add bounds to CLI read output

Enrich `canvasRead.js` with computed bounds fields for each widget:
- `width`, `height` — from props or DEFAULT_SIZES fallback
- `startX`, `startY` — same as position.x/y (top-left origin)
- `endX` = startX + width, `endY` = startY + height

**CLI-only** — NOT added to the server `/read` response to avoid computed fields leaking into JSONL via read→update cycles.

Extract default sizes from `widgets.config.json` so ALL widget types are covered (not just the subset in collision.js's DEFAULT_SIZES).

### Part 2: Centralize default sizes

Create a shared `getDefaultSize(type)` utility in collision.js that reads from `widgets.config.json` defaults. Update `DEFAULT_SIZES` to cover all widget types including `story`, `codepen-embed`.

### Part 3: Simplify collision.js

Replace the two-phase (right then down) algorithm with:
1. Check if target rect overlaps any widget
2. Find the **max endX** among all colliders (not just first)
3. Move target X to `maxEndX + gridSize`, snap to grid
4. Loop until resolved or maxIterations
5. Keep down fallback as escape hatch when horizontal iterations exhausted

### Part 4: Update canvas skill SKILL.md

Update collision detection reference to reflect simplified algorithm and note that bounds are available in read output.

## Todos

- `bounds-in-cli` — Add width/height/startX/endX/startY/endY to `canvasRead.js` output
- `centralize-sizes` — Update DEFAULT_SIZES in collision.js to cover all widget types from config
- `simplify-collision` — Rewrite findFreePosition to use max-endX approach
- `update-tests` — Update collision.test.js for new behavior
- `update-skill` — Update SKILL.md with new bounds output and collision docs
