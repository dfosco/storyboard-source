# Slice 03 — GitHub Embeds + Local Refresh (`t03`, `t04`)

## Goal

Provide rich GitHub link embeds with local-first `gh` fetching, explicit refresh, and clear UX when GitHub CLI is unavailable.

## Scope

- Parse issue, discussion, and comment URLs.
- Create/render rich GitHub embed cards.
- On initial paste, fetch metadata through local `gh` CLI.
- Add embed refresh button that re-runs local `gh` fetch.
- Guard all fetch entry points with `gh` availability check.
- If `gh` is missing, show a small bottom-centered install banner with link to `https://github.com/cli/cli`.

## Key files

- `packages/react/src/canvas/widgets/LinkPreview.jsx` (or new GitHub embed widget)
- `packages/react/src/canvas/CanvasPage.jsx` (paste + banner trigger surface)
- `packages/core/src/comments/auth.js`
- `packages/core/src/comments/graphql.js`
- `packages/core/src/comments/api.js`

## Implementation checklist

- [ ] Add URL classifier for issue/discussion/comment links.
- [ ] Add `gh` availability probe utility.
- [ ] Use `gh` output to hydrate embed snapshot (`title`, `body`, `authors`, `createdAt`, `updatedAt` + context).
- [ ] Add per-embed refresh action that re-runs `gh`.
- [ ] Add bottom-centered missing-`gh` banner with CLI repo link.
- [ ] Re-trigger the banner on refresh attempts when `gh` is absent.
- [ ] Ensure PAT/token material is never persisted to canvas/widget payload.

## Acceptance criteria

- Supported GitHub URLs paste into rich embeds.
- Refresh button re-fetches content locally via `gh`.
- Missing `gh` consistently shows install banner with `https://github.com/cli/cli`.
- Public links still degrade gracefully without PAT.

## Verification

### Automated
- [ ] URL parser matrix tests
- [ ] `gh` present/missing guard-path tests
- [ ] Banner trigger + link-target tests
- [ ] Refresh action state tests
- [ ] Token/no-token private/public path tests

### Agent-browser
- [ ] Paste supported GitHub URL and verify rich metadata
- [ ] Click refresh and verify metadata refresh flow
- [ ] Run with `gh` unavailable and verify install banner appears on paste and refresh

### Manual
- [ ] Banner appears bottom-centered with repo link
- [ ] Refresh UX is clear and repeatable
- [ ] No secret/token leakage in files/logs/UI
