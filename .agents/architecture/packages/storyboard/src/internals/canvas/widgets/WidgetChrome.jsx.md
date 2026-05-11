# `packages/storyboard/src/internals/canvas/widgets/WidgetChrome.jsx`

<!--
source: packages/storyboard/src/internals/canvas/widgets/WidgetChrome.jsx
category: storyboard
importance: medium
-->

> [← Architecture Index](../../../../../../architecture.index.md)

## Goal

`WidgetChrome.jsx` is the universal chrome wrapper around every canvas widget. [`CanvasPage.jsx`](../CanvasPage.jsx.md) renders it around the widget body so the canvas gets one consistent hover toolbar, selection handle, connector ports, and interact gate regardless of widget type.

This file also houses the small chrome-only feature renderers: the overflow menu, dropdown features, the hub role picker, and the sticky-note color picker. In practice this is the "ChromeWrappedWidget" layer the rest of the widget system depends on, sitting between [`index.js`](./index.js.md) widget resolution and the widget’s own imperative `handleAction()` API.

## Composition

```jsx
export default function WidgetChrome({
  widgetId, widgetType, features = [], selected = false,
  multiSelected = false, widgetProps, widgetRef,
  onSelect, onAction, onUpdate, onConnectorDragStart,
  roleOptions = [], currentRole = '', onRoleChange,
  children, readOnly = false,
})
```

Key rendered structure:

- Outer `chromeContainer` carries `data-widget-id` and `data-agent-status={widgetProps?.status}` for CSS-driven status styling.
- Inner `widgetSlot` carries `data-widget-selected` and `data-widget-interacting` so canvas drag/select logic can inspect state without coupling to widget internals.
- Optional interact overlay is driven by `getInteractGate(widgetType)` from [`widgetConfig.js`](./widgetConfig.js.md).
- Optional connector ports are rendered from `getConnectorConfig(widgetType)` and call `onConnectorDragStart(widgetId, anchor, e)`.
- Bottom toolbar swaps between a rest-state trigger dot and hover/selected controls.

Feature routing is split in three ways:

```jsx
if (actionId === 'delete' || actionId === 'copy') onAction?.(actionId)
else if (widgetRef?.current?.handleAction) widgetRef.current.handleAction(actionId, { altKey: e.altKey })
else onAction?.(actionId)
```

Special chrome-only buttons:

- `ColorPickerFeature` updates `onUpdate?.({ color })` for sticky notes.
- `RoleFeature` renders the hub role picker and calls `onRoleChange(role.id)`.
- `DropdownFeature` and `WidgetOverflowMenu` render menu-backed features from config.
- `useAltKey()` uses `useSyncExternalStore` so alt-modified labels/actions stay in sync during concurrent renders.

Notable feature behavior:

- `data-agent-status` drives agent-ready/error chrome states for terminal/agent widgets.
- `toggle-private`, `show-code`, `expand-output`, and `expand` all rewrite labels/icons based on widget state or Alt.
- The select handle is always the right-most drag affordance.
- Role picker uses the crown button; color picker uses the colored dot button.

## Dependencies

- [`widgetConfig.js`](./widgetConfig.js.md) for feature lists, interact gates, and connector anchors.
- `widgetIcons.jsx` for icon lookup.
- Primer `Tooltip` plus Octicons for hover affordances.
- Widget refs supplied by [`CanvasPage.jsx`](../CanvasPage.jsx.md) and components from [`index.js`](./index.js.md).

## Dependents

- Primary consumer: [`packages/storyboard/src/internals/canvas/CanvasPage.jsx`](../CanvasPage.jsx.md).
- Canvas interaction tests import it directly to verify multiselect, drag/drop, and bridge behavior.
- All widgets listed in [`index.js`](./index.js.md) rely on it indirectly because CanvasPage wraps every resolved widget with this chrome.

## Notes

- Read-only mode still shows prod-safe features if config leaves any enabled.
- Interact gating exits on outside click or double-Escape; the first Escape is intentionally passed through to the widget.
- Connector anchors can be `available`, `disabled`, or `unavailable`; only the last state removes the port entirely.
