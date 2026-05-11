# `packages/storyboard/src/internals/canvas/widgets/ExpandedPaneTopBar.jsx`

<!--
source: packages/storyboard/src/internals/canvas/widgets/ExpandedPaneTopBar.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

`ExpandedPaneTopBar.jsx` is the per-pane toolbar used inside [`ExpandedPane.jsx`](./ExpandedPane.jsx.md). It reuses the same config-driven feature model as [`WidgetChrome.jsx`](./WidgetChrome.jsx.md), but renders it in a dark fullscreen/split-pane context instead of the hover toolbar under a widget.

It gives expanded panes a consistent label, widget icon, optional leader crown, feature buttons, and close affordance.

## Composition

```jsx
export default function ExpandedPaneTopBar({
  label, widgetType, widgetProps, showClose, onClose,
  actions, features, getState, onAction,
})
```

Important helpers:

- `resolveFeatureDisplay(feature, getState)` swaps icons/labels for toggle features.
- `isNamedIcon()` distinguishes `Icon` names from inline SVG/react nodes.
- `getWidgetMeta(widgetType)` pulls labels/icons from [`widgetConfig.js`](./widgetConfig.js.md).

Render structure:

```jsx
{features?.map((feature) => (
  <Tooltip text={featureLabel}><button onClick={() => onAction?.(feature.action)} /></Tooltip>
))}
```

Supported inputs:

- config-driven `features` arrays
- legacy inline `actions`
- `widgetProps.role === 'leader'` for the crown decoration
- `showClose` to place the rightmost fullscreen exit button

## Dependencies

- Primer `Tooltip` and Octicons.
- [`widgetConfig.js`](./widgetConfig.js.md) for widget metadata.
- `widgetIcons.jsx` and shared `Icon.jsx` resolution.
- [`ExpandedPane.jsx`](./ExpandedPane.jsx.md) as the parent container.

## Dependents

- Used exclusively by [`ExpandedPane.jsx`](./ExpandedPane.jsx.md).
- Covered by `ExpandedPaneTopBar.test.jsx`.

## Notes

- This file intentionally mirrors the action model from [`WidgetChrome.jsx`](./WidgetChrome.jsx.md) so toolbar config can target both `toolbar` and `fullbar` / `splitbar` surfaces.
