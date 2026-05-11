# `packages/storyboard/src/internals/Icon.jsx`
<!--
source: packages/storyboard/src/internals/Icon.jsx
category: storyboard
importance: medium
-->
> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

A unified icon renderer that normalises icons from multiple sources under a single `<Icon name="..." />` API. The namespace prefix in the `name` prop determines the source library: `primer/` → Primer Octicons, `feather/` → Feather Icons, `iconoir/` → manually registered Iconoir SVGs. Unprefixed names resolve to custom SVG icons defined inline in the component.

## Composition

```jsx
// Custom icons (inline SVG paths, fill or stroke-based)
const customIcons = {
  'home': { viewBox, path },
  'prototype': { viewBox, strokePaths },
  'canvas': { viewBox, fillPaths },
  'component': { viewBox, strokePaths },
  'agents', 'codex', 'claude', 'flow', 'sticky-note', ...
}

// Iconoir icons registered manually (stroke SVGs)
const iconoirIcons = { 'keyframe': ..., 'key-command': ..., ... }

export default function Icon({ name, size = 16, color, rotate, flipX, offsetX, offsetY, strokeWeight }) {
  if (name.startsWith('primer/'))  return <PrimerIcon name={...} size={size} />
  if (name.startsWith('feather/')) return <FeatherIcon name={...} size={size} />
  if (name.startsWith('iconoir/')) return <IconoirIcon name={...} size={size} />
  return <CustomIcon name={name} size={size} />
}
```

Supports `rotate` (CSS transform), `flipX` (horizontal mirror), `offsetX`/`offsetY` (fine-positioning nudges), and `strokeWeight` (Iconoir/custom stroke width).

## Dependencies

- `@primer/octicons-react` — Primer icon library
- `feather-icons` — Feather icon set (loaded via `getIcon()`)
- Custom inline SVGs — defined as constants in the file

## Dependents

- [`CommandPalette/CommandPalette.jsx`](./CommandPalette/CommandPalette.jsx.md) — palette item icons
- [`Viewfinder.jsx`](./Viewfinder.jsx.md) — artifact type icons
- [`../core/ui/Icon.jsx`](../core/ui/Icon.jsx.md) — a parallel core-layer version for the CoreUIBar
- [`index.js`](./index.js.md) — exports for external use
- Any canvas widget or toolbar UI that needs icons

## Notes

- The `primer/` namespace is prefixed rather than using `@primer/octicons-react` directly, so the palette/viewfinder code never needs to import octicons individually — it just calls `<Icon name="primer/repo" />`.
- `feather-icons` is the only external npm dep here; `@primer/octicons-react` components are dynamically resolved by name via a registry map.
- Custom icons include product-specific SVGs (Claude, Codex, agents) that aren't in any public icon library.
