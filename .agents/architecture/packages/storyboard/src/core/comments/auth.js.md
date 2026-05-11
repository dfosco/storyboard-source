# `packages/storyboard/src/core/comments/auth.js`

<!--
source: packages/storyboard/src/core/comments/auth.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

This module owns personal access token persistence and validation for the comments system. It keeps authentication state entirely in localStorage and performs a GitHub permission probe before the rest of the comments stack is allowed to run.

## Composition

It exports token getters/setters, cached-user access, a boolean authentication check, and `validateToken()`. Validation first hits the REST `/user` endpoint, then probes repository discussions via GraphQL using config from the comments subsystem.

```js
export async function validateToken(token) {
  const res = await fetch('https://api.github.com/user', {
    headers: { Authorization: `bearer ${token}` },
  })
  if (!res.ok) throw new Error('Invalid token — GitHub returned ' + res.status)
  const user = await res.json()
  const scopes = (res.headers.get('x-oauth-scopes') || '').split(',').map(s => s.trim()).filter(Boolean)
  const userInfo = { login: user.login, avatarUrl: user.avatar_url, scopes }
  await validateTokenPermissions(token)
  localStorage.setItem(USER_KEY, JSON.stringify(userInfo))
  return userInfo
}
```

## Dependencies

- [`packages/storyboard/src/core/comments/config.js`](./config.js.md) — Provides the configured repository to probe for discussion access.

## Dependents

- [`packages/storyboard/src/core/comments/index.js`](./index.js.md) — Re-exports auth helpers.
- [`packages/storyboard/src/core/comments/commentMode.js`](./commentMode.js.md) — Checks auth before enabling comment mode.
- [`packages/storyboard/src/core/comments/graphql.js`](./graphql.js.md) — Reads the PAT at request time.
- `packages/storyboard/src/core/comments/ui/AuthModal.jsx` — Saves and validates tokens from the sign-in flow.
- `packages/storyboard/src/core/comments/ui/mount.js` — Reads cached user state for UI bootstrapping.
- [`packages/storyboard/src/core/comments/auth.test.js`](./auth.test.js.md) — Covers token storage and permission probing.

## Notes

A successful REST identity lookup is not enough; the module only caches the user after the GraphQL repository/discussions probe succeeds.
