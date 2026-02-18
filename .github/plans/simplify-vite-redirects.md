# Plan: Simplify vite.config.js redirect middleware

## Problem

The `base-redirect` plugin (lines 19–38 of `vite.config.js`) adds a custom middleware with two redirect rules:

1. **Trailing-slash redirect** — `/storyboard` → `/storyboard/`
2. **Base-path prepend** — any URL not starting with `/storyboard/`, `/@`, or `/node_modules/` gets `/storyboard` prepended

The question: is this complexity necessary, or does Vite already handle some/all of this?

## Analysis

### What Vite does natively (v7.3.1)
- Vite's `base` config **does not** redirect requests in the dev server — it only affects asset resolution and `import.meta.env.BASE_URL`.
- Vite's dev server does **not** prepend the base path to incoming requests or redirect missing-base URLs.

### What the codebase does correctly
- React Router uses `basename: import.meta.env.BASE_URL` — all internal navigation already includes the base path.
- Generouted's `<Link>` goes through React Router, so all links are correct.
- In-app navigation (`navigate('/issues/...')`) is relative to basename.

### When this middleware actually matters
- **Dev only** — it runs via `configureServer()` which only applies to the Vite dev server, not production builds.
- **Rule 1 (trailing slash)** — Useful when you type `localhost:1234/storyboard` manually. Without it you'd get a 404. This is a genuine convenience.
- **Rule 2 (base prepend)** — Catches `localhost:1234/issues` and redirects to `localhost:1234/storyboard/issues`. Only matters if you manually type a URL without the base prefix. Since all in-app links use the correct base, this only fires on manual browser-bar navigation.

### Can it be simplified?

**Yes, modestly.** The logic itself is reasonably tight, but the condition on line 29 is dense. Options:

#### Option A: Keep both rules, improve readability (recommended)
Refactor the dense conditional into clearer logic with named helpers or early returns. The behavior stays the same but becomes easier to understand.

#### Option B: Drop rule 2 (base-prepend), keep rule 1 (trailing slash)
Rule 2 is a "nice to have" for dev convenience. Dropping it means typing `localhost:1234/issues` would 404 instead of redirecting, which is a minor DX regression. Rule 1 (trailing slash) is more important to keep.

#### Option C: Remove the entire plugin
Rely on Vite's native behavior. This means `localhost:1234/storyboard` (no slash) would 404 and any URL without the base prefix would 404. Works fine if you always use in-app navigation, but makes the dev experience slightly rougher.

## Recommendation

**Option A** — the middleware serves a real purpose (Vite doesn't do this natively), but the code can be made more readable. The functionality is worth keeping for a smoother dev experience.

## Todos

1. **refactor-redirect-readability** — Refactor the `base-redirect` plugin for readability: extract the condition logic, add a brief comment explaining why this exists (dev-server-only, Vite doesn't redirect base paths natively).
