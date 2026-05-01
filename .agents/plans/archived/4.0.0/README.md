# 4.0.0 Plan Index (from #g087)

This directory replaces the single-file plan and splits work into feature-isolated slices so implementation can run as one coordinated pass with minimal cross-feature blocking.

## Execution order for one implementation run

1. `00-worktree-port-bindings.md` (step 0 — prerequisite infrastructure)
2. `01-contracts-and-compatibility.md` (must start before feature work)
3. `02-paste-rules.md`, `03-sticky-markdown.md`, `08-viewfinder-react-migration.md`, and `10-widget-mode-system.md` (can run in parallel)
4. `04-github-embeds-and-sync.md` (depends on paste rules)
5. `05-multi-page-canvas.md` and `06-story-widgets.md` (can run in parallel)
6. `07-command-palette.md` (depends on multi-page + story indexing)
7. `09-release-verification-and-signoff.md` (final gate)

## File map

- `00-worktree-port-bindings.md` — stable dev-server ports per worktree, hotel integration
- `01-contracts-and-compatibility.md` — schema, IDs, compatibility constraints
- `02-paste-rules.md` — `t01` config-controlled paste routing
- `03-sticky-markdown.md` — `t02` sticky markdown mode
- `04-github-embeds-and-sync.md` — `t03` + `t04` GitHub embeds, local `gh` fetch, refresh, banner guard
- `05-multi-page-canvas.md` — `t05` multipage canvas model
- `06-story-widgets.md` — `t06` story-backed component widgets
- `07-command-palette.md` — `t07` fuzzy command palette
- `08-viewfinder-react-migration.md` — migrate Viewfinder page from Svelte to React
- `09-release-verification-and-signoff.md` — automated + agent-browser + manual gates
- `10-widget-mode-system.md` — declarative widget mode API + Escape/read-only/prodMode enforcement

## Hard dependency edges

- `t01 -> t03`
- `t05 -> t07`
- `t06 -> t07`

## Global constraints

- Preserve backward compatibility for existing 3.11-era canvas/prototype data.
- Keep null/undefined-safe data reads in all UI paths.
- Keep branch base-path URL behavior correct in same-origin checks and routing.
- Never persist PAT or credentials in serialized canvas/widget payloads.
