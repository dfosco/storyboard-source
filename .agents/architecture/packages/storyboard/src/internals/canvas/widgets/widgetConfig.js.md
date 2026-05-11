# `packages/storyboard/src/internals/canvas/widgets/widgetConfig.js`

<!--
source: packages/storyboard/src/internals/canvas/widgets/widgetConfig.js
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

`widgetConfig.js` is the config loader for the canvas widget system. It reads `widgets.config.json`, resolves config variables, and exposes a normalized API that both [`WidgetChrome.jsx`](./WidgetChrome.jsx.md) and the registry in [`index.js`](./index.js.md) use to decide what widgets exist, what features they expose, whether they resize/expand, and how connectors behave.

This file is the declarative center of the widget layer: components implement behavior, but their toolbar surfaces, metadata, and connector contracts come from here.

## Composition

```js
export const schemas = buildSchemas()
export const widgetTypes = buildWidgetTypes()
```

Config shape it normalizes:

- top-level `variables` for `$token` substitution
- `widgets.{type}` definitions with `label`, `icon`, `props`, `features`, `resize`, `expandable`, `splitScreen`, `interactGate`, and `connectors`
- top-level `connectorDefaults`

Key helpers:

- `resolveVar()` / `resolveFeature()` expand `$variables` in feature configs.
- `configPropToSchema()` maps config `default` → runtime `defaultValue`.
- `getFeatures()` and `getFeaturesForSurface()` filter by `toolbar`, `fullbar`, and `splitbar`, including prod-only gating.
- `isResizable()`, `isExpandable()`, `isSplitScreenCapable()`, `getInteractGate()`, and `getWidgetMeta()` expose common UI predicates.
- `getConnectorConfig()`, `getAnchorState()`, `getConnectorDefaults()`, and `canAcceptConnection()` expose connector rules.

## Dependencies

- `widgets.config.json` as the single source of truth.
- Runtime consumers including [`WidgetChrome.jsx`](./WidgetChrome.jsx.md), [`ExpandedPaneTopBar.jsx`](./ExpandedPaneTopBar.jsx.md), [`widgetProps.js`](./widgetProps.js.md), and canvas page/toolbar modules.

## Dependents

- Canvas UI: `CanvasPage.jsx`, `CanvasToolbar.jsx`, `CanvasControls.jsx`, `ConnectorLayer.jsx`, and `connectorGeometry.js`.
- Widget internals such as [`MarkdownBlock.jsx`](./MarkdownBlock.jsx.md), [`ImageWidget.jsx`](./ImageWidget.jsx.md), and [`FigmaEmbed.jsx`](./FigmaEmbed.jsx.md).
- Command palette and tests also import it directly.

## Notes

- Surface filtering is what lets the same feature config drive both [`WidgetChrome.jsx`](./WidgetChrome.jsx.md) hover controls and fullscreen bars in [`ExpandedPaneTopBar.jsx`](./ExpandedPaneTopBar.jsx.md).
- `getMenuWidgetTypes()` intentionally excludes paste-only or internal widget types from the create menu.
