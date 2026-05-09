---
"@dfosco/storyboard": minor
---

Browser-side guards for the cross-repo branch-mixing bug class:

- **`hashPreserver`** now passes through clicks targeting a different
  `/branch--<x>/` than the current base. Lets the browser do a full
  navigation through the proxy instead of feeding a foreign path into
  the basename-aware router (which would produce
  `/branch--A/branch--B/...`).
- **`localStorage` keys** are now namespaced as
  `storyboard:${devDomain}:${branch}:` derived from `window.location.hostname`
  and `import.meta.env.BASE_URL`. Two repos sharing `storyboard.localhost`
  (or one repo with multiple branch tabs) can no longer leak history
  snapshots, hide-mode state, or pending-navigation tokens across apps.
- A one-shot migration on first import drops legacy un-namespaced
  `storyboard:*` keys to prevent stale state from being restored after
  upgrade.
- `STORAGE_PREFIX` is now exported for tooling that needs to introspect
  the active namespace.
