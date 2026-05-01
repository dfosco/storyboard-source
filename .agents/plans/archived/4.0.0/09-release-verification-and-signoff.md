# Slice 07 — Release Verification and Sign-off

## Goal

Gate the 4.0.0 cut with automated, agent-browser, and manual verification before release notes/changelog sign-off.

## Automated gates

- `npm run lint`
- `npm run build`
- `npm run test`

## Coverage matrix

| Area | Must-cover checks |
|---|---|
| Paste rules (`t01`) | precedence, fallback parity, base-path same-origin, invalid clipboard payloads |
| Sticky markdown (`t02`) | toggle persistence, roundtrip mode changes, null-safe rendering |
| GitHub embeds (`t03`,`t04`) | parser matrix, `gh` present/missing, banner/link behavior, refresh states, token/no-token paths |
| Multi-page canvas (`t05`) | path IDs, basename collision prevention, selector deep-link persistence |
| Story widgets (`t06`) | discovery/indexing, render selection, compatibility fallback |
| Command palette (`t07`) | ranking determinism, keyboard navigation, provider filtering |
| Widget mode system | document-level Escape behavior, active/inactive lifecycle, cleanup, sticky/markdown/component/prototype mode exit behavior |
| Regression baseline | multiselect move/delete, comments auth/graphql, data-plugin watcher/HMR |

## Agent-browser scenarios

1. Paste-rule routing per configured pattern.
2. Sticky markdown toggle and text preservation.
3. GitHub embed paste + refresh with `gh` available.
4. Missing-`gh` banner behavior on paste and refresh.
5. Multi-page selector page switch + deep-link restore.
6. Story widget render stability in canvas.
7. Command palette fuzzy search and keyboard navigation.
8. Escape exits edit/interactive modes consistently across sticky, markdown, component, and prototype widgets.
9. Console and accessibility spot checks.

## Manual release checklist

- [ ] Fresh clone install/run sanity
- [ ] Existing 3.11-era data opens unchanged
- [ ] Branch base-path route behavior validated
- [ ] Missing `gh` banner appears bottom-centered with `https://github.com/cli/cli`
- [ ] GitHub refresh re-runs local fetch and re-triggers banner when `gh` missing
- [ ] No secret/token leakage in logs/UI/serialized payloads
- [ ] Multipage selector and deep links remain correct
- [ ] Story widget fallback path is documented and verified
- [ ] Command palette quality verified with mixed search targets
- [ ] Escape exits widget modes consistently (and iframe widgets retain click-outside fallback behavior)
- [ ] README/docs + changelog/release notes updated for 4.0 changes

## Go/No-Go

- [ ] All required automated checks pass
- [ ] Agent-browser scenario matrix passes (or only non-blocking, documented exceptions)
- [ ] Manual checklist has no unresolved release blockers
