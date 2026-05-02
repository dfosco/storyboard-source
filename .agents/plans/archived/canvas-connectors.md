# Canvas Connectors — Implementation Plan

## Problem
Add connector lines (Bézier SVG curves) between canvas widgets, stored as first-class objects in the JSONL event stream.

## Approach
Custom SVG overlay inside the existing canvas zoom layer. Connectors are JSONL objects with `type: "connector"`, materialized alongside widgets. Widgets gain a `connectorIds` array for bookkeeping.

## Todos

### 1. `widgets.config.json` — connector type schema
Add a `connector` entry to the widgets config with its data model (no UI props needed since connectors aren't rendered via WidgetChrome).

### 2. Materializer — connector events
Add `connector_added` and `connector_removed` event types to `materializer.js`. Connectors live in a separate `connectors` array on canvas state (not mixed into `widgets`).

### 3. Server — connector CRUD endpoints
Add `POST /connector` and `DELETE /connector` routes in `server.js`. POST creates connector + updates both widgets' `connectorIds`. DELETE removes connector + cleans up `connectorIds`.

### 4. Client API — connector functions
Add `addConnector()` and `removeConnector()` to `canvasApi.js`.

### 5. `ConnectorLayer.jsx` — SVG rendering
New component rendering Bézier paths between widget anchor points. Lives inside the zoom layer, same coordinate space as widgets.

### 6. `CanvasPage.jsx` — integration
- Track `localConnectors` state alongside `localWidgets`
- Render `<ConnectorLayer>` inside the zoom div
- Wire up connector add/remove lifecycle
- Handle connector cleanup on widget delete

### 7. `WidgetChrome.jsx` — anchor port UI
Add draggable anchor ports (top/bottom/left/right) visible on hover. Dragging from a port initiates connector creation.

## Out of scope (per plan)
- `meta` field usage (reserved but empty)
- Copilot CLI backend wiring (todo 7 from canvas plan)
- Multiple connector visual types (only `default` for now)
