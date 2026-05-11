# `packages/storyboard/src/core/canvas/hub-roles.js`

<!--
source: packages/storyboard/src/core/canvas/hub-roles.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../architecture.index.md)

## Goal

[`packages/storyboard/src/core/canvas/hub-roles.js`](./hub-roles.js.md) loads the role catalog used by canvas hubs. It turns markdown files in `.agents/roles/` into structured metadata so the canvas server can assign default and unique roles without hardcoding the full role list.

## Composition

The module starts with a tiny fallback catalog so hubs still work when the repo has no custom role files:

```js
const FALLBACK_ROLES = [
  { id: 'leader', title: 'Leader', type: 'unique', default: false, file: '.agents/roles/leader.role.md' },
  { id: 'member', title: 'Member', type: 'shared', default: true, file: '.agents/roles/member.role.md' },
]
```

`parseFrontmatter()` extracts simple YAML-like key/value pairs from each role markdown file, then `listHubRoles(rootDir)` filters transient roles, normalizes `unique` vs `shared`, and ensures exactly one default:

```js
export function listHubRoles(rootDir) {
  const dir = join(rootDir, ROLES_DIR)
  if (!existsSync(dir)) return FALLBACK_ROLES
  const files = readdirSync(dir).filter((f) => f.endsWith('.role.md'))
```

```js
if (!roles.some((r) => r.default)) {
  const member = roles.find((r) => r.id === 'member')
  if (member) member.default = true
  else roles[0].default = true
}
```

`getDefaultRoleId()` is the narrow helper consumed by hub assignment code.

## Dependencies

- Node `fs` and `path` for role file discovery and reads.

## Dependents

Derived by import search:

- `packages/storyboard/src/core/canvas/server.js` — computes hub role state for connected agent/terminal graphs.

## Notes

Role discovery is filesystem-driven, so changing role behavior is mostly a content operation in `.agents/roles/` rather than a JavaScript change. Transient roles are intentionally hidden from user-selectable lists.
