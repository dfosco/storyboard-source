# Slice 06 — Command Palette Overhaul (`t07`)

## Goal

Replace the current command list/dropdown experience with a keyboard-first fuzzy command palette.

## Scope

- Keep existing command actions accessible.
- Add fuzzy providers for commands, prototypes/flows, canvases/pages, authors, and stories.
- Ensure deterministic ranking and keyboard navigation behavior.

## Key files

- `packages/core/src/CommandMenu.svelte`
- `packages/core/src/commandActions.js`
- `packages/core/src/CoreUIBar.svelte`
- `packages/core/src/viewfinder.js`

## Dependencies

- Requires multi-page canvas indexing (`t05`) for page-level canvas search.
- Requires story indexing (`t06`) for story search provider.

## Implementation checklist

- [ ] Build/replace palette UI container and input interaction loop.
- [ ] Add provider adapters for each searchable entity class.
- [ ] Implement ranking strategy and result metadata tags.
- [ ] Preserve arrow/enter/escape keyboard semantics.

## Acceptance criteria

- Palette reliably resolves commands and navigation targets from fuzzy input.
- Existing command actions remain available.

## Verification

### Automated
- [ ] Ranking determinism tests
- [ ] Keyboard navigation tests
- [ ] Provider inclusion/filtering tests

### Agent-browser
- [ ] Execute command/prototype/author/canvas/story targets through palette

### Manual
- [ ] Palette remains performant and predictable under larger datasets
